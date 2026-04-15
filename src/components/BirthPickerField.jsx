import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarIcon, ClockIcon } from "./Icons";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => `${index + 1} 月`);
const MIN_YEAR = 1940;
const MAX_YEAR = new Date().getFullYear();
const WHEEL_ITEM_HEIGHT = 48;
export const UNKNOWN_TIME = "UNKNOWN";
const SHICHEN_PREFIX = "SHICHEN";
const TIME_INPUT_MODE = {
  SHICHEN: "shichen",
  EXACT: "exact",
  UNKNOWN: "unknown"
};
const SHICHEN_OPTIONS = [
  { key: "zi", label: "子时", range: "23:00-00:59", hour: "00", minute: "00" },
  { key: "chou", label: "丑时", range: "01:00-02:59", hour: "02", minute: "00" },
  { key: "yin", label: "寅时", range: "03:00-04:59", hour: "04", minute: "00" },
  { key: "mao", label: "卯时", range: "05:00-06:59", hour: "06", minute: "00" },
  { key: "chen", label: "辰时", range: "07:00-08:59", hour: "08", minute: "00" },
  { key: "si", label: "巳时", range: "09:00-10:59", hour: "10", minute: "00" },
  { key: "wu", label: "午时", range: "11:00-12:59", hour: "12", minute: "00" },
  { key: "wei", label: "未时", range: "13:00-14:59", hour: "14", minute: "00" },
  { key: "shen", label: "申时", range: "15:00-16:59", hour: "16", minute: "00" },
  { key: "you", label: "酉时", range: "17:00-18:59", hour: "18", minute: "00" },
  { key: "xu", label: "戌时", range: "19:00-20:59", hour: "20", minute: "00" },
  { key: "hai", label: "亥时", range: "21:00-22:59", hour: "22", minute: "00" }
];

function getShichenOption(key) {
  return SHICHEN_OPTIONS.find((item) => item.key === key) || null;
}

function isFutureTimeChoice(hour, minute, maxHour, maxMinute) {
  const numericHour = Number(hour);
  const numericMinute = Number(minute);

  if (numericHour > maxHour) {
    return true;
  }

  return numericHour === maxHour && numericMinute > maxMinute;
}

function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function clampDateToToday(date) {
  const today = getTodayDate();
  return date.getTime() > today.getTime() ? today : date;
}

function clampMonthToToday(date) {
  const today = getTodayDate();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return date.getTime() > currentMonth.getTime() ? currentMonth : date;
}

function getDateValueForToday() {
  return toDateValue(getTodayDate());
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

function formatDateDisplay(value) {
  if (!value) {
    return "年 / 月 / 日";
  }

  return value.replaceAll("-", "/");
}

function formatTimeDisplay(value) {
  if (!value) {
    return "请选择出生时间";
  }

  return formatBirthTimeDisplay(value);
}

export function parseBirthTimeValue(value) {
  if (!value) {
    return {
      mode: TIME_INPUT_MODE.EXACT,
      hour: "12",
      minute: "00",
      unknown: false,
      shichenKey: "",
      shichenLabel: "",
      range: ""
    };
  }

  if (value === UNKNOWN_TIME) {
    return {
      mode: TIME_INPUT_MODE.UNKNOWN,
      hour: "12",
      minute: "00",
      unknown: true,
      shichenKey: "",
      shichenLabel: "",
      range: ""
    };
  }

  if (value.startsWith(`${SHICHEN_PREFIX}:`)) {
    const [, key, rawHour, rawMinute] = value.split(":");
    const option = getShichenOption(key);
    const hour = rawHour || option?.hour || "00";
    const minute = rawMinute || option?.minute || "00";

    return {
      mode: TIME_INPUT_MODE.SHICHEN,
      hour,
      minute,
      unknown: false,
      shichenKey: key || "",
      shichenLabel: option?.label || "时辰",
      range: option?.range || ""
    };
  }

  const [hour = "12", minute = "00"] = value.split(":");
  return {
    mode: TIME_INPUT_MODE.EXACT,
    hour,
    minute,
    unknown: false,
    shichenKey: "",
    shichenLabel: "",
    range: ""
  };
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function normalizeDateParts(year, monthIndex, day) {
  const safeDay = Math.min(day, daysInMonth(year, monthIndex));
  return new Date(year, monthIndex, safeDay);
}

function parseDateValue(value) {
  if (!value) {
    return getTodayDate();
  }

  const [year, month, day] = value.split("-").map(Number);
  return clampDateToToday(normalizeDateParts(year, month - 1, day));
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createMonthMatrix(activeMonth, selectedValue) {
  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekDay = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startWeekDay);
  const selected = selectedValue ? parseDateValue(selectedValue) : null;

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    const value = toDateValue(date);
    const isCurrentMonth = date.getMonth() === month;
    const isToday = value === toDateValue(new Date());
    const isSelected = selected ? value === toDateValue(selected) : false;
    const isFuture = date.getTime() > getTodayDate().getTime();

    return {
      value,
      label: date.getDate(),
      date,
      isCurrentMonth,
      isToday,
      isSelected,
      isFuture
    };
  });
}

function shiftMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function parseTimeValue(value) {
  return parseBirthTimeValue(value);
}

function toTimeValue({ mode, hour, minute, shichenKey }) {
  if (mode === TIME_INPUT_MODE.UNKNOWN) {
    return UNKNOWN_TIME;
  }

  if (mode === TIME_INPUT_MODE.SHICHEN) {
    const option = getShichenOption(shichenKey) || SHICHEN_OPTIONS[0];
    return `${SHICHEN_PREFIX}:${option.key}:${option.hour}:${option.minute}`;
  }

  return `${hour}:${minute}`;
}

export function formatBirthTimeDisplay(value) {
  if (!value) {
    return "请选择出生时间";
  }

  if (value === UNKNOWN_TIME) {
    return "暂不清楚具体出生时间";
  }

  const parsed = parseBirthTimeValue(value);

  if (parsed.mode === TIME_INPUT_MODE.SHICHEN) {
    return `${parsed.shichenLabel} ${parsed.range}`;
  }

  return `${parsed.hour}:${parsed.minute}`;
}

function PickerTrigger({ icon, value, onClick, active }) {
  const Icon = icon === "calendar" ? CalendarIcon : ClockIcon;
  const displayText = icon === "calendar" ? formatDateDisplay(value) : formatTimeDisplay(value);

  return (
    <button
      type="button"
      className={`group flex min-h-[74px] w-full items-center justify-between gap-4 rounded-3xl border px-5 py-4 text-left transition duration-200 sm:min-h-[80px] sm:px-6 ${
        active
          ? "border-gold-400/60 bg-white/8 shadow-[0_0_0_4px_rgba(230,195,90,0.08)]"
          : "border-gold-500/20 bg-white/5 hover:border-gold-400/35 hover:bg-white/[0.07]"
      }`}
      onClick={onClick}
    >
      <span className={`text-lg sm:text-[1.15rem] ${value ? "text-mist-100" : "text-mist-400/75"}`}>
        {displayText}
      </span>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold-400/15 bg-white/5 text-mist-100 transition duration-200 group-hover:text-gold-300">
        <Icon className="h-5 w-5" />
      </span>
    </button>
  );
}

