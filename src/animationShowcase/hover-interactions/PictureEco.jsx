import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const DEFAULT_IMAGE =
  'https://media.base44.com/images/public/69cbcd44d3da2a5cef013f5e/044747fea_image_src_mo0199j0.png';

const FPS = 60; // frame-rate assumption used to convert layerDelay (seconds) into a history-buffer offset

/**
 * MouseLayerStack
 *
 * Stacks the same image N times. The smallest copy sits on top (highest
 * z-index), each one behind it is slightly bigger, and every layer's
 * center chases the mouse — with a growing delay per layer, so the stack
 * trails behind the cursor like a rubber-band chain instead of moving as
 * one rigid block.
 *
 * How the delay works: every animation frame, the current mouse position
 * is pushed onto a rolling history buffer. Layer i reads its target from
 * `i * layerDelay` seconds back in that buffer, instead of using GSAP's
 * `delay`/`stagger` on a tween. Delay/stagger only apply once, when a tween
 * starts — a fast or frequent mousemove stream keeps overwriting those
 * tweens before the delay elapses, so higher-index layers would barely
 * move. Reading from real elapsed history has no such interruption problem
 * and works the same whether layerCount is 6 or 60.
 *
 * Props
 * ---------------------------------------------------------------------
 * imageSrc     string   image used for every layer
 * layerCount   number   how many copies to stack
 * baseSize     number   px size (width & height) of the smallest/top layer
 * sizeStep     number   px added to each subsequent (bigger) layer
 * layerDelay   number   seconds each layer lags behind the one in front of it
 * duration     number   seconds each layer's own follow tween takes (how
 *                        smoothly it eases toward its delayed target)
 * xAxis        bool     if false, layers never move horizontally
 * yAxis        bool     if false, layers never move vertically
 * moveStrength number   0–1, how far toward the mouse the layers travel
 *                        (1 = center lands exactly on the cursor)
 * ease         string   GSAP ease for the follow tween
 */
const MouseLayerStack = ({
  imageSrc = DEFAULT_IMAGE,
  layerCount = 10,
  baseSize = 160,
  sizeStep = 90,
  layerDelay = 0.06,
  duration = 0.4,
  xAxis = true,
  yAxis = true,
  moveStrength = 1,
  ease = 'power3.out',
}) => {
  const containerRef = useRef(null);
  const layerRefs = useRef([]);
  const targetRef = useRef({ x: 0, y: 0 });
  const historyRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const layers = layerRefs.current.slice(0, layerCount).filter(Boolean);

    // Anchor every layer centered on its own position; x/y (animated below)
    // then move it relative to that centered baseline.
    gsap.set(layers, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

    // Enough buffered frames to cover the slowest (last) layer's delay.
    const maxDelayFrames = Math.max(1, Math.round((layerCount - 1) * layerDelay * FPS)) + 2;
    historyRef.current = [];

    // One persistent quickTo setter per axis per layer — cheap to call every
    // frame, and each call just smoothly redirects the layer's own tween.
    const xSetters = layers.map((el) => gsap.quickTo(el, 'x', { duration, ease }));
    const ySetters = layers.map((el) => gsap.quickTo(el, 'y', { duration, ease }));

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetRef.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      };
    };
    container.addEventListener('mousemove', handleMouseMove);

    const tick = () => {
      const history = historyRef.current;
      history.push({ x: targetRef.current.x, y: targetRef.current.y });
      if (history.length > maxDelayFrames + 1) history.shift();

      layers.forEach((_, index) => {
        const frameOffset = Math.round(index * layerDelay * FPS);
        const sampleIndex = Math.max(0, history.length - 1 - frameOffset);
        const sample = history[sampleIndex] || { x: 0, y: 0 };

        xSetters[index](xAxis ? sample.x * moveStrength : 0);
        ySetters[index](yAxis ? sample.y * moveStrength : 0);
      });
    };

    gsap.ticker.add(tick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      gsap.ticker.remove(tick);
      gsap.killTweensOf(layers);
    };
  }, [xAxis, yAxis, moveStrength, layerDelay, duration, ease, layerCount]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-neutral-950"
    >
      {Array.from({ length: layerCount }).map((_, index) => {
        const size = baseSize + index * sizeStep;
        return (
          <img
            key={index}
            ref={(el) => {
              layerRefs.current[index] = el;
            }}
            src={imageSrc}
            alt=""
            aria-hidden={index > 0}
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full object-cover shadow-2xl"
            style={{
              width: size,
              height: size,
              zIndex: layerCount - index,
            }}
          />
        );
      })}
    </div>
  );
};

export default MouseLayerStack;