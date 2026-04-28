import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { navigationLinks } from "../data/site";
import { trackEvent } from "../services/analytics";
import { SparkIcon } from "./Icons";

function navClass({ isActive }) {
  return [
    "transition duration-200 hover:text-gold-300",
    isActive ? "text-gold-400" : "text-mist-200"
  ].join(" ");
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const trackNavClick = (to) => {
    if (to === "/about") {
      trackEvent("click_about", { nav_area: "header" });
    }

    if (to === "/faq") {
      trackEvent("click_faq", { nav_area: "header" });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gold-500/10 bg-ink-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
          <img
            src="/brand/mingyu-icon.png"
            alt="命语"
            className="h-9 w-9 rounded-full bg-white object-contain"
          />
          <span className="font-display tracking-[0.2em] text-white">命语</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm lg:flex">
          {navigationLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass} onClick={() => trackNavClick(item.to)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            to="/measure"
            className="inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(198,157,45,0.24)] active:scale-[0.98]"
            onClick={() => trackEvent("click_start_measure", { nav_area: "header" })}
          >
            立即测算
            <SparkIcon className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          aria-label="打开菜单"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/20 bg-white/5 text-gold-300 transition duration-200 hover:border-gold-300/40 lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="flex flex-col gap-1">
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-gold-500/10 bg-ink-950/95 px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            {navigationLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navClass}
                onClick={() => {
                  trackNavClick(item.to);
                  setOpen(false);
                }}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/measure"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-gold-300/40 bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950"
              onClick={() => {
                trackEvent("click_start_measure", { nav_area: "mobile_header" });
                setOpen(false);
              }}
            >
              立即测算
              <SparkIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
