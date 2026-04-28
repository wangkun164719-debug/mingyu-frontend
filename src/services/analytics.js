import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ANALYTICS_EVENT_ENDPOINT = "/api/analytics/event";
const VISITOR_STORAGE_KEY = "mingyu:visitor-id";
const UTM_STORAGE_KEY = "mingyu:utm-touch";
const LANDING_STORAGE_KEY = "mingyu:landing-page";
const EVENT_BUFFER_KEY = "mingyu:analytics-events";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const trackedNavigations = new Set();

const PAGE_EVENT_MAP = {
  home: "home_view",
  about: "about_view",
  faq: "faq_view",
  measure: "measure_page_view",
  report: "report_page_view",
  pay: "pay_page_view"
};

const SENSITIVE_KEY_PATTERNS = [
  /name/i,
  /phone/i,
  /mobile/i,
  /id_?card/i,
  /identity/i,
  /address/i,
  /birth_?date/i,
  /birth_?time/i,
  /birth_?place/i,
  /birthday/i,
  /real_?name/i
];

function hasWindow() {
  return typeof window !== "undefined";
}

function isProduction() {
  return Boolean(import.meta.env.PROD);
}

function getBaiduTongjiId() {
  return `${import.meta.env.VITE_BAIDU_TONGJI_ID || ""}`.trim();
}

function createVisitorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizePath(value) {
  if (!value) {
    return "/";
  }

  try {
    const url = new URL(value, window.location.origin);
    return `${url.pathname || "/"}${url.search || ""}`;
  } catch {
    return `${value}`.split("#")[0].slice(0, 240) || "/";
  }
}

function sanitizeReferrer(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

function detectDeviceType() {
  if (!hasWindow()) {
    return "unknown";
  }

  const width = window.innerWidth || 0;

  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function extractUtmFromUrl() {
  if (!hasWindow()) {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  return UTM_KEYS.reduce((utm, key) => {
    const value = params.get(key);

    if (value) {
      utm[key] = value.slice(0, 120);
    }

    return utm;
  }, {});
}

function detectSource(utm) {
  if (utm.utm_source) {
    return utm.utm_source;
  }

  if (!hasWindow() || !document.referrer) {
    return "direct";
  }

  try {
    const referrer = new URL(document.referrer);
    const host = referrer.hostname.replace(/^www\./, "");

    if (host.includes("baidu")) {
      return "baidu";
    }

    if (host.includes("xiaohongshu")) {
      return "xiaohongshu";
    }

    if (host.includes("zhihu")) {
      return "zhihu";
    }

    if (host.includes("weixin") || host.includes("wechat")) {
      return "wechat";
    }

    return host || "referral";
  } catch {
    return "referral";
  }
}

function getLandingPage() {
  if (!hasWindow()) {
    return "/";
  }

  try {
    const saved = window.sessionStorage.getItem(LANDING_STORAGE_KEY);

    if (saved) {
      return saved;
    }

    const current = normalizePath(window.location.href);
    window.sessionStorage.setItem(LANDING_STORAGE_KEY, current);
    return current;
  } catch {
    return normalizePath(window.location.href);
  }
}

function getTrafficTouch() {
  if (!hasWindow()) {
    return {
      first_touch: { source: "direct" },
      latest_touch: { source: "direct" }
    };
  }

  const now = new Date().toISOString();
  const landingPage = getLandingPage();
  const utm = extractUtmFromUrl();
  const hasUtm = Object.keys(utm).length > 0;
  const saved = safeJsonParse(window.localStorage.getItem(UTM_STORAGE_KEY), null);
  const source = detectSource(utm);
  const fallbackTouch = {
    source,
    landing_page: landingPage,
    referrer: sanitizeReferrer(document.referrer),
    captured_at: now,
    ...utm
  };

  const firstTouch = saved?.first_touch || fallbackTouch;
  const latestTouch = hasUtm ? fallbackTouch : saved?.latest_touch || fallbackTouch;
  const nextValue = {
    first_touch: firstTouch,
    latest_touch: latestTouch
  };

  try {
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(nextValue));
  } catch {
    // Ignore storage failures.
  }

  return nextValue;
}

function isSensitiveKey(key) {
  if (/^has_birth_(date|time)$/i.test(key)) {
    return false;
  }

  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeValue(value) {
  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => ["string", "number", "boolean"].includes(typeof item))
      .slice(0, 10)
      .map((item) => (typeof item === "string" ? item.slice(0, 120) : item));
  }

  if (typeof value === "string") {
    return value.slice(0, 160);
  }

  return undefined;
}

function sanitizeProperties(properties = {}) {
  return Object.entries(properties).reduce((safe, [key, value]) => {
    if (isSensitiveKey(key)) {
      return safe;
    }

    const cleanValue = sanitizeValue(value);

    if (cleanValue !== undefined) {
      safe[key] = cleanValue;
    }

    return safe;
  }, {});
}

function createBasePayload(eventName) {
  const touches = getTrafficTouch();
  const latestTouch = touches.latest_touch || {};
  const firstTouch = touches.first_touch || {};

  return {
    event_name: eventName,
    page_path: hasWindow() ? normalizePath(window.location.href) : "/",
    page_title: hasWindow() ? document.title : "",
    device_type: detectDeviceType(),
    referrer: hasWindow() ? sanitizeReferrer(document.referrer) : "",
    landing_page: getLandingPage(),
    utm_source: latestTouch.utm_source || "",
    utm_medium: latestTouch.utm_medium || "",
    utm_campaign: latestTouch.utm_campaign || "",
    utm_content: latestTouch.utm_content || "",
    utm_term: latestTouch.utm_term || "",
    first_touch_source: firstTouch.source || "direct",
    latest_touch_source: latestTouch.source || "direct",
    visitor_id: getVisitorId(),
    timestamp: new Date().toISOString()
  };
}

function saveLocalEvent(payload) {
  if (!hasWindow()) {
    return;
  }

  try {
    const current = safeJsonParse(window.localStorage.getItem(EVENT_BUFFER_KEY), []);
    const next = Array.isArray(current) ? [...current.slice(-99), payload] : [payload];
    window.localStorage.setItem(EVENT_BUFFER_KEY, JSON.stringify(next));
  } catch {
    try {
      window.sessionStorage.setItem(EVENT_BUFFER_KEY, JSON.stringify([payload]));
    } catch {
      // Ignore analytics buffer failures.
    }
  }
}

function pushToBaidu(payload) {
  if (!hasWindow() || !window._hmt || !Array.isArray(window._hmt)) {
    return;
  }

  try {
    window._hmt.push([
      "_trackEvent",
      "mingyu",
      payload.event_name,
      payload.page_path,
      1
    ]);
  } catch {
    // Ignore third-party analytics failures.
  }
}

function postEvent(payload) {
  if (!hasWindow()) {
    return;
  }

  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon(
      ANALYTICS_EVENT_ENDPOINT,
      new Blob([body], { type: "application/json" })
    );

    if (queued) {
      return;
    }
  }

  fetch(ANALYTICS_EVENT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body,
    keepalive: true
  }).catch(() => {
    // Ignore analytics delivery failures.
  });
}

