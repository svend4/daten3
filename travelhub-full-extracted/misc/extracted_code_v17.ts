import { useEffect } from 'react';

export function usePerformanceMonitoring(routeName: string) {
  useEffect(() => {
    // Measure page load performance
    const measurePerformance = () => {
      if (typeof window.performance === 'undefined') return;

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (!navigation) return;

      const metrics = {
        route: routeName,
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      };

      // Log to console in development
      if (import.meta.env.DEV) {
        console.table(metrics);
      }

      // Send to analytics in production
      if (import.meta.env.PROD) {
        // Send to your analytics service
        // analyticsService.trackPerformance(metrics);
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, [routeName]);
}
