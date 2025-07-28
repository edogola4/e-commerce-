// Type definitions for Google Analytics
interface Window {
  gtag: (
    command: string,
    eventName: string,
    params?: {
      event_category?: string;
      event_label?: string;
      [key: string]: any;
    }
  ) => void;
}

declare const gtag: Window['gtag'];
