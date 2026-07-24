// src/pages/AnimationDetail.jsx
import React, { lazy, Suspense, useState, useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

// 1. Scan recursively for renderable components across subfolders (lazy loaded)
const componentModules = import.meta.glob('../animationShowcase/**/*.jsx')

// 2. Scan recursively for raw source code as plain text strings (?raw query)
const rawSourceModules = import.meta.glob('../animationShowcase/**/*.jsx', {
  query: '?raw',
  import: 'default'
})

// Build formatted helper function for Titles
const formatTitle = (slug) => {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Build index mapping & structured list of all items dynamically
const ANIMATIONS_MAP = {}
const ANIMATIONS_LIST = []

Object.keys(componentModules).forEach((path) => {
  // Path example: '../animationShowcase/hover-interactions/GlowButton.jsx'
  const fileName = path.split('/').pop().replace(/\.jsx$/, '')
  
  // Format slug matching FilterProjects convention
  const slug = fileName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  const item = {
    slug,
    title: formatTitle(slug),
    Component: lazy(componentModules[path]),
    getSourceCode: rawSourceModules[path]
  }

  ANIMATIONS_MAP[slug] = item
  ANIMATIONS_LIST.push(item)
})

export default function AnimationDetail() {
  const { animationName } = useParams()
  const [activeTab, setActiveTab] = useState('preview') // 'preview' | 'code'
  const [rawCode, setRawCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loadingCode, setLoadingCode] = useState(false)
  
  // State key to trigger forced re-mount when resetting animations
  const [resetKey, setResetKey] = useState(0)

  const target = ANIMATIONS_MAP[animationName]

  // Reset tab, cached raw code, and reset key whenever the URL slug changes
  useEffect(() => {
    setActiveTab('preview')
    setRawCode('')
    setResetKey(0)
  }, [animationName])

  // Compute current, previous, and next animation details
  const { currentIndex, prevAnimation, nextAnimation } = useMemo(() => {
    if (!ANIMATIONS_LIST.length || !animationName) {
      return { currentIndex: -1, prevAnimation: null, nextAnimation: null }
    }
    const index = ANIMATIONS_LIST.findIndex((item) => item.slug === animationName)
    if (index === -1) {
      return { currentIndex: -1, prevAnimation: null, nextAnimation: null }
    }

    const total = ANIMATIONS_LIST.length
    const prevIndex = (index - 1 + total) % total
    const nextIndex = (index + 1) % total

    return {
      currentIndex: index,
      prevAnimation: ANIMATIONS_LIST[prevIndex],
      nextAnimation: ANIMATIONS_LIST[nextIndex]
    }
  }, [animationName])

  // Convert URL slug to human-readable title
  const displayTitle = useMemo(() => {
    return target ? target.title : formatTitle(animationName || 'Animation')
  }, [target, animationName])

  // Lazy load raw code text when switching to Code tab
  const handleTabChange = async (tab) => {
    setActiveTab(tab)
    if (tab === 'code' && !rawCode && target?.getSourceCode) {
      setLoadingCode(true)
      try {
        const codeText = await target.getSourceCode()
        setRawCode(codeText)
      } catch (err) {
        setRawCode('// Failed to load source code.')
      } finally {
        setLoadingCode(false)
      }
    }
  }

  const handleCopy = () => {
    if (!rawCode) return
    navigator.clipboard.writeText(rawCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setResetKey((prev) => prev + 1)
  }

  if (!target) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 text-center bg-base-100 text-base-content font-sans">
        <h2 className="text-3xl font-bold mb-4 tracking-tight">Animation Not Found</h2>
        <p className="text-base-content/60 mb-8 max-w-sm">
          No component matching <code className="bg-base-200 px-2 py-1 rounded text-xs">{animationName}</code> was found.
        </p>
        <Link to="/animations" className="px-5 py-2.5 rounded-full bg-base-content text-base-100 text-xs font-mono font-medium hover:opacity-90 transition-opacity">
          ← Back to All Animations
        </Link>
      </div>
    )
  }

  const { Component } = target

  return (
    <div className="mt-20 min-h-screen bg-base-100 text-base-content px-6 py-12 max-w-7xl mx-auto font-sans flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-base-content/10 pb-6 mb-8 gap-4">
          <div>
            <Link
              to="/animations"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-base-content/50 hover:text-base-content transition-colors mb-2"
            >
              ← Back to Showcase
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {displayTitle}
            </h1>
          </div>

          {/* Controls: Reset + View Toggle */}
          <div className="flex items-center gap-3">
            {activeTab === 'preview' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-base-200 hover:bg-base-300 text-base-content/80 hover:text-base-content text-xs font-mono transition-colors"
                title="Restart Animation"
              >
                <span>Reset</span>
              </button>
            )}

            <div className="flex items-center gap-2 p-1 bg-base-200 rounded-full text-xs font-mono">
              <button
                onClick={() => handleTabChange('preview')}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  activeTab === 'preview'
                    ? 'bg-base-content text-base-100 shadow-md'
                    : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => handleTabChange('code')}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  activeTab === 'code'
                    ? 'bg-base-content text-base-100 shadow-md'
                    : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                Code
              </button>
            </div>
          </div>
        </div>

        {/* Main Panel */}
        {activeTab === 'preview' ? (
          <Suspense
            fallback={
              <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3 bg-base-200/50 rounded-2xl">
                <div className="w-6 h-6 border-2 border-base-content/30 border-t-base-content rounded-full animate-spin" />
                <span className="text-xs font-mono text-base-content/50">Loading bundle...</span>
              </div>
            }
          >
            {/* key={resetKey} forces React to unmount and re-mount the component on reset */}
            <div
              key={resetKey}
              className="w-full min-h-[60vh] flex justify-center items-center rounded-2xl bg-base-200/30 border border-base-content/5 p-6 overflow-hidden"
            >
              <Component />
            </div>
          </Suspense>
        ) : (
          <div className="relative w-full rounded-2xl bg-base-300 border border-base-content/10 overflow-hidden">
            {/* Code Header Bar */}
            <div className="flex justify-between items-center px-6 py-3 bg-base-200/80 border-b border-base-content/10 text-xs font-mono">
              <span className="text-base-content/60">{animationName}.jsx</span>
              <button
                onClick={handleCopy}
                disabled={loadingCode || !rawCode}
                className="px-3 py-1 rounded bg-base-content/10 hover:bg-base-content/20 text-base-content transition-colors font-mono text-xs"
              >
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Raw Code Area */}
            {loadingCode ? (
              <div className="p-12 text-center text-xs font-mono text-base-content/50">
                Loading code...
              </div>
            ) : (
              <pre className="p-6 text-xs font-mono overflow-auto overscroll-contain text-base-content/90 leading-relaxed max-h-[70vh] selection:bg-base-content selection:text-base-100">
  <code>{rawCode}</code>
</pre>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation Bar (Previous / Next Buttons) */}
      {prevAnimation && nextAnimation && (
        <div className="mt-12 pt-8 border-t border-base-content/10 flex items-center justify-between gap-4">
          {/* Previous Link */}
          <Link
            to={`/animations/${prevAnimation.slug}`}
            className="group flex flex-col items-start gap-1 p-3 -ml-3 rounded-xl hover:bg-base-200/50 transition-all max-w-[45%]"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-base-content/40 group-hover:text-base-content/70 transition-colors flex items-center gap-1">
              ← Previous
            </span>
            <span className="text-sm md:text-base font-semibold text-base-content/80 group-hover:text-base-content transition-colors truncate w-full">
              {prevAnimation.title}
            </span>
          </Link>

          {/* Indicator */}
          <div className="hidden sm:block text-xs font-mono text-base-content/30">
            {currentIndex + 1} / {ANIMATIONS_LIST.length}
          </div>

          {/* Next Link */}
          <Link
            to={`/animations/${nextAnimation.slug}`}
            className="group flex flex-col items-end text-right gap-1 p-3 -mr-3 rounded-xl hover:bg-base-200/50 transition-all max-w-[45%]"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-base-content/40 group-hover:text-base-content/70 transition-colors flex items-center gap-1">
              Next →
            </span>
            <span className="text-sm md:text-base font-semibold text-base-content/80 group-hover:text-base-content transition-colors truncate w-full">
              {nextAnimation.title}
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}