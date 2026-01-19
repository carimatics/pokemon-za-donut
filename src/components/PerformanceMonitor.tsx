import { useEffect, useState } from 'react'
import { getPerformanceMetrics } from '@/lib/analytics'

interface PerformanceStats {
  memory: number
  fps: number
  loadTime: number | null
  renderCount: number
}

/**
 * Development-only performance monitoring dashboard
 * Displays real-time performance metrics in the bottom-left corner
 */
export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    memory: 0,
    fps: 0,
    loadTime: null,
    renderCount: 0,
  })
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Only run in development
    if (import.meta.env.PROD) return

    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number

    // Get initial page load metrics
    const perfMetrics = getPerformanceMetrics()
    if (perfMetrics) {
      setStats(prev => ({
        ...prev,
        loadTime: Math.round(perfMetrics.loadTime),
      }))
    }

    // FPS calculation
    const calculateFPS = () => {
      frameCount++
      rafId = requestAnimationFrame(calculateFPS)
    }

    // Update stats every second
    const interval = setInterval(() => {
      const currentTime = performance.now()
      const delta = currentTime - lastTime
      const currentFPS = Math.round((frameCount * 1000) / delta)

      // Get memory info (only available in Chrome)
      let memoryMB = 0
      if ('memory' in performance && performance.memory) {
        const memory = performance.memory as {
          usedJSHeapSize: number
          jsHeapSizeLimit: number
        }
        memoryMB = Math.round(memory.usedJSHeapSize / 1048576)
      }

      setStats(prev => ({
        ...prev,
        memory: memoryMB,
        fps: currentFPS,
        renderCount: prev.renderCount + 1,
      }))

      frameCount = 0
      lastTime = currentTime
    }, 1000)

    rafId = requestAnimationFrame(calculateFPS)

    return () => {
      clearInterval(interval)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Don't render in production
  if (import.meta.env.PROD) return null

  // Hidden state
  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono hover:bg-black transition-colors z-50"
        title="Show performance monitor"
      >
        📊
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white rounded shadow-lg text-xs font-mono z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/20">
        <div className="flex items-center gap-2">
          <span className="text-green-400">●</span>
          <span className="font-semibold">Performance Monitor</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-white/10 px-2 py-1 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="hover:bg-white/10 px-2 py-1 rounded transition-colors"
            title="Hide"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {/* Basic metrics - always visible */}
        <div className="grid grid-cols-2 gap-3">
          <MetricItem
            label="FPS"
            value={stats.fps}
            unit=""
            status={getFPSStatus(stats.fps)}
          />
          {stats.memory > 0 && (
            <MetricItem
              label="Memory"
              value={stats.memory}
              unit="MB"
              status={getMemoryStatus(stats.memory)}
            />
          )}
        </div>

        {/* Expanded metrics */}
        {isExpanded && (
          <>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="space-y-1.5">
                {stats.loadTime !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Load Time:</span>
                    <span className={getLoadTimeClass(stats.loadTime)}>
                      {stats.loadTime}ms
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Updates:</span>
                  <span className="text-white">{stats.renderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Route:</span>
                  <span className="text-white truncate max-w-[150px]" title={window.location.pathname}>
                    {window.location.pathname}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Timing API details */}
            <NavigationTimingDetails />
          </>
        )}
      </div>
    </div>
  )
}

interface MetricItemProps {
  label: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
}

function MetricItem({ label, value, unit, status }: MetricItemProps) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
  }

  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</span>
      <span className={`text-lg font-bold ${statusColors[status]}`}>
        {value}
        <span className="text-xs ml-0.5">{unit}</span>
      </span>
    </div>
  )
}

function NavigationTimingDetails() {
  const [timing, setTiming] = useState<ReturnType<typeof getPerformanceMetrics> | null>(null)

  useEffect(() => {
    const metrics = getPerformanceMetrics()
    setTiming(metrics)
  }, [])

  if (!timing) return null

  return (
    <div className="border-t border-white/10 pt-2 mt-2">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">
        Navigation Timing
      </div>
      <div className="space-y-1 text-[11px]">
        <TimingRow label="DNS" value={timing.dns} />
        <TimingRow label="TCP" value={timing.tcp} />
        <TimingRow label="Request" value={timing.request} />
        <TimingRow label="Response" value={timing.response} />
        <TimingRow label="DOM" value={timing.domProcessing} />
      </div>
    </div>
  )
}

function TimingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white">{Math.round(value)}ms</span>
    </div>
  )
}

function getFPSStatus(fps: number): 'good' | 'warning' | 'critical' {
  if (fps >= 55) return 'good'
  if (fps >= 30) return 'warning'
  return 'critical'
}

function getMemoryStatus(memoryMB: number): 'good' | 'warning' | 'critical' {
  if (memoryMB < 50) return 'good'
  if (memoryMB < 100) return 'warning'
  return 'critical'
}

function getLoadTimeClass(loadTime: number): string {
  if (loadTime < 1000) return 'text-green-400'
  if (loadTime < 3000) return 'text-yellow-400'
  return 'text-red-400'
}
