export function BrandMark({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.5l1.45 4.05L17.5 8l-4.05 1.45L12 13.5l-1.45-4.05L6.5 8l4.05-1.45L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 12.2l.9 2.55 2.55.9-2.55.9-.9 2.55-.9-2.55-2.55-.9 2.55-.9.9-2.55Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 14.2l.8 2.25 2.25.8-2.25.8-.8 2.25-.8-2.25-2.25-.8 2.25-.8.8-2.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.8 13.9 8l5.2 1.9-5.2 1.9L12 17l-1.9-5.2L4.9 9.9 10.1 8 12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 3.8l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function wrapPath(className, children) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function UserIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <>
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
}

export function FlashIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <path
      d="M13.5 2 6 13h4.2L9.5 22 18 10.8h-4.2L13.5 2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  );
}

export function HeartIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <path
      d="M12 20.2S4 15.4 4 9.3A4.3 4.3 0 0 1 8.2 5c1.7 0 3 .8 3.8 2 .8-1.2 2.1-2 3.8-2A4.3 4.3 0 0 1 20 9.3c0 6.1-8 10.9-8 10.9Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  );
}

export function MoonIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <path
      d="M17.5 14.5A7 7 0 0 1 9.5 6.5a7.5 7.5 0 1 0 8 8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function StarIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <path
      d="M12 3.5 14 9l5.5 2-5.5 2L12 18.5 10 13 4.5 11 10 9l2-5.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  );
}

export function SunIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <>
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.8v2.5M12 18.7v2.5M21.2 12h-2.5M5.3 12H2.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
}

export function TargetIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  );
}

export function ShieldIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <path
      d="M12 3.5 18.5 6v5.2c0 4.2-2.7 7.3-6.5 9.3-3.8-2-6.5-5.1-6.5-9.3V6L12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  );
}

export function MedalIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <>
      <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9.5 13 1.2 7L12 18l1.3 2 1.2-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

export function BriefcaseIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <>
      <path d="M4.5 8.5h15v9.5h-15z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8.5V6.7A1.7 1.7 0 0 1 10.7 5h2.6A1.7 1.7 0 0 1 15 6.7v1.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 12.5h15" stroke="currentColor" strokeWidth="1.8" />
    </>
  );
}

export function CalendarIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <>
      <rect x="4.5" y="6.2" width="15" height="13.3" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 4v4M16 4v4M4.5 9.5h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
}

export function ClockIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.7v3.8l2.5 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
}

export function PinIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <>
      <path d="M12 20s5.3-5.4 5.3-10a5.3 5.3 0 1 0-10.6 0c0 4.6 5.3 10 5.3 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="1.7" fill="currentColor" />
    </>
  );
}

export function ChevronIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  );
}

export function BackIcon({ className = "h-5 w-5" }) {
  return wrapPath(
    className,
    <path d="m14.5 6.5-5 5.5 5 5.5M9.8 12h8.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  );
}
