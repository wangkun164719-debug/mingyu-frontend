import fs from "fs";
import path from "path";

export const TRACKED_PAGES = {
  home: { label: "Home", path: "/", viewEvent: "home_view" },
  about: { label: "About", path: "/about", viewEvent: "about_view" },
  faq: { label: "FAQ", path: "/faq", viewEvent: "faq_view" },
  measure: { label: "Measure", path: "/measure", viewEvent: "measure_page_view" },
  report: { label: "Report", path: "/result", viewEvent: "report_page_view" },
  pay: { label: "Pay", path: "/pay", viewEvent: "pay_page_view" }
};

const FUNNEL_EVENTS = [
  "home_view",
  "click_start_measure",
  "measure_page_view",
  "measure_form_start",
  "measure_submit_click",
  "measure_submit_success",
  "report_page_view",
  "click_detail_report",
  "pay_button_click",
  "pay_success"
];

const VIEW_EVENTS = new Set([
  "home_view",
  "about_view",
  "faq_view",
  "measure_page_view",
  "report_page_view",
  "pay_page_view"
]);

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

const EMPTY_STORE = {
  version: 2,
  dates: {}
};

function createDateKey(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function resolveAnalyticsDateKey(input, timeZone) {
  const value = `${input || "today"}`.trim().toLowerCase();

  if (value === "today") {
    return createDateKey(new Date(), timeZone);
  }

  if (value === "yesterday") {
    return createDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000), timeZone);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("date must be YYYY-MM-DD, today, or yesterday.");
  }

  return value;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readStore(dataFilePath) {
  ensureParentDir(dataFilePath);

  if (!fs.existsSync(dataFilePath)) {
    return structuredClone(EMPTY_STORE);
  }

  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      version: 2,
      dates: parsed?.dates && typeof parsed.dates === "object" ? parsed.dates : {}
    };
  } catch {
    return structuredClone(EMPTY_STORE);
  }
}

function writeStore(dataFilePath, store) {
  ensureParentDir(dataFilePath);
  fs.writeFileSync(dataFilePath, JSON.stringify(store, null, 2), "utf8");
}

function appendJsonLine(filePath, value) {
  ensureParentDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function writeDailySummaryFile(filePath, summary) {
  if (!filePath) {
    return;
  }

  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), "utf8");
}

function ensureDayRecord(store, dateKey) {
  if (!store.dates[dateKey]) {
    store.dates[dateKey] = {
      events: {},
      viewEvents: 0,
      visitors: {},
      viewVisitors: {},
      sources: {},
      landingPages: {},
      contentSources: {}
    };
  }

  store.dates[dateKey].events = store.dates[dateKey].events || {};
  store.dates[dateKey].viewEvents = Number(store.dates[dateKey].viewEvents || 0);
  store.dates[dateKey].visitors = store.dates[dateKey].visitors || {};
  store.dates[dateKey].viewVisitors = store.dates[dateKey].viewVisitors || {};
  store.dates[dateKey].sources = store.dates[dateKey].sources || {};
  store.dates[dateKey].landingPages = store.dates[dateKey].landingPages || {};
  store.dates[dateKey].contentSources = store.dates[dateKey].contentSources || {};

  return store.dates[dateKey];
}

function ensureMetricBucket(container, key) {
  const safeKey = key || "direct";

  if (!container[safeKey]) {
    container[safeKey] = {
      pv: 0,
      visitors: {}
    };
  }

  return container[safeKey];
}

function ensureContentBucket(container, key, values) {
  if (!container[key]) {
    container[key] = {
      utm_source: values.utm_source || "direct",
      utm_campaign: values.utm_campaign || "",
      landing_page: values.landing_page || "/",
      visitors: {},
      measure_submit_success: 0,
      click_detail_report: 0
    };
  }

  return container[key];
}

function sanitizeVisitorId(visitorId) {
  return `${visitorId || ""}`.trim().slice(0, 128);
}

function sanitizeString(value, fallback = "") {
  return `${value || fallback}`.trim().slice(0, 180);
}

function sanitizePath(value) {
  const raw = sanitizeString(value, "/");

  try {
    const parsed = new URL(raw, "https://www.mingyuwk.com");
    return `${parsed.pathname || "/"}${parsed.search || ""}`.slice(0, 240);
  } catch {
    return raw.split("#")[0].slice(0, 240) || "/";
  }
}

