import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Web Vitals')

/**
 * Send Web Vitals metrics to analytics service
 * In production, this would send to your analytics platform (Google Analytics, Vercel Analytics, etc.)
 */
function sendToAnalytics(metric: Metric) {
  if (import.meta.env.PROD) {
    // In production, send to your analytics endpoint
    // Example: Google Analytics 4
    // window.gtag?.('event', metric.name, {
    //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //   metric_id: metric.id,
    //   metric_value: metric.value,
    //   metric_delta: metric.delta,
    //   metric_rating: metric.rating,
    // })

    // Example: Custom analytics endpoint with metric payload
    // const body = {
    //   name: metric.name,
    //   value: metric.value,
    //   rating: metric.rating,
    //   delta: metric.delta,
    //   id: metric.id,
    //   navigationType: metric.navigationType,
    // }
    // navigator.sendBeacon('/api/analytics', JSON.stringify(body))
  } else {
    // Development environment - detailed console logging
    logger.info(`${metric.name} - Value: ${metric.value}, Rating: ${metric.rating}, Delta: ${metric.delta}, ID: ${metric.id}`)
  }
}

/**
 * Initialize Web Vitals monitoring
 *
 * Tracks the following metrics:
 * - CLS (Cumulative Layout Shift): Measures visual stability
 * - FCP (First Contentful Paint): Measures loading performance
 * - LCP (Largest Contentful Paint): Measures loading performance
 * - TTFB (Time to First Byte): Measures server response time
 * - INP (Interaction to Next Paint): Measures interactivity (replaces FID)
 */
export function initWebVitals() {
  try {
    // Cumulative Layout Shift - measures visual stability
    // Good: < 0.1, Needs improvement: 0.1-0.25, Poor: > 0.25
    onCLS(sendToAnalytics)

    // First Contentful Paint - measures when first content is painted
    // Good: < 1.8s, Needs improvement: 1.8-3.0s, Poor: > 3.0s
    onFCP(sendToAnalytics)

    // Largest Contentful Paint - measures when main content is painted
    // Good: < 2.5s, Needs improvement: 2.5-4.0s, Poor: > 4.0s
    onLCP(sendToAnalytics)

    // Time to First Byte - measures server response time
    // Good: < 800ms, Needs improvement: 800-1800ms, Poor: > 1800ms
    onTTFB(sendToAnalytics)

    // Interaction to Next Paint - measures interactivity (replaces FID)
    // Good: < 200ms, Needs improvement: 200-500ms, Poor: > 500ms
    onINP(sendToAnalytics)

    logger.log('Monitoring initialized')
  } catch (error) {
    logger.error('Failed to initialize:', error)
  }
}

/**
 * Get performance metrics summary for display
 */
export function getPerformanceMetrics() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (!navigation) {
    return null
  }

  return {
    // DNS lookup time
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,

    // TCP connection time
    tcp: navigation.connectEnd - navigation.connectStart,

    // Request time
    request: navigation.responseStart - navigation.requestStart,

    // Response time
    response: navigation.responseEnd - navigation.responseStart,

    // DOM processing time
    domProcessing: navigation.domComplete - navigation.domInteractive,

    // Total page load time
    loadTime: navigation.loadEventEnd - navigation.fetchStart,
  }
}
