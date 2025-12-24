/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

type MetricCallback = (metric: PerformanceMetric) => void;

/**
 * Get rating based on Core Web Vitals thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000], // Largest Contentful Paint
    FID: [100, 300],   // First Input Delay
    CLS: [0.1, 0.25],  // Cumulative Layout Shift
    FCP: [1800, 3000], // First Contentful Paint
    TTFB: [800, 1800], // Time to First Byte
    INP: [200, 500],   // Interaction to Next Paint
  };

  const [good, poor] = thresholds[name] || [1000, 3000];

  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Observe Largest Contentful Paint
 */
export function observeLCP(callback: MetricCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };

      callback({
        name: 'LCP',
        value: lastEntry.startTime,
        rating: getRating('LCP', lastEntry.startTime),
      });
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Observer not supported
  }
}

/**
 * Observe First Input Delay
 */
export function observeFID(callback: MetricCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming;

      callback({
        name: 'FID',
        value: firstEntry.processingStart - firstEntry.startTime,
        rating: getRating('FID', firstEntry.processingStart - firstEntry.startTime),
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch {
    // Observer not supported
  }
}

/**
 * Observe Cumulative Layout Shift
 */
export function observeCLS(callback: MetricCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;

  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number
        };

        if (!layoutShiftEntry.hadRecentInput) {
          clsEntries.push(entry);
          clsValue += layoutShiftEntry.value;
        }
      }

      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // Observer not supported
  }
}

/**
 * Get First Contentful Paint
 */
export function getFCP(callback: MetricCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');

      if (fcpEntry) {
        callback({
          name: 'FCP',
          value: fcpEntry.startTime,
          rating: getRating('FCP', fcpEntry.startTime),
        });
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch {
    // Observer not supported
  }
}

/**
 * Get Time to First Byte
 */
export function getTTFB(callback: MetricCallback): void {
  try {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      callback({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
      });
    }
  } catch {
    // Not supported
  }
}

/**
 * Report all Core Web Vitals
 */
export function reportWebVitals(callback: MetricCallback): void {
  observeLCP(callback);
  observeFID(callback);
  observeCLS(callback);
  getFCP(callback);
  getTTFB(callback);
}

/**
 * Log performance metrics to console (development only)
 */
export function logPerformanceMetrics(): void {
  if (import.meta.env.PROD) return;

  reportWebVitals((metric) => {
    const colors = {
      good: 'color: green',
      'needs-improvement': 'color: orange',
      poor: 'color: red',
    };

    console.log(
      `%c[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
      colors[metric.rating]
    );
  });
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string): () => void {
  if (import.meta.env.PROD) return () => {};

  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 16) { // Longer than one frame (60fps)
      console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Preload critical routes for faster navigation
 */
export function preloadRoute(routePath: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  document.head.appendChild(link);
}

/**
 * Preload critical assets
 */
export function preloadCriticalAssets(): void {
  // Preload common routes after initial load
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      preloadRoute('/hotels');
      preloadRoute('/flights');
      preloadRoute('/login');
    });
  }
}
