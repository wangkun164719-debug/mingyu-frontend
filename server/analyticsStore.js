import fs from "fs";
import path from "path";

export const TRACKED_PAGES = {
  home: { label: "首页", path: "/" },
  measure: { label: "测算页", path: "/measure" },
  report: { label: "详细报告页", path: "/report" }
};

const EMPTY_STORE = {
  version: 1,
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
    throw new Error("date 参数必须是 YYYY-MM-DD、today 或 yesterday。");
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
      version: 1,
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

function ensureDayRecord(store, dateKey) {
  if (!store.dates[dateKey]) {
    store.dates[dateKey] = { pages: {} };
  }

  return store.dates[dateKey];
}

function ensurePageRecord(dayRecord, pageKey) {
  if (!dayRecord.pages[pageKey]) {
    dayRecord.pages[pageKey] = {
      pv: 0,
      visitors: {}
    };
  }

  return dayRecord.pages[pageKey];
}

function sanitizeVisitorId(visitorId) {
  return `${visitorId || ""}`.trim().slice(0, 128);
}

function buildPageSummary(pageKey, pageRecord) {
  const visitors = pageRecord?.visitors && typeof pageRecord.visitors === "object"
    ? Object.keys(pageRecord.visitors)
    : [];

  return {
    pageKey,
    label: TRACKED_PAGES[pageKey].label,
    path: TRACKED_PAGES[pageKey].path,
    pv: Number(pageRecord?.pv || 0),
    uv: visitors.length
  };
}

function formatPercent(numerator, denominator) {
  if (!denominator) {
    return null;
  }

  return Number(((numerator / denominator) * 100).toFixed(1));
}

function buildSummaryText(summary) {
  const home = summary.pages.find((page) => page.pageKey === "home");
  const measure = summary.pages.find((page) => page.pageKey === "measure");
  const report = summary.pages.find((page) => page.pageKey === "report");

  if (summary.totals.pv === 0) {
    return [
      `${summary.date} 网站运营日报`,
      "当日暂无首页、测算页或详细报告页访问数据。"
    ].join("\n");
  }

  const uvRateToMeasure = summary.conversions.homeToMeasure.uvRate;
  const uvRateToReport = summary.conversions.measureToReport.uvRate;

  return [
    `${summary.date} 网站运营日报`,
    `总访问 PV ${summary.totals.pv}，总访客 UV ${summary.totals.uv}`,
    `首页：PV ${home?.pv || 0}，UV ${home?.uv || 0}`,
    `测算页：PV ${measure?.pv || 0}，UV ${measure?.uv || 0}`,
    `详细报告页：PV ${report?.pv || 0}，UV ${report?.uv || 0}`,
    `首页 -> 测算 UV 转化率：${uvRateToMeasure === null ? "--" : `${uvRateToMeasure}%`}`,
    `测算 -> 报告 UV 转化率：${uvRateToReport === null ? "--" : `${uvRateToReport}%`}`
  ].join("\n");
}

export function getAnalyticsDailySummary({
  dataFilePath,
  dateKey,
  timeZone,
  siteUrl = ""
}) {
  const store = readStore(dataFilePath);
  const dayRecord = store.dates[dateKey] || { pages: {} };
  const pages = Object.keys(TRACKED_PAGES).map((pageKey) =>
    buildPageSummary(pageKey, dayRecord.pages[pageKey])
  );

  const uniqueVisitors = new Set();
  let totalPv = 0;

  Object.keys(dayRecord.pages || {}).forEach((pageKey) => {
    const pageRecord = dayRecord.pages[pageKey];
    totalPv += Number(pageRecord?.pv || 0);

    Object.keys(pageRecord?.visitors || {}).forEach((visitorId) => {
      uniqueVisitors.add(visitorId);
    });
  });

  const home = pages.find((page) => page.pageKey === "home") || { pv: 0, uv: 0 };
  const measure = pages.find((page) => page.pageKey === "measure") || { pv: 0, uv: 0 };
  const report = pages.find((page) => page.pageKey === "report") || { pv: 0, uv: 0 };

  const summary = {
    date: dateKey,
    timeZone,
    siteUrl,
    totals: {
      pv: totalPv,
      uv: uniqueVisitors.size
    },
    pages,
    conversions: {
      homeToMeasure: {
        pvRate: formatPercent(measure.pv, home.pv),
        uvRate: formatPercent(measure.uv, home.uv)
      },
      measureToReport: {
        pvRate: formatPercent(report.pv, measure.pv),
        uvRate: formatPercent(report.uv, measure.uv)
      },
      homeToReport: {
        pvRate: formatPercent(report.pv, home.pv),
        uvRate: formatPercent(report.uv, home.uv)
      }
    }
  };

  return {
    ...summary,
    summaryText: buildSummaryText(summary)
  };
}

export function recordAnalyticsPageView({
  dataFilePath,
  pageKey,
  visitorId,
  occurredAt = new Date(),
  timeZone
}) {
  if (!TRACKED_PAGES[pageKey]) {
    throw new Error("pageKey 不在允许的埋点范围内。");
  }

  const dateKey = createDateKey(occurredAt, timeZone);
  const store = readStore(dataFilePath);
  const dayRecord = ensureDayRecord(store, dateKey);
  const pageRecord = ensurePageRecord(dayRecord, pageKey);

  pageRecord.pv += 1;

  const safeVisitorId = sanitizeVisitorId(visitorId);

  if (safeVisitorId) {
    const existing = pageRecord.visitors[safeVisitorId];
    pageRecord.visitors[safeVisitorId] = {
      firstSeenAt: existing?.firstSeenAt || occurredAt.toISOString(),
      lastSeenAt: occurredAt.toISOString()
    };
  }

  writeStore(dataFilePath, store);

  return getAnalyticsDailySummary({
    dataFilePath,
    dateKey,
    timeZone
  });
}