function sanitizeEventPayload(input) {
  const source = input && typeof input === "object" ? input : {};
  const eventName = sanitizeString(source.event_name || source.eventName);

  if (!eventName) {
    throw new Error("event_name is required.");
  }

  return Object.entries(source).reduce(
    (safe, [key, value]) => {
      if (!/^has_birth_(date|time)$/i.test(key) && SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        return safe;
      }

      if (typeof value === "string") {
        safe[key] = value.slice(0, 240);
      } else if (typeof value === "number" || typeof value === "boolean") {
        safe[key] = value;
      } else if (Array.isArray(value)) {
        safe[key] = value
          .filter((item) => ["string", "number", "boolean"].includes(typeof item))
          .slice(0, 10)
          .map((item) => (typeof item === "string" ? item.slice(0, 120) : item));
      }

      return safe;
    },
    {
      event_name: eventName,
      timestamp: sanitizeString(source.timestamp, new Date().toISOString())
    }
  );
}

function incrementVisitor(bucket, visitorId, occurredAt) {
  const safeVisitorId = sanitizeVisitorId(visitorId);

  if (!safeVisitorId) {
    return;
  }

  const existing = bucket.visitors[safeVisitorId];
  bucket.visitors[safeVisitorId] = {
    firstSeenAt: existing?.firstSeenAt || occurredAt.toISOString(),
    lastSeenAt: occurredAt.toISOString()
  };
}

function toCountMap(events = {}) {
  return FUNNEL_EVENTS.reduce((funnel, eventName) => {
    funnel[eventName] = Number(events[eventName] || 0);
    return funnel;
  }, {});
}

function formatRate(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(4));
}

function topBuckets(buckets = {}, mapper, limit = 8) {
  return Object.entries(buckets)
    .map(([key, value]) => mapper(key, value))
    .sort((a, b) => (b.pv || b.uv || 0) - (a.pv || a.uv || 0))
    .slice(0, limit);
}

function buildIssues({ funnel, conversionRates }) {
  const issues = [];

  if (funnel.measure_page_view > 0 && conversionRates.measure_page_to_form_start_rate < 0.2) {
    issues.push({
      type: "dropoff",
      description: "Measure page visits are present, but form starts are low."
    });
  }

  if (funnel.measure_submit_click > 0 && conversionRates.form_start_to_submit_success_rate < 0.5) {
    issues.push({
      type: "submit_dropoff",
      description: "Users clicked submit, but successful measurement completion is low."
    });
  }

  if (funnel.report_page_view > 0 && conversionRates.report_to_detail_click_rate < 0.1) {
    issues.push({
      type: "detail_report_interest",
      description: "Detailed report click rate is low after report views."
    });
  }

  return issues;
}

function buildPageSummary(pageKey, dayRecord) {
  const page = TRACKED_PAGES[pageKey];
  const legacyRecord = dayRecord.pages?.[pageKey] || {};
  const visitors = legacyRecord?.visitors && typeof legacyRecord.visitors === "object"
    ? Object.keys(legacyRecord.visitors)
    : [];

  return {
    pageKey,
    label: page.label,
    path: page.path,
    pv: Number(legacyRecord?.pv || 0),
    uv: visitors.length
  };
}

function getLegacyPageSummaries(dayRecord) {
  return Object.keys(TRACKED_PAGES)
    .filter((pageKey) => ["home", "measure", "report"].includes(pageKey))
    .map((pageKey) => buildPageSummary(pageKey, dayRecord));
}

function getLegacyVisitors(dayRecord) {
  const visitors = new Set();

  Object.values(dayRecord.pages || {}).forEach((pageRecord) => {
    Object.keys(pageRecord?.visitors || {}).forEach((visitorId) => visitors.add(visitorId));
  });

  return visitors;
}

function buildSummaryText(summary) {
  if (summary.site.pv === 0) {
    return [
      `${summary.date} 网站运营日报`,
      "当日暂无官网访问数据。"
    ].join("\n");
  }

  const home = summary.pages.find((page) => page.pageKey === "home");
  const measure = summary.pages.find((page) => page.pageKey === "measure");
  const report = summary.pages.find((page) => page.pageKey === "report");

  return [
    `${summary.date} 网站运营日报`,
    `全站 PV ${summary.site.pv}，UV ${summary.site.uv}`,
    `首页：PV ${home?.pv || 0}，UV ${home?.uv || 0}`,
    `测算页：PV ${measure?.pv || 0}，UV ${measure?.uv || 0}`,
    `详细报告页：PV ${report?.pv || 0}，UV ${report?.uv || 0}`
  ].join("\n");
}

