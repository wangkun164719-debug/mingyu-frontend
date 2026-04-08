import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ANALYTICS_ENDPOINT = "/api/analytics/page-view";
const VISITOR_STORAGE_KEY = "mingyu:visitor-id";
const trackedNavigations = new Set();

function hasWindow() {
  return typeof window !== "undefined";
}

function createVisitorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

async function postPageView(pageKey, pathname) {
  const payload = {
    pageKey,
    pathname,
    visitorId: getVisitorId()
  };

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon(
      ANALYTICS_ENDPOINT,
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );

    if (queued) {
      return;
    }
  }

  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch {
    // Ignore analytics delivery failures.
  }
}

export function usePageView(pageKey) {
  const location = useLocation();

  useEffect(() => {
    const navigationKey = `${pageKey}:${location.key || location.pathname}`;

    if (trackedNavigations.has(navigationKey)) {
      return;
    }

    trackedNavigations.add(navigationKey);
    void postPageView(pageKey, location.pathname);
  }, [location.key, location.pathname, pageKey]);
}
