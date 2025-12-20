// Google Analytics 4 Integration

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

class AnalyticsService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  /**
   * Initialize Google Analytics
   */
  init() {
    if (!this.isEnabled) return;

    const GA_ID = import.meta.env.VITE_GA_TRACKING_ID;
    
    if (!GA_ID) {
      console.warn('Google Analytics ID not found');
      return;
    }

    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  /**
   * Track page view
   */
  pageView(path: string, title?: string) {
    if (!this.isEnabled) return;

    window.gtag?.('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }

  /**
   * Track custom event
   */
  event({ action, category, label, value }: AnalyticsEvent) {
    if (!this.isEnabled) return;

    window.gtag?.('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  /**
   * Track search
   */
  trackSearch(type: 'flight' | 'hotel', params: any) {
    this.event({
      action: 'search',
      category: type,
      label: JSON.stringify(params),
    });
  }

  /**
   * Track booking
   */
  trackBooking(type: 'flight' | 'hotel', price: number) {
    this.event({
      action: 'booking',
      category: type,
      value: price,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(value: number) {
    if (!this.isEnabled) return;

    window.gtag?.('event', 'conversion', {
      send_to: 'AW-CONVERSION_ID',
      value: value,
      currency: 'USD',
    });
  }
}

export default new AnalyticsService();

// Type declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}