export function getAnalyticsDailySummary({
  dataFilePath,
  dateKey,
  timeZone,
  siteUrl = ""
}) {
  const store = readStore(dataFilePath);
  const dayRecord = store.dates[dateKey] || ensureDayRecord({ dates: {} }, dateKey);
  const legacyPages = getLegacyPageSummaries(dayRecord);
  const legacyHome = legacyPages.find((page) => page.pageKey === "home") || { pv: 0, uv: 0 };
  const legacyMeasure = legacyPages.find((page) => page.pageKey === "measure") || { pv: 0, uv: 0 };
  const legacyReport = legacyPages.find((page) => page.pageKey === "report") || { pv: 0, uv: 0 };
  const legacyVisitors = getLegacyVisitors(dayRecord);
  const rawFunnel = toCountMap(dayRecord.events);
  const funnel = {
    ...rawFunnel,
    home_view: rawFunnel.home_view || legacyHome.pv,
    measure_page_view: rawFunnel.measure_page_view || legacyMeasure.pv,
    report_page_view: rawFunnel.report_page_view || legacyReport.pv
  };
  const totalPv = Number(dayRecord.viewEvents || 0) || legacyPages.reduce((total, page) => total + page.pv, 0);
  const totalUv = Object.keys(dayRecord.viewVisitors || {}).length || legacyVisitors.size;
  const landingPages = Object.keys(dayRecord.landingPages || {}).length
    ? dayRecord.landingPages
    : legacyPages.reduce((pages, page) => {
        if (page.pv > 0) {
          pages[page.path] = { pv: page.pv, visitors: {} };
        }

        return pages;
      }, {});
  const sources = Object.keys(dayRecord.sources || {}).length
    ? dayRecord.sources
    : totalPv > 0
      ? { direct: { pv: totalPv, visitors: Object.fromEntries([...legacyVisitors].map((visitorId) => [visitorId, {}])) } }
      : {};

  const conversionRates = {
    home_to_measure_click_rate: formatRate(funnel.click_start_measure, funnel.home_view),
    measure_page_to_form_start_rate: formatRate(funnel.measure_form_start, funnel.measure_page_view),
    form_start_to_submit_success_rate: formatRate(funnel.measure_submit_success, funnel.measure_form_start),
    report_to_detail_click_rate: formatRate(funnel.click_detail_report, funnel.report_page_view),
    pay_success_rate: formatRate(funnel.pay_success, funnel.pay_button_click)
  };

  const summary = {
    date: dateKey,
    timeZone,
    siteUrl,
    site: {
      pv: totalPv,
      uv: totalUv,
      top_sources: topBuckets(sources, (source, bucket) => ({
        source,
        uv: Object.keys(bucket.visitors || {}).length,
        pv: Number(bucket.pv || 0)
      })),
      top_landing_pages: topBuckets(landingPages, (pathKey, bucket) => ({
        path: pathKey,
        pv: Number(bucket.pv || 0)
      }))
    },
    funnel,
    conversion_rates: conversionRates,
    content_sources: Object.values(dayRecord.contentSources || {})
      .map((bucket) => ({
        utm_source: bucket.utm_source || "direct",
        utm_campaign: bucket.utm_campaign || "",
        landing_page: bucket.landing_page || "/",
        uv: Object.keys(bucket.visitors || {}).length,
        measure_submit_success: Number(bucket.measure_submit_success || 0),
        click_detail_report: Number(bucket.click_detail_report || 0)
      }))
      .sort((a, b) => b.uv - a.uv)
      .slice(0, 20),
    totals: {
      pv: totalPv,
      uv: totalUv
    },
    pages: legacyPages.map((page) => ({
      ...page,
      pv: page.pv || (page.pageKey === "home" ? funnel.home_view : page.pageKey === "measure" ? funnel.measure_page_view : page.pageKey === "report" ? funnel.report_page_view : 0)
    })),
    conversions: {
      homeToMeasure: {
        pvRate: formatRate(legacyMeasure.pv || funnel.measure_page_view, legacyHome.pv || funnel.home_view),
        uvRate: formatRate(legacyMeasure.uv, legacyHome.uv)
      },
      measureToReport: {
        pvRate: formatRate(legacyReport.pv || funnel.report_page_view, legacyMeasure.pv || funnel.measure_page_view),
        uvRate: formatRate(legacyReport.uv, legacyMeasure.uv)
      },
      homeToReport: {
        pvRate: formatRate(legacyReport.pv || funnel.report_page_view, legacyHome.pv || funnel.home_view),
        uvRate: formatRate(legacyReport.uv, legacyHome.uv)
      }
    }
  };

  return {
    ...summary,
    summaryText: buildSummaryText(summary),
    issues: buildIssues({
      funnel,
      conversionRates
    })
  };
}

