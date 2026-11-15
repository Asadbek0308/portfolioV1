import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

const GEOJSON_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector/geojson/ne_110m_admin_0_countries.geojson";

const DEFAULT_POV = { lat: 15, lng: 10, altitude: 2.4 };
const ZOOM_ALTITUDE = 0.9;
const AVG_CRUISE_KMH = 900; // rough commercial flight speed, for the duration estimate

// common abbreviations that don't literally appear in the Natural Earth
// NAME field, so a plain substring search would miss them
const COUNTRY_ALIASES = {
  usa: "united states",
  us: "united states",
  america: "united states",
  uk: "united kingdom",
  britain: "united kingdom",
  uae: "united arab emirates",
  drc: "congo",
  car: "central african republic",
  prc: "china",
  roc: "taiwan",
  ksa: "saudi arabia",
  nz: "new zealand",
  png: "papua new guinea",
};

let _geojsonCache = null;
let _geojsonPromise = null;
function loadCountriesGeoJSON() {
  if (_geojsonCache) return Promise.resolve(_geojsonCache);
  if (!_geojsonPromise) {
    _geojsonPromise = fetch(GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then((geo) => {
        _geojsonCache = geo;
        return geo;
      })
      .catch((err) => {
        _geojsonPromise = null; // allow retry on next call
        throw err;
      });
  }
  return _geojsonPromise;
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function formatNumber(n) {
  if (n === undefined || n === null || n < 0) return null;
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
}

function formatDuration(hours) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function countryId(f) {
  return f?.properties?.ADM0_A3 || f?.properties?.NAME;
}

// great-circle distance between two lat/lng points, in km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// true great-circle midpoint (not a naive lat/lng average, which drifts off
// the sphere for points that are far apart)
function greatCircleMidpoint(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1),
    λ1 = toRad(lng1);
  const φ2 = toRad(lat2),
    λ2 = toRad(lng2);
  const Bx = Math.cos(φ2) * Math.cos(λ2 - λ1);
  const By = Math.cos(φ2) * Math.sin(λ2 - λ1);
  const φm = Math.atan2(Math.sin(φ1) + Math.sin(φ2), Math.sqrt((Math.cos(φ1) + Bx) ** 2 + By ** 2));
  const λm = λ1 + Math.atan2(By, Math.cos(φ1) + Bx);
  return { lat: toDeg(φm), lng: toDeg(λm) };
}

// point-of-view that frames both route endpoints: centers on the arc's
// midpoint and pulls the camera back further the farther apart they are
function routeFramingView(start, end) {
  const { lat, lng } = greatCircleMidpoint(start.lat, start.lng, end.lat, end.lng);
  const angularDistance = haversineKm(start.lat, start.lng, end.lat, end.lng) / 6371; // radians, 0..π
  const altitude = Math.min(3.2, Math.max(0.9, 0.5 + angularDistance * 1.3));
  return { lat, lng, altitude };
}

// normalizes any CSS color (hex, rgb, hsl, oklch — daisyUI v5 themes use
// oklch) into a plain "rgb(r, g, b)" string that three.js can parse
let _probeCanvas;
function normalizeColor(cssColor) {
  if (!cssColor) return null;
  _probeCanvas = _probeCanvas || document.createElement("canvas");
  _probeCanvas.width = 1;
  _probeCanvas.height = 1;
  const ctx = _probeCanvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

// reads a color by rendering an invisible element with the given daisyUI
// utility class and inspecting its computed style
function sampleThemeColor(className, cssProp) {
  const el = document.createElement("div");
  el.className = className;
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;pointer-events:none;";
  document.body.appendChild(el);
  const raw = getComputedStyle(el)[cssProp];
  document.body.removeChild(el);
  return normalizeColor(raw);
}

function readThemeColors() {
  return {
    base100: sampleThemeColor("bg-base-100", "backgroundColor") || "rgb(255, 255, 255)",
    base300: sampleThemeColor("border border-base-300", "borderColor") || "rgb(226, 232, 240)",
    baseContent: sampleThemeColor("text-base-content", "color") || "rgb(17, 17, 17)",
    primary: sampleThemeColor("text-primary", "color") || "rgb(255, 106, 26)",
  };
}

// re-samples whenever the site's theme attribute/class changes (covers both
// daisyUI's data-theme convention and a plain "dark" class toggle)
function useThemeColors() {
  const [colors, setColors] = useState(() =>
    typeof document !== "undefined"
      ? readThemeColors()
      : { base100: "rgb(255,255,255)", base300: "rgb(226,232,240)", baseContent: "rgb(17,17,17)", primary: "rgb(255,106,26)" }
  );

  useEffect(() => {
    let frame = null;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setColors((prev) => {
          const next = readThemeColors();
          const same =
            prev.base100 === next.base100 &&
            prev.base300 === next.base300 &&
            prev.baseContent === next.baseContent &&
            prev.primary === next.primary;
          return same ? prev : next;
        });
      });
    };
    scheduleUpdate();
    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return colors;
}

function toRgba(rgb, alpha) {
  const nums = rgb.match(/\d+(\.\d+)?/g);
  if (!nums) return rgb;
  const [r, g, b] = nums;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// rough polygon centroid (mean of exterior-ring vertices) — good enough for
// placing a "this country" marker, not meant for precise geographic centroids
function countryCentroid(feature) {
  const polys =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  // use the largest ring by point count (main landmass) so archipelagos
  // don't get dragged toward a small outlying island
  let best = null;
  polys.forEach((poly) => {
    const ring = poly[0];
    if (!best || ring.length > best.length) best = ring;
  });
  let lngSum = 0,
    latSum = 0;
  best.forEach(([lng, lat]) => {
    lngSum += lng;
    latSum += lat;
  });
  return { lat: latSum / best.length, lng: lngSum / best.length };
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100";

const SearchSelect = memo(function SearchSelect({ label, options, value, onChange, placeholder, excludeId }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = options.filter((o) => o.id !== excludeId);
    if (!q) return base.slice(0, 50);
    const aliasTarget = COUNTRY_ALIASES[q];
    return base
      .filter((o) => {
        const name = o.name.toLowerCase();
        return name.includes(q) || (aliasTarget && name.includes(aliasTarget));
      })
      .slice(0, 50);
  }, [options, query, excludeId]);

  const commit = (o) => {
    onChange(o);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) commit(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative flex-1 min-w-[130px] max-w-[220px]">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${label}-listbox`}
        value={open ? query : value?.name || ""}
        placeholder={placeholder}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0); // new results: start from the top
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={`w-full text-xs font-mono px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 text-base-content/80 shadow-sm focus:outline-none focus:border-base-content/40 ${FOCUS_RING}`}
      />
      <span className="absolute -top-4 left-1 text-[10px] uppercase tracking-wide text-base-content/40">
        {label}
      </span>
      {open && (
        <div
          id={`${label}-listbox`}
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-52 overflow-y-auto bg-base-100 border border-base-300 rounded-lg shadow-lg"
        >
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-base-content/40 font-mono">no matches</div>
          )}
          {filtered.map((o, i) => (
            <button
              key={o.id}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => commit(o)}
              className={`block w-full text-left px-3 py-1.5 text-xs font-mono text-base-content/80 ${
                i === highlighted ? "bg-base-200" : "hover:bg-base-200"
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default function InteractiveEarthGlobe() {
  const wrapRef = useRef(null);
  const globeRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 520 });
  const [countries, setCountries] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [autoSpin, setAutoSpin] = useState(() => !prefersReducedMotion);
  const [startCountry, setStartCountry] = useState(null);
  const [endCountry, setEndCountry] = useState(null);
  const theme = useThemeColors();
  const webglSupported = useMemo(() => (typeof window !== "undefined" ? isWebGLAvailable() : true), []);
  const flyMs = prefersReducedMotion ? 0 : 1000;

  // keep the globe sized to its container — coalesced to one update per
  // animation frame instead of firing on every intermediate resize tick
  useEffect(() => {
    const el = wrapRef.current;
    let frame = null;
    const ro = new ResizeObserver((entries) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { width, height } = entries[0].contentRect;
        setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
      });
    });
    ro.observe(el);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  // geojson is fetched once per page load and reused across mounts/remounts
  // status already starts as "loading"; retry() resets it before calling this
  const fetchCountries = useCallback(() => {
    loadCountriesGeoJSON()
      .then((geo) => {
        setCountries(geo.features);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (webglSupported) fetchCountries();
  }, [webglSupported, fetchCountries]);

  const retryFetch = useCallback(() => {
    setStatus("loading");
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    if (globeRef.current) globeRef.current.pointOfView(DEFAULT_POV, 0);
  }, []);

  // cap device pixel ratio — rendering at full 3x retina resolution for a
  // full-bleed WebGL scene is one of the biggest perf costs on mobile/high-DPI
  useEffect(() => {
    const renderer = globeRef.current?.renderer?.();
    if (renderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, [size]);

  // pause the render loop entirely when the globe is off-screen or the tab
  // is backgrounded — pauseAnimation cancels the internal requestAnimationFrame
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let visible = true;
    const applyState = () => {
      const g = globeRef.current;
      if (!g) return;
      const shouldRun = visible && document.visibilityState === "visible";
      if (shouldRun) g.resumeAnimation();
      else g.pauseAnimation();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        applyState();
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    document.addEventListener("visibilitychange", applyState);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", applyState);
    };
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = autoSpin;
    controls.autoRotateSpeed = 0.4;
    controls.rotateSpeed = 2.2; // higher = stronger pull per pixel of drag
    controls.enableDamping = true; // lets the spin coast after you let go
    controls.dampingFactor = 0.08; // lower = longer coast, higher = stops sooner
  }, [autoSpin, size]);

  // lightweight cursor feedback on hover — set imperatively so hovering
  // doesn't trigger a re-render just to change a CSS cursor
  useEffect(() => {
    if (wrapRef.current) wrapRef.current.style.cursor = hovered ? "pointer" : "grab";
  }, [hovered]);

  const countryOptions = useMemo(
    () =>
      countries.map((f) => {
        const { lat, lng } = countryCentroid(f);
        return { id: countryId(f), name: f.properties.NAME, lat, lng };
      }),
    [countries]
  );

  const routePoints = useMemo(() => {
    const pts = [];
    if (startCountry) pts.push({ ...startCountry, role: "start" });
    if (endCountry) pts.push({ ...endCountry, role: "end" });
    return pts;
  }, [startCountry, endCountry]);

  const routeArcs = useMemo(() => {
    if (!startCountry || !endCountry) return [];
    return [
      {
        startLat: startCountry.lat,
        startLng: startCountry.lng,
        endLat: endCountry.lat,
        endLng: endCountry.lng,
      },
    ];
  }, [startCountry, endCountry]);

  const routeDistanceKm = useMemo(() => {
    if (!startCountry || !endCountry) return null;
    return haversineKm(startCountry.lat, startCountry.lng, endCountry.lat, endCountry.lng);
  }, [startCountry, endCountry]);

  // picking the second endpoint stops the idle spin so the route stays framed
  const pickStart = useCallback((c) => {
    setStartCountry(c);
    if (c && endCountry) setAutoSpin(false);
  }, [endCountry]);

  const pickEnd = useCallback((c) => {
    setEndCountry(c);
    if (c && startCountry) setAutoSpin(false);
  }, [startCountry]);

  const clearRoute = useCallback(() => {
    setStartCountry(null);
    setEndCountry(null);
  }, []);

  const swapRoute = useCallback(() => {
    setStartCountry(endCountry);
    setEndCountry(startCountry);
  }, [startCountry, endCountry]);

  // center the viewport on the arc's midpoint once both endpoints are picked
  useEffect(() => {
    if (!startCountry || !endCountry) return;
    globeRef.current?.pointOfView(routeFramingView(startCountry, endCountry), flyMs);
  }, [startCountry, endCountry, flyMs]);

  // flat, unshaded — color follows the site's theme (see effect below)
  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        shininess: 0,
        specular: 0x000000,
      }),
    []
  );

  useEffect(() => {
    globeMaterial.color.set(theme.base100);
  }, [globeMaterial, theme.base100]);

  const resetView = useCallback(() => {
    setSelected(null);
    globeRef.current?.pointOfView(DEFAULT_POV, flyMs);
  }, [flyMs]);

  const handlePolygonClick = useCallback(
    (feature, event, { lat, lng }) => {
      const id = countryId(feature);
      if (selected && countryId(selected) === id) {
        resetView();
        return;
      }
      setAutoSpin(false);
      setSelected(feature);
      globeRef.current?.pointOfView({ lat, lng, altitude: ZOOM_ALTITUDE }, flyMs);
    },
    [selected, resetView, flyMs]
  );

  const handlePolygonHover = useCallback((feature) => {
    setHovered(feature || null);
  }, []);

  // memoized so identity only changes when the values they depend on
  // actually change, not on every render (e.g. a resize-triggered one)
  const polygonAltitude = useCallback((d) => (selected === d ? 0.015 : 0.006), [selected]);
  const polygonCapColor = useCallback(
    (d) => (selected === d ? toRgba(theme.primary, 0.14) : theme.base100),
    [selected, theme.primary, theme.base100]
  );
  const polygonSideColor = useCallback(() => toRgba(theme.baseContent, 0.05), [theme.baseContent]);
  const polygonStrokeColor = useCallback(
    (d) => {
      if (selected === d) return theme.primary;
      if (hovered === d) return toRgba(theme.primary, 0.55);
      return theme.baseContent;
    },
    [selected, hovered, theme.primary, theme.baseContent]
  );
  const pointColorFn = useCallback(
    (d) => (d.role === "start" ? theme.baseContent : theme.primary),
    [theme.baseContent, theme.primary]
  );
  const pointLabelFn = useCallback((d) => d.name, []);
  const arcColorFn = useCallback(() => [theme.baseContent, theme.primary], [theme.baseContent, theme.primary]);

  const selectedInfo = selected
    ? {
        name: selected.properties.NAME_LONG || selected.properties.NAME,
        continent: selected.properties.CONTINENT,
        subregion: selected.properties.SUBREGION,
        pop: formatNumber(selected.properties.POP_EST),
        gdp: selected.properties.GDP_MD ? formatNumber(selected.properties.GDP_MD * 1e6) : null,
        iso: selected.properties.ISO_A2,
        income: selected.properties.INCOME_GRP,
      }
    : null;

  const flightHours = routeDistanceKm !== null ? routeDistanceKm / AVG_CRUISE_KMH : null;

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full min-h-[420px] sm:min-h-[520px] bg-base-100 rounded-2xl overflow-hidden select-none"
    >
      {!webglSupported ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-base-content/60 font-mono max-w-xs">
            Your browser doesn't support WebGL, so the interactive globe can't render here.
          </p>
        </div>
      ) : (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          rendererConfig={{ antialias: true, powerPreference: "high-performance", alpha: true }}
          globeMaterial={globeMaterial}
          showAtmosphere={false}
          showGraticules
          polygonsData={countries}
          polygonCapCurvatureResolution={8}
          polygonAltitude={polygonAltitude}
          polygonCapColor={polygonCapColor}
          polygonSideColor={polygonSideColor}
          polygonStrokeColor={polygonStrokeColor}
          polygonsTransitionDuration={300}
          onPolygonClick={handlePolygonClick}
          onPolygonHover={handlePolygonHover}
          pointsData={routePoints}
          pointLat="lat"
          pointLng="lng"
          pointColor={pointColorFn}
          pointRadius={0.4}
          pointAltitude={0.01}
          pointLabel={pointLabelFn}
          arcsData={routeArcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={arcColorFn}
          arcStroke={0.5}
          arcDashLength={0.4}
          arcDashGap={0.15}
          arcDashAnimateTime={prefersReducedMotion ? 0 : 2000}
          arcAltitudeAutoScale={0.4}
        />
      )}

      {status === "loading" && webglSupported && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-base-content/40 text-sm tracking-wide font-mono animate-pulse">
            loading country borders…
          </span>
        </div>
      )}
      {status === "error" && webglSupported && (
        <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-warning font-mono bg-warning/10 border border-warning/30 px-3 py-1.5 rounded-lg">
          <span>couldn't load country data</span>
          <button
            onClick={retryFetch}
            className={`underline hover:no-underline ${FOCUS_RING}`}
          >
            retry
          </button>
        </div>
      )}

      {webglSupported && (
        <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 z-10">
          <div className="flex flex-wrap items-start gap-2">
            <button
              onClick={() => setAutoSpin((v) => !v)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-base-content/80 shadow-sm transition-colors motion-reduce:transition-none ${FOCUS_RING}`}
            >
              {autoSpin ? "⏸ pause spin" : "▶ resume spin"}
            </button>
            {selected && (
              <button
                onClick={resetView}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-base-content/80 shadow-sm transition-colors motion-reduce:transition-none ${FOCUS_RING}`}
              >
                ↺ reset view
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2 mt-2">
            <SearchSelect
              label="From"
              options={countryOptions}
              value={startCountry}
              onChange={pickStart}
              placeholder="Start country…"
              excludeId={endCountry?.id}
            />
            <SearchSelect
              label="To"
              options={countryOptions}
              value={endCountry}
              onChange={pickEnd}
              placeholder="Destination…"
              excludeId={startCountry?.id}
            />
            {(startCountry || endCountry) && (
              <div className="flex items-center gap-1">
                <button
                  onClick={swapRoute}
                  title="Swap"
                  className={`text-xs px-2 py-1.5 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-base-content/80 shadow-sm transition-colors motion-reduce:transition-none ${FOCUS_RING}`}
                >
                  ⇄
                </button>
                <button
                  onClick={clearRoute}
                  title="Clear route"
                  className={`text-xs px-2 py-1.5 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-base-content/80 shadow-sm transition-colors motion-reduce:transition-none ${FOCUS_RING}`}
                >
                  ✕
                </button>
              </div>
            )}
            {routeDistanceKm !== null && (
              <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 text-base-content/80 shadow-sm whitespace-nowrap">
                {Math.round(routeDistanceKm).toLocaleString()} km
                <span className="text-base-content/40">
                  {" "}
                  · {Math.round(routeDistanceKm * 0.621371).toLocaleString()} mi · ~{formatDuration(flightHours)} flight
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {!selected && status === "ready" && webglSupported && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-base-content/40 font-mono">
          drag to rotate · click a country to zoom in · click again to zoom out
        </div>
      )}

      {selectedInfo && (
        <div className="absolute left-4 right-4 bottom-4 sm:left-auto sm:right-4 sm:bottom-auto sm:top-4 w-auto sm:w-64 bg-base-100 border border-base-300 rounded-xl p-4 text-base-content shadow-lg z-20">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-base font-semibold leading-tight pr-2">{selectedInfo.name}</h3>
            <button
              onClick={resetView}
              className={`text-base-content/40 hover:text-base-content shrink-0 rounded ${FOCUS_RING}`}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="text-[11px] uppercase tracking-wide text-base-content/40 mb-3">
            {[selectedInfo.continent, selectedInfo.subregion].filter(Boolean).join(" · ")}
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            {selectedInfo.pop && (
              <>
                <span className="text-base-content/60">Population</span>
                <span className="text-right font-mono">{selectedInfo.pop}</span>
              </>
            )}
            {selectedInfo.gdp && (
              <>
                <span className="text-base-content/60">GDP</span>
                <span className="text-right font-mono">${selectedInfo.gdp}</span>
              </>
            )}
            {selectedInfo.income && (
              <>
                <span className="text-base-content/60">Income group</span>
                <span className="text-right text-xs">{selectedInfo.income.replace(/^\d:\s*/, "")}</span>
              </>
            )}
            {selectedInfo.iso && (
              <>
                <span className="text-base-content/60">ISO code</span>
                <span className="text-right font-mono">{selectedInfo.iso}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}