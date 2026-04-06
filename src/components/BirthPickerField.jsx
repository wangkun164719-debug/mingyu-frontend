import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, ClockIcon } from "./Icons";

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => `${index + 1} 月`);
const MIN_YEAR = 1940;
const MAX_YEAR = new Date().getFullYear();
export const UNKNOWN_TIME = "UNKNOWN";

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

  if (value === UNKNOWN_TIME) {
    return "暂不清楚具体出生时间";
  }

  return value;
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
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  return normalizeDateParts(year, month - 1, day);
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

    return {
      value,
      label: date.getDate(),
      date,
      isCurrentMonth,
      isToday,
      isSelected
    };
  });
}

function shiftMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function parseTimeValue(value) {
  if (!value || value === UNKNOWN_TIME) {
    return { hour: "12", minute: "00", unknown: value === UNKNOWN_TIME };
  }

  const [hour, minute] = value.split(":");
  return { hour, minute, unknown: false };
}

function toTimeValue(hour, minute, unknown) {
  if (unknown) {
    return UNKNOWN_TIME;
  }

  return `${hour}:${minute}`;
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
    return (
      <div className="fixed inset-0 z-50">
        <button
          type="button"
          className="absolute inset-0 bg-[#030712]/70 backdrop-blur-sm"
          onClick={onClose}
          aria-label="关闭选择器"
        />
        <div className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-gold-500/18 bg-[linear-gradient(180deg,rgba(18,29,56,0.98),rgba(15,24,47,0.98))] px-4 pb-5 pt-4 shadow-[0_-20px_60px_rgba(4,10,24,0.55)] animate-modal sm:px-6">
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
          {children}
        </div>
      </div>
    );
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
  return (
    <div className="relative flex-1">
      <div className="mb-3 px-2 text-center text-xs uppercase tracking-[0.25em] text-gold-300/85">
        {label}
      </div>
      <div className={`relative overflow-hidden rounded-[24px] border border-gold-500/14 bg-white/[0.04] ${tall ? "h-[260px]" : "h-[220px]"}`}>
        <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 h-12 -translate-y-1/2 rounded-2xl border border-gold-400/25 bg-gold-400/8 shadow-[0_0_0_1px_rgba(230,195,90,0.08)]" />
        <div className="h-full snap-y snap-mandatory overflow-y-auto px-3 py-[84px]">
          <div className="space-y-2">
            {options.map((option) => {
              const active = option.value === selectedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`flex h-12 w-full snap-center items-center justify-center rounded-2xl text-base font-semibold transition duration-200 ${
                    active
                      ? "bg-gold-400 text-ink-950"
                      : "text-mist-100 hover:bg-white/8"
                  }`}
                  onClick={() => onSelect(option.value)}
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
  const selectedYear = draftDate.getFullYear();
  const selectedMonth = draftDate.getMonth();
  const selectedDay = draftDate.getDate();

  const yearOptions = useMemo(
    () =>
      Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => {
        const year = MAX_YEAR - index;
        return { value: year, label: `${year}` };
      }),
    []
  );

  const monthOptions = MONTH_LABELS.map((label, index) => ({
    value: index,
    label
  }));

  const dayOptions = Array.from({ length: daysInMonth(selectedYear, selectedMonth) }, (_, index) => ({
    value: index + 1,
    label: `${index + 1} 日`
  }));

  const updateDate = (nextYear, nextMonth, nextDay) => {
    onDraftChange(normalizeDateParts(nextYear, nextMonth, nextDay));
  };

  return (
    <div className="grid grid-cols-3 gap-3">
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
                className={`aspect-square rounded-2xl text-sm font-semibold transition duration-200 ${
                  item.isSelected
                    ? "bg-gold-400 text-ink-950 shadow-[0_10px_20px_rgba(198,157,45,0.22)]"
                    : item.isCurrentMonth
                      ? "bg-white/5 text-mist-100 hover:bg-white/10"
                      : "text-mist-400/45 hover:bg-white/[0.04]"
                } ${item.isToday && !item.isSelected ? "border border-gold-400/35" : "border border-transparent"}`}
                onClick={() => onDateSelect(item.date)}
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
                    active
                      ? "bg-gold-400 text-ink-950"
                      : "bg-white/5 text-mist-100 hover:bg-white/10"
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
              return (
                <button
                  key={label}
                  type="button"
                  className={`rounded-2xl px-3 py-4 text-sm font-semibold transition duration-200 ${
                    active
                      ? "bg-gold-400 text-ink-950"
                      : "bg-white/5 text-mist-100 hover:bg-white/10"
                  }`}
                  onClick={() => onMonthSelect(index)}
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

function TimePanel({ unknown, hour, minute, onUnknownChange, onHourChange, onMinuteChange }) {
  const hourOptions = Array.from({ length: 24 }, (_, index) => `${index}`.padStart(2, "0"));
  const minuteOptions = Array.from({ length: 60 }, (_, index) => `${index}`.padStart(2, "0"));

  return (
    <div className="space-y-4">
      <button
        type="button"
        className={`w-full rounded-2xl border px-4 py-4 text-left transition duration-200 ${
          unknown
            ? "border-gold-300/45 bg-gold-400/12 text-gold-300"
            : "border-gold-500/18 bg-white/5 text-mist-200 hover:border-gold-300/35 hover:bg-white/10"
        }`}
        onClick={() => onUnknownChange(!unknown)}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-base font-semibold">暂不清楚具体出生时间</span>
          <span className="text-sm">{unknown ? "已选择" : "可选"}</span>
        </div>
        <p className="mt-2 text-sm text-mist-400">适用于只知道出生日期、不确定具体时辰的情况。</p>
      </button>

      <div className="grid gap-4 grid-cols-2">
        <div className="rounded-[24px] border border-gold-500/14 bg-white/[0.04] p-3">
          <p className="mb-3 px-2 text-xs uppercase tracking-[0.25em] text-gold-300/85">小时</p>
          <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            {hourOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={`w-full rounded-2xl px-4 py-3 text-base font-semibold transition duration-200 ${
                  hour === item && !unknown
                    ? "bg-gold-400 text-ink-950"
                    : "bg-white/5 text-mist-100 hover:bg-white/10"
                }`}
                onClick={() => {
                  onUnknownChange(false);
                  onHourChange(item);
                }}
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
                  minute === item && !unknown
                    ? "bg-gold-400 text-ink-950"
                    : "bg-white/5 text-mist-100 hover:bg-white/10"
                }`}
                onClick={() => {
                  onUnknownChange(false);
                  onMinuteChange(item);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DatePickerField({ value, onChange }) {
  const wrapperRef = useRef(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => parseDateValue(value));
  const [activeMonth, setActiveMonth] = useState(() => {
    const parsed = parseDateValue(value);
    return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  });
  const [viewMode, setViewMode] = useState("day");

  useEffect(() => {
    const parsed = parseDateValue(value);
    setDraftDate(parsed);
    setActiveMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [value]);

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

  const confirm = () => {
    onChange(toDateValue(draftDate));
    setOpen(false);
    setViewMode("day");
  };

  const close = () => {
    setOpen(false);
    setViewMode("day");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <PickerTrigger
        icon="calendar"
        value={value}
        onClick={() => {
          setOpen(true);
          setViewMode("day");
        }}
        active={open}
      />
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
            onMonthChange={(offset) => setActiveMonth((current) => shiftMonth(current, offset))}
            onDateSelect={(date) => {
              setDraftDate(date);
              setActiveMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
            onYearSelect={(year) => {
              const next = normalizeDateParts(year, activeMonth.getMonth(), draftDate.getDate());
              setDraftDate(next);
              setActiveMonth(new Date(year, activeMonth.getMonth(), 1));
              setViewMode("month");
            }}
            onMonthSelect={(monthIndex) => {
              const next = normalizeDateParts(activeMonth.getFullYear(), monthIndex, draftDate.getDate());
              setDraftDate(next);
              setActiveMonth(new Date(activeMonth.getFullYear(), monthIndex, 1));
              setViewMode("day");
            }}
          />
        )}
      </LayerShell>
    </div>
  );
}

export function TimePickerField({ value, onChange, helperText }) {
  const wrapperRef = useRef(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseTimeValue(value), [value]);
  const [draftHour, setDraftHour] = useState(parsed.hour);
  const [draftMinute, setDraftMinute] = useState(parsed.minute);
  const [draftUnknown, setDraftUnknown] = useState(parsed.unknown);

  useEffect(() => {
    setDraftHour(parsed.hour);
    setDraftMinute(parsed.minute);
    setDraftUnknown(parsed.unknown);
  }, [parsed]);

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

  const confirm = () => {
    onChange(toTimeValue(draftHour, draftMinute, draftUnknown));
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <PickerTrigger icon="clock" value={value} onClick={() => setOpen(true)} active={open} />
      {helperText ? <p className="mt-3 text-sm text-mist-400">{helperText}</p> : null}
      <LayerShell
        isMobile={isMobile}
        title="选择出生时间"
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      >
        <TimePanel
          unknown={draftUnknown}
          hour={draftHour}
          minute={draftMinute}
          onUnknownChange={setDraftUnknown}
          onHourChange={setDraftHour}
          onMinuteChange={setDraftMinute}
        />
      </LayerShell>
    </div>
  );
}