export function getVisitorId() {
  if (!hasWindow()) {
    return "";
  }

  try {
    const saved = window.localStorage.getItem(VISITOR_STORAGE_KEY);

    if (saved) {
      return saved;
    }

    const nextId = createVisitorId();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return createVisitorId();
  }
}

export function initBaiduTongji() {
  if (!hasWindow()) {
    return;
  }

  const tongjiId = getBaiduTongjiId();

  if (!isProduction() || !tongjiId) {
    console.info("百度统计未启用或处于开发环境");
    return;
  }

  if (document.querySelector(`script[data-baidu-tongji="${tongjiId}"]`)) {
    return;
  }

  window._hmt = window._hmt || [];
  const script = document.createElement("script");
  script.async = true;
  script.dataset.baiduTongji = tongjiId;
  script.src = `https://hm.baidu.com/hm.js?${encodeURIComponent(tongjiId)}`;

  const firstScript = document.getElementsByTagName("script")[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
}

export function trackEvent(eventName, properties = {}) {
  const safeEventName = `${eventName || ""}`.trim();

  if (!safeEventName || !hasWindow()) {
    return null;
  }

  const payload = {
    ...createBasePayload(safeEventName),
    ...sanitizeProperties(properties)
  };

  if (!isProduction()) {
    console.info("[MingYu analytics]", payload);
    return payload;
  }

  saveLocalEvent(payload);
  pushToBaidu(payload);
  postEvent(payload);
  return payload;
}

export function trackPayEvent(eventName, properties = {}) {
  return trackEvent(eventName, {
    pay_flow: "reserved",
    ...properties
  });
}

export function useBaiduTongji() {
  useEffect(() => {
    initBaiduTongji();
  }, []);
}

export function usePageView(pageKey, eventName) {
  const location = useLocation();

  useEffect(() => {
    const viewEventName = eventName || PAGE_EVENT_MAP[pageKey] || `${pageKey}_view`;
    const navigationKey = `${viewEventName}:${location.key || location.pathname}`;

    if (trackedNavigations.has(navigationKey)) {
      return;
    }

    trackedNavigations.add(navigationKey);
    trackEvent(viewEventName, {
      page_key: pageKey
    });
  }, [eventName, location.key, location.pathname, pageKey]);
}

export function useScrollDepth(eventsByDepth) {
  const eventsKey = JSON.stringify(eventsByDepth);

  useEffect(() => {
    if (!hasWindow()) {
      return undefined;
    }

    const fired = new Set();
    const entries = Object.entries(safeJsonParse(eventsKey, {}));

    const onScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (documentHeight <= 0) {
        return;
      }

      const depth = Math.round((window.scrollY / documentHeight) * 100);

      entries.forEach(([targetDepth, eventName]) => {
        const numericDepth = Number(targetDepth);

        if (depth >= numericDepth && !fired.has(numericDepth)) {
          fired.add(numericDepth);
          trackEvent(eventName, {
            scroll_depth: numericDepth
          });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [eventsKey]);
}
