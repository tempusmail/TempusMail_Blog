declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID: string = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""

// Track pageviews
export const pageview = (url: string): void => {
  if (GA_TRACKING_ID && typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
      anonymize_ip: true
    })
  }
}

interface GTagEvent {
  action: string
  category: string
  label?: string
  value?: number
}

// Track custom events
export const event = ({ action, category, label, value }: GTagEvent): void => {
  if (GA_TRACKING_ID && typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    })
  }
}

// Initialize GA4 (called once on app start)
export const initialize = (): void => {
  if (GA_TRACKING_ID && typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function(...args: any[]) {
      window.dataLayer.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA_TRACKING_ID, {
      page_path: window.location.pathname,
      send_page_view: false // We'll send page views manually
    })
  }
}
