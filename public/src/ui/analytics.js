// Analytics stays inert until a real GA4 Measurement ID is supplied in the
// page's `google-analytics-id` meta tag (or window.DEVLIFE_GA_ID at deploy).
// That keeps local play private while making the launch funnel measurable.
const measurementId = () => document.querySelector('meta[name="google-analytics-id"]')?.content?.trim()
  || window.DEVLIFE_GA_ID || '';

export function initAnalytics() {
  const id = measurementId();
  if (!/^G-[A-Z0-9]+$/i.test(id) || document.querySelector('script[data-devlife-ga]')) return false;
  window.dataLayer ||= [];
  window.gtag ||= function gtag(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip:true });
  const script = document.createElement('script');
  script.async = true; script.dataset.devlifeGa = 'true';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
  return true;
}

export function track(eventName, params = {}) {
  // The in-memory data layer is useful for QA and safely becomes a GA event
  // once the launch site supplies its Measurement ID.
  window.dataLayer ||= [];
  window.dataLayer.push({ event:eventName, ...params });
  if (typeof window.gtag === 'function' && /^G-[A-Z0-9]+$/i.test(measurementId())) {
    window.gtag('event', eventName, params);
  }
}