function LayerShell({ isMobile, title, children, open, onClose, onConfirm }) {
  useEffect(() => {
    if (!open || !isMobile) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobile, open]);

  if (!open) {
    return null;
  }

  if (isMobile) {
    const mobileLayer = (
      <div className="fixed inset-0 z-[60]">
        <button
          type="button"
          className="absolute inset-0 bg-[#030712]/70 backdrop-blur-sm"
          onClick={onClose}
          aria-label="关闭选择器"
        />
        <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-hidden rounded-t-[32px] border border-gold-500/18 bg-[linear-gradient(180deg,rgba(18,29,56,0.98),rgba(15,24,47,0.98))] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4 shadow-[0_-20px_60px_rgba(4,10,24,0.55)] animate-modal sm:px-6">
          <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/15" />
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              type="button"
              className="rounded-full px-3 py-2 text-sm font-semibold text-mist-300 transition hover:text-white"
              onClick={onClose}
            >
              取消
            </button>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <button
              type="button"
              className="rounded-full bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:-translate-y-0.5 active:scale-[0.98]"
              onClick={onConfirm}
            >
              确定
            </button>
          </div>
          <div className="max-h-[calc(85dvh-92px)] overflow-y-auto overscroll-contain pb-1">
            {children}
          </div>
        </div>
      </div>
    );

    return typeof document !== "undefined" ? createPortal(mobileLayer, document.body) : mobileLayer;
  }

  return (
    <div className="absolute left-0 top-[calc(100%+12px)] z-40 w-[380px] rounded-[28px] border border-gold-500/18 bg-[linear-gradient(180deg,rgba(18,29,56,0.98),rgba(15,24,47,0.98))] p-4 shadow-[0_24px_70px_rgba(4,10,24,0.55)] animate-modal">
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold-300/85">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full px-3 py-2 text-sm font-semibold text-mist-300 transition hover:text-white"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded-full bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:-translate-y-0.5 active:scale-[0.98]"
            onClick={onConfirm}
          >
            确定
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function WheelColumn({ label, options, selectedValue, onSelect, tall = false }) {
  const scrollRef = useRef(null);
  const snapTimeoutRef = useRef(null);
  const isMobile = useIsMobile();
  const wheelHeight = isMobile ? 220 : tall ? 260 : 220;
  const edgePadding = Math.max(0, Math.round((wheelHeight - WHEEL_ITEM_HEIGHT) / 2));

  useEffect(() => {
    const container = scrollRef.current;

    if (!container) {
      return undefined;
    }

    const index = options.findIndex((option) => option.value === selectedValue);

    if (index < 0) {
      return undefined;
    }

    const targetTop = index * WHEEL_ITEM_HEIGHT;
    if (Math.abs(container.scrollTop - targetTop) > 2) {
      container.scrollTop = targetTop;
    }

    return undefined;
  }, [options, selectedValue]);

  useEffect(() => () => window.clearTimeout(snapTimeoutRef.current), []);

  const handleScroll = () => {
    const container = scrollRef.current;

    if (!container || options.length === 0) {
      return;
    }

    const index = Math.max(
      0,
      Math.min(options.length - 1, Math.round(container.scrollTop / WHEEL_ITEM_HEIGHT))
    );
    const option = options[index];

    if (option && option.value !== selectedValue) {
      onSelect(option.value);
    }

    window.clearTimeout(snapTimeoutRef.current);
    snapTimeoutRef.current = window.setTimeout(() => {
      container.scrollTo({
        top: index * WHEEL_ITEM_HEIGHT,
        behavior: "smooth"
      });
    }, 80);
  };

  const handleClick = (value) => {
    onSelect(value);

    const container = scrollRef.current;
    const index = options.findIndex((option) => option.value === value);

    if (container && index >= 0) {
      container.scrollTo({
        top: index * WHEEL_ITEM_HEIGHT,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="relative flex-1">
      <div className="mb-3 px-2 text-center text-xs uppercase tracking-[0.25em] text-gold-300/85">
        {label}
      </div>
      <div
        className="relative overflow-hidden rounded-[24px] border border-gold-500/14 bg-white/[0.04]"
        style={{ height: `${wheelHeight}px` }}
      >
        <div
          className="pointer-events-none absolute inset-x-3 top-1/2 z-10 -translate-y-1/2 rounded-2xl border border-gold-400/25 bg-gold-400/8 shadow-[0_0_0_1px_rgba(230,195,90,0.08)]"
          style={{ height: `${WHEEL_ITEM_HEIGHT}px` }}
        />
        <div
          ref={scrollRef}
          className="h-full snap-y snap-mandatory overflow-y-auto px-3"
          style={{ paddingTop: `${edgePadding}px`, paddingBottom: `${edgePadding}px` }}
          onScroll={handleScroll}
        >
          <div>
            {options.map((option) => {
              const active = option.value === selectedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`flex h-12 w-full snap-center items-center justify-center rounded-2xl text-base font-semibold transition duration-200 ${
                    active ? "bg-gold-400 text-ink-950" : "text-mist-100 hover:bg-white/8"
                  }`}
                  onClick={() => handleClick(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileDateWheel({ draftDate, onDraftChange }) {
  const today = getTodayDate();
  const selectedYear = draftDate.getFullYear();
  const selectedMonth = draftDate.getMonth();
  const selectedDay = draftDate.getDate();
  const maxMonthIndex = selectedYear === today.getFullYear() ? today.getMonth() : 11;
  const maxDay =
    selectedYear === today.getFullYear() && selectedMonth === today.getMonth()
      ? today.getDate()
      : daysInMonth(selectedYear, selectedMonth);

  const yearOptions = useMemo(
    () =>
      Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => {
        const year = MAX_YEAR - index;
        return { value: year, label: `${year}` };
      }),
    []
  );

  const monthOptions = MONTH_LABELS.slice(0, maxMonthIndex + 1).map((label, index) => ({
    value: index,
    label
  }));

  const dayOptions = Array.from({ length: maxDay }, (_, index) => ({
    value: index + 1,
    label: `${index + 1} 日`
  }));

  const updateDate = (nextYear, nextMonth, nextDay) => {
    onDraftChange(clampDateToToday(normalizeDateParts(nextYear, nextMonth, nextDay)));
  };

  return (
    <div className="grid grid-cols-[1.15fr_0.95fr_0.9fr] gap-2 sm:grid-cols-3 sm:gap-3">
      <WheelColumn
        label="年份"
        options={yearOptions}
        selectedValue={selectedYear}
        onSelect={(year) => updateDate(year, selectedMonth, selectedDay)}
        tall
      />
      <WheelColumn
        label="月份"
        options={monthOptions}
        selectedValue={selectedMonth}
        onSelect={(month) => updateDate(selectedYear, month, selectedDay)}
      />
      <WheelColumn
        label="日期"
        options={dayOptions}
        selectedValue={selectedDay}
        onSelect={(day) => updateDate(selectedYear, selectedMonth, day)}
      />
    </div>
  );
}

function DesktopCalendarPanel({
  draftDate,
  activeMonth,
  viewMode,
  onViewModeChange,
  onMonthChange,
  onDateSelect,
  onYearSelect,
  onMonthSelect
}) {
  const monthLabel = `${activeMonth.getFullYear()} 年 ${activeMonth.getMonth() + 1} 月`;
  const days = useMemo(
    () => createMonthMatrix(activeMonth, toDateValue(draftDate)),
    [activeMonth, draftDate]
  );

  const yearOptions = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => MAX_YEAR - index);

  return (
    <div className="rounded-[24px] border border-gold-500/14 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/18 bg-white/5 text-lg text-mist-200 transition hover:border-gold-300/35 hover:text-white"
          onClick={() => onMonthChange(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="rounded-full px-4 py-2 text-base font-semibold text-white transition hover:bg-white/8 hover:text-gold-300"
          onClick={() => onViewModeChange("year")}
        >
          {monthLabel}
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/18 bg-white/5 text-lg text-mist-200 transition hover:border-gold-300/35 hover:text-white"
          onClick={() => onMonthChange(1)}
        >
          ›
        </button>
      </div>

      {viewMode === "day" ? (
        <>
          <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.2em] text-mist-400">
            {WEEK_LABELS.map((item) => (
              <span key={item} className="py-2">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-2">
            {days.map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={item.isFuture}
                className={`aspect-square rounded-2xl text-sm font-semibold transition duration-200 ${
                  item.isSelected
                    ? "bg-gold-400 text-ink-950 shadow-[0_10px_20px_rgba(198,157,45,0.22)]"
                    : item.isFuture
                      ? "cursor-not-allowed text-mist-500/30"
                      : item.isCurrentMonth
                      ? "bg-white/5 text-mist-100 hover:bg-white/10"
                      : "text-mist-400/45 hover:bg-white/[0.04]"
                } ${item.isToday && !item.isSelected ? "border border-gold-400/35" : "border border-transparent"}`}
                onClick={() => {
                  if (!item.isFuture) {
                    onDateSelect(item.date);
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {viewMode === "year" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-300/85">快速选择年份</p>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-sm font-semibold text-mist-300 transition hover:text-white"
              onClick={() => onViewModeChange("day")}
            >
              返回日期
            </button>
          </div>
          <div className="grid max-h-[300px] grid-cols-4 gap-2 overflow-y-auto pr-1">
            {yearOptions.map((year) => {
              const active = activeMonth.getFullYear() === year;
              return (
                <button
                  key={year}
                  type="button"
                  className={`rounded-2xl px-3 py-3 text-sm font-semibold transition duration-200 ${
                    active ? "bg-gold-400 text-ink-950" : "bg-white/5 text-mist-100 hover:bg-white/10"
                  }`}
                  onClick={() => onYearSelect(year)}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {viewMode === "month" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-300/85">
              选择月份 · {activeMonth.getFullYear()} 年
            </p>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-sm font-semibold text-mist-300 transition hover:text-white"
              onClick={() => onViewModeChange("year")}
            >
              重选年份
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {MONTH_LABELS.map((label, index) => {
              const active = activeMonth.getMonth() === index;
              const isFutureMonth =
                activeMonth.getFullYear() === getTodayDate().getFullYear() &&
                index > getTodayDate().getMonth();
              return (
                <button
                  key={label}
                  type="button"
                  disabled={isFutureMonth}
                  className={`rounded-2xl px-3 py-4 text-sm font-semibold transition duration-200 ${
                    active ? "bg-gold-400 text-ink-950" : "bg-white/5 text-mist-100 hover:bg-white/10"
                  }`}
                  onClick={() => {
                    if (!isFutureMonth) {
                      onMonthSelect(index);
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimeModeTabs({ mode, onChange }) {
  const items = [
    { key: TIME_INPUT_MODE.SHICHEN, label: "按时辰" },
    { key: TIME_INPUT_MODE.EXACT, label: "精确时间" },
    { key: TIME_INPUT_MODE.UNKNOWN, label: "暂不清楚" }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[24px] border border-gold-500/14 bg-white/[0.04] p-2">
      {items.map((item) => {
        const active = mode === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={`rounded-2xl px-3 py-3 text-sm font-semibold transition duration-200 ${
              active ? "bg-gold-400 text-ink-950" : "text-mist-200 hover:bg-white/10"
            }`}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ShichenOptionGrid({ options, selectedKey, onSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const active = option.key === selectedKey;

        return (
          <button
            key={option.key}
            type="button"
            disabled={option.disabled}
            className={`rounded-[24px] border px-4 py-4 text-left transition duration-200 ${
              active
                ? "border-gold-300/45 bg-gold-400/12 text-gold-200"
                : option.disabled
                  ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-mist-500/40"
                  : "border-gold-500/18 bg-white/5 text-mist-100 hover:border-gold-300/35 hover:bg-white/10"
            }`}
            onClick={() => {
              if (!option.disabled) {
                onSelect(option.key);
              }
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-base font-semibold">{option.label}</span>
              {active ? <span className="text-xs font-semibold tracking-[0.14em]">已选</span> : null}
            </div>
            <p className="mt-2 text-sm text-mist-300">{option.range}</p>
          </button>
        );
      })}
    </div>
  );
}

function UnknownTimeState() {
  return (
    <div className="rounded-[24px] border border-gold-300/25 bg-gold-400/10 px-5 py-5 text-sm leading-7 text-mist-200">
      <p className="font-semibold text-gold-200">已选择“暂不清楚”</p>
      <p className="mt-2">适用于只知道出生日期，不确定具体时辰的情况，后续报告会以更稳妥的判断输出。</p>
    </div>
  );
}

function MobileExactTimeWheel({
  hour,
  minute,
  maxHour,
  maxMinute,
  onHourChange,
  onMinuteChange
}) {
  const hourOptions = Array.from({ length: maxHour + 1 }, (_, index) => ({
    value: `${index}`.padStart(2, "0"),
    label: `${index}`.padStart(2, "0")
  }));

  const minuteLimit = hour === `${maxHour}`.padStart(2, "0") ? maxMinute : 59;
  const minuteOptions = Array.from({ length: minuteLimit + 1 }, (_, index) => ({
    value: `${index}`.padStart(2, "0"),
    label: `${index}`.padStart(2, "0")
  }));

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <WheelColumn label="小时" options={hourOptions} selectedValue={hour} onSelect={onHourChange} />
      <WheelColumn
        label="分钟"
        options={minuteOptions}
        selectedValue={minute}
        onSelect={onMinuteChange}
      />
    </div>
  );
}

function DesktopExactTimePanel({
  hour,
  minute,
  maxHour,
  maxMinute,
  onHourChange,
  onMinuteChange
}) {
  const hourOptions = Array.from({ length: maxHour + 1 }, (_, index) => `${index}`.padStart(2, "0"));
  const minuteLimit = hour === `${maxHour}`.padStart(2, "0") ? maxMinute : 59;
  const minuteOptions = Array.from({ length: minuteLimit + 1 }, (_, index) => `${index}`.padStart(2, "0"));

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-[24px] border border-gold-500/14 bg-white/[0.04] p-3">
        <p className="mb-3 px-2 text-xs uppercase tracking-[0.25em] text-gold-300/85">小时</p>
        <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
          {hourOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`w-full rounded-2xl px-4 py-3 text-base font-semibold transition duration-200 ${
                hour === item ? "bg-gold-400 text-ink-950" : "bg-white/5 text-mist-100 hover:bg-white/10"
              }`}
              onClick={() => onHourChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-gold-500/14 bg-white/[0.04] p-3">
        <p className="mb-3 px-2 text-xs uppercase tracking-[0.25em] text-gold-300/85">分钟</p>
        <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
          {minuteOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`w-full rounded-2xl px-4 py-3 text-base font-semibold transition duration-200 ${
                minute === item ? "bg-gold-400 text-ink-950" : "bg-white/5 text-mist-100 hover:bg-white/10"
              }`}
              onClick={() => onMinuteChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DatePickerField({ value, onChange }) {
  const wrapperRef = useRef(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => clampDateToToday(parseDateValue(value)));
  const [activeMonth, setActiveMonth] = useState(() => {
    const parsed = clampDateToToday(parseDateValue(value));
    return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  });
  const [viewMode, setViewMode] = useState("day");

  useEffect(() => {
    if (!open) {
      const parsed = clampDateToToday(parseDateValue(value));
      setDraftDate(parsed);
      setActiveMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [open, value]);

  useEffect(() => {
    if (!open || isMobile) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setViewMode("day");
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setViewMode("day");
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile, open]);

  const openPicker = () => {
    const parsed = clampDateToToday(parseDateValue(value));
    setDraftDate(parsed);
    setActiveMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    setViewMode("day");
    setOpen(true);
  };

  const confirm = () => {
    onChange(toDateValue(clampDateToToday(draftDate)));
    setOpen(false);
    setViewMode("day");
  };

  const close = () => {
    setOpen(false);
    setViewMode("day");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <PickerTrigger icon="calendar" value={value} onClick={openPicker} active={open} />
      <LayerShell
        isMobile={isMobile}
        title="选择出生日期"
        open={open}
        onClose={close}
        onConfirm={confirm}
      >
        {isMobile ? (
          <MobileDateWheel draftDate={draftDate} onDraftChange={setDraftDate} />
        ) : (
          <DesktopCalendarPanel
            draftDate={draftDate}
            activeMonth={activeMonth}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onMonthChange={(offset) =>
              setActiveMonth((current) => clampMonthToToday(shiftMonth(current, offset)))
            }
            onDateSelect={(date) => {
              const next = clampDateToToday(date);
              setDraftDate(next);
              setActiveMonth(new Date(next.getFullYear(), next.getMonth(), 1));
            }}
            onYearSelect={(year) => {
              const next = clampDateToToday(
                normalizeDateParts(year, activeMonth.getMonth(), draftDate.getDate())
              );
              setDraftDate(next);
              setActiveMonth(clampMonthToToday(new Date(year, activeMonth.getMonth(), 1)));
              setViewMode("month");
            }}
            onMonthSelect={(monthIndex) => {
              const next = clampDateToToday(
                normalizeDateParts(activeMonth.getFullYear(), monthIndex, draftDate.getDate())
              );
              setDraftDate(next);
              setActiveMonth(
                clampMonthToToday(new Date(activeMonth.getFullYear(), monthIndex, 1))
              );
              setViewMode("day");
            }}
          />
        )}
      </LayerShell>
    </div>
  );
}

export function TimePickerField({ value, onChange, helperText, selectedDate }) {
  const wrapperRef = useRef(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseTimeValue(value), [value]);
  const limitToNow = selectedDate === getDateValueForToday();
  const now = new Date();
  const maxHour = limitToNow ? now.getHours() : 23;
  const maxMinute = limitToNow ? now.getMinutes() : 59;
  const [draftHour, setDraftHour] = useState(parsed.hour);
  const [draftMinute, setDraftMinute] = useState(parsed.minute);
  const [draftMode, setDraftMode] = useState(parsed.mode);
  const [draftShichenKey, setDraftShichenKey] = useState(parsed.shichenKey);

  const shichenOptions = useMemo(
    () =>
      SHICHEN_OPTIONS.map((option) => ({
        ...option,
        disabled: limitToNow
          ? isFutureTimeChoice(option.hour, option.minute, maxHour, maxMinute)
          : false
      })),
    [limitToNow, maxHour, maxMinute]
  );
  const firstAvailableShichenKey =
    shichenOptions.find((item) => !item.disabled)?.key ?? SHICHEN_OPTIONS[0].key;

  useEffect(() => {
    if (!open) {
      const safeHour = Math.min(Number(parsed.hour), maxHour);
      const safeMinute =
        safeHour === maxHour ? Math.min(Number(parsed.minute), maxMinute) : Number(parsed.minute);
      setDraftHour(`${safeHour}`.padStart(2, "0"));
      setDraftMinute(`${safeMinute}`.padStart(2, "0"));
      setDraftMode(parsed.mode);
      setDraftShichenKey(parsed.shichenKey || firstAvailableShichenKey);
    }
  }, [firstAvailableShichenKey, maxHour, maxMinute, open, parsed.hour, parsed.minute, parsed.mode, parsed.shichenKey]);

  useEffect(() => {
    if (!open || draftMode !== TIME_INPUT_MODE.EXACT) {
      return;
    }

    const safeHour = Math.min(Number(draftHour), maxHour);
    const safeMinute =
      safeHour === maxHour ? Math.min(Number(draftMinute), maxMinute) : Number(draftMinute);

    if (`${safeHour}`.padStart(2, "0") !== draftHour) {
      setDraftHour(`${safeHour}`.padStart(2, "0"));
    }

    if (`${safeMinute}`.padStart(2, "0") !== draftMinute) {
      setDraftMinute(`${safeMinute}`.padStart(2, "0"));
    }
  }, [draftHour, draftMinute, draftMode, maxHour, maxMinute, open]);

  useEffect(() => {
    if (!open || draftMode !== TIME_INPUT_MODE.SHICHEN) {
      return;
    }

    const selectedOption = shichenOptions.find((item) => item.key === draftShichenKey);

    if (!selectedOption || selectedOption.disabled) {
      setDraftShichenKey(firstAvailableShichenKey);
    }
  }, [draftMode, draftShichenKey, firstAvailableShichenKey, open, shichenOptions]);

  useEffect(() => {
    if (!open || isMobile) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile, open]);

  const openPicker = () => {
    const current = parseTimeValue(value);
    const safeHour = Math.min(Number(current.hour), maxHour);
    const safeMinute =
      safeHour === maxHour ? Math.min(Number(current.minute), maxMinute) : Number(current.minute);
    setDraftHour(`${safeHour}`.padStart(2, "0"));
    setDraftMinute(`${safeMinute}`.padStart(2, "0"));
    setDraftMode(current.mode);
    setDraftShichenKey(current.shichenKey || firstAvailableShichenKey);
    setOpen(true);
  };

  const handleModeChange = (nextMode) => {
    setDraftMode(nextMode);

    if (nextMode === TIME_INPUT_MODE.SHICHEN) {
      setDraftShichenKey((current) => {
        const selectedOption = shichenOptions.find((item) => item.key === current && !item.disabled);
        return selectedOption ? selectedOption.key : firstAvailableShichenKey;
      });
    }
  };

  const confirm = () => {
    onChange(
      toTimeValue({
        mode: draftMode,
        hour: draftHour,
        minute: draftMinute,
        shichenKey: draftShichenKey
      })
    );
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <PickerTrigger icon="clock" value={value} onClick={openPicker} active={open} />
      {helperText ? <p className="mt-3 text-sm text-mist-400">{helperText}</p> : null}
      <LayerShell
        isMobile={isMobile}
        title="选择出生时间"
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      >
        <div className="space-y-4">
          <TimeModeTabs mode={draftMode} onChange={handleModeChange} />

          {draftMode === TIME_INPUT_MODE.SHICHEN ? (
            <div className="space-y-3">
              <p className="px-1 text-sm leading-7 text-mist-300">
                适合只记得大致时辰的情况。系统会按对应时段生成更贴近传统命理表达的报告。
              </p>
              <ShichenOptionGrid
                options={shichenOptions}
                selectedKey={draftShichenKey}
                onSelect={setDraftShichenKey}
              />
            </div>
          ) : null}

          {draftMode === TIME_INPUT_MODE.EXACT ? (
            isMobile ? (
              <MobileExactTimeWheel
                hour={draftHour}
                minute={draftMinute}
                maxHour={maxHour}
                maxMinute={maxMinute}
                onHourChange={setDraftHour}
                onMinuteChange={setDraftMinute}
              />
            ) : (
              <DesktopExactTimePanel
                hour={draftHour}
                minute={draftMinute}
                maxHour={maxHour}
                maxMinute={maxMinute}
                onHourChange={setDraftHour}
                onMinuteChange={setDraftMinute}
              />
            )
          ) : null}

          {draftMode === TIME_INPUT_MODE.UNKNOWN ? <UnknownTimeState /> : null}
        </div>
      </LayerShell>
    </div>
  );
}