export function recordAnalyticsEvent({
  dataFilePath,
  eventLogFilePath,
  dailySummaryFilePath,
  event,
  occurredAt = new Date(),
  timeZone,
  siteUrl = ""
}) {
  const safeEvent = sanitizeEventPayload(event);
  const dateKey = createDateKey(occurredAt, timeZone);
  const store = readStore(dataFilePath);
  const dayRecord = ensureDayRecord(store, dateKey);
  const eventName = safeEvent.event_name;
  const visitorId = sanitizeVisitorId(safeEvent.visitor_id);
  const source = sanitizeString(safeEvent.utm_source || safeEvent.latest_touch_source, "direct") || "direct";
  const landingPage = sanitizePath(safeEvent.landing_page || safeEvent.page_path);
  const pagePath = sanitizePath(safeEvent.page_path);

  safeEvent.timestamp = occurredAt.toISOString();
  safeEvent.page_path = pagePath;
  safeEvent.landing_page = landingPage;
  safeEvent.latest_touch_source = sanitizeString(safeEvent.latest_touch_source, source) || source;
  safeEvent.first_touch_source = sanitizeString(safeEvent.first_touch_source, source) || source;

  dayRecord.events[eventName] = Number(dayRecord.events[eventName] || 0) + 1;

  if (visitorId) {
    const existing = dayRecord.visitors[visitorId];
    dayRecord.visitors[visitorId] = {
      firstSeenAt: existing?.firstSeenAt || occurredAt.toISOString(),
      lastSeenAt: occurredAt.toISOString()
    };
  }

  if (VIEW_EVENTS.has(eventName)) {
    dayRecord.viewEvents += 1;

    if (visitorId) {
      const existing = dayRecord.viewVisitors[visitorId];
      dayRecord.viewVisitors[visitorId] = {
        firstSeenAt: existing?.firstSeenAt || occurredAt.toISOString(),
        lastSeenAt: occurredAt.toISOString()
      };
    }

    const sourceBucket = ensureMetricBucket(dayRecord.sources, source);
    sourceBucket.pv += 1;
    incrementVisitor(sourceBucket, visitorId, occurredAt);

    const landingBucket = ensureMetricBucket(dayRecord.landingPages, landingPage);
    landingBucket.pv += 1;
    incrementVisitor(landingBucket, visitorId, occurredAt);
  }

  const contentKey = [
    sanitizeString(safeEvent.utm_source, "direct") || "direct",
    sanitizeString(safeEvent.utm_campaign, ""),
    landingPage
  ].join("|");
  const contentBucket = ensureContentBucket(dayRecord.contentSources, contentKey, {
    utm_source: safeEvent.utm_source || source,
    utm_campaign: safeEvent.utm_campaign || "",
    landing_page: landingPage
  });
  incrementVisitor(contentBucket, visitorId, occurredAt);

  if (eventName === "measure_submit_success") {
    contentBucket.measure_submit_success += 1;
  }

  if (eventName === "click_detail_report") {
    contentBucket.click_detail_report += 1;
  }

  writeStore(dataFilePath, store);
  appendJsonLine(eventLogFilePath, safeEvent);

  const summary = getAnalyticsDailySummary({
    dataFilePath,
    dateKey,
    timeZone,
    siteUrl
  });

  writeDailySummaryFile(dailySummaryFilePath, summary);

  return summary;
}

export function recordAnalyticsPageView({
  dataFilePath,
  eventLogFilePath,
  dailySummaryFilePath,
  pageKey,
  visitorId,
  occurredAt = new Date(),
  timeZone,
  siteUrl = ""
}) {
  if (!TRACKED_PAGES[pageKey]) {
    throw new Error("pageKey is not allowed.");
  }

  return recordAnalyticsEvent({
    dataFilePath,
    eventLogFilePath,
    dailySummaryFilePath,
    event: {
      event_name: TRACKED_PAGES[pageKey].viewEvent,
      page_key: pageKey,
      page_path: TRACKED_PAGES[pageKey].path,
      landing_page: TRACKED_PAGES[pageKey].path,
      latest_touch_source: "direct",
      first_touch_source: "direct",
      visitor_id: visitorId
    },
    occurredAt,
    timeZone,
    siteUrl
  });
}
