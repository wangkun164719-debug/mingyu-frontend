import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { UNKNOWN_TIME } from "../components/BirthPickerField";
import IconBadge from "../components/IconBadge";
import PageSection from "../components/PageSection";
import SectionTitle from "../components/SectionTitle";
import { BackIcon } from "../components/Icons";
import {
  defaultProfile,
  detailSections,
  masterQuote,
  reportHighlights
} from "../data/site";

function formatBirthMeta(profile) {
  const timeText =
    profile.birthTime === UNKNOWN_TIME
      ? "时辰待补充"
      : profile.birthTime;

  return `出生于 ${profile.birthDate} ${timeText} · ${profile.birthPlace}`;
}

export default function DetailReportPage() {
  const { state } = useLocation();
  const profile = useMemo(() => state?.profile ?? defaultProfile, [state]);

  return (
    <div className="pb-6">
      <PageSection className="pt-10 sm:pt-12">
        <Link
          to="/measure"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold-300 transition duration-200 hover:text-gold-200"
        >
          <BackIcon className="h-4 w-4" />
          重新测算
        </Link>
      </PageSection>

      <PageSection className="pt-6">
        <SectionTitle
          title={`${profile.name || "命主"}的命理解读`}
          subtitle={formatBirthMeta(profile)}
        />
      </PageSection>

      <PageSection className="pt-12">
        <div className="panel p-6 sm:p-8 lg:p-10">
          <h3 className="flex items-center gap-3 text-3xl font-semibold text-white">
            <IconBadge icon="star" className="h-12 w-12 rounded-2xl" />
            命理概览
          </h3>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {reportHighlights.map((item) => (
              <div
                key={item.label}
                className="rounded-[26px] border border-gold-500/12 bg-white/5 px-5 py-6 text-center"
              >
                <p className="text-sm text-mist-400">{item.label}</p>
                <p className="mt-3 text-4xl font-semibold text-gold-300">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection className="space-y-5 pt-6">
        {detailSections.map((section) => (
          <article key={section.title} className="panel p-6 sm:p-8 lg:p-10">
            <h3 className="flex items-center gap-3 text-2xl font-semibold text-white">
              <IconBadge icon={section.icon} className="h-11 w-11 rounded-2xl" />
              {section.title}
            </h3>
            <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">{section.description}</p>
            {section.score ? <p className="mt-4 text-sm font-semibold text-gold-300">{section.score}</p> : null}
          </article>
        ))}

        <article className="panel p-6 sm:p-8 lg:p-10">
          <h3 className="flex items-center gap-3 text-2xl font-semibold text-gold-300">
            <IconBadge icon="star" className="h-11 w-11 rounded-2xl" />
            命理师寄语
          </h3>
          <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">“{masterQuote}”</p>
        </article>
      </PageSection>

      <PageSection className="py-14 text-center">
        <p className="text-sm text-mist-300">以上解读仅供参考，具体情况还需结合个人实际综合分析</p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/measure"
            className="rounded-full border border-gold-400/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-mist-100 transition duration-200 hover:border-gold-300/40 hover:bg-white/10 active:scale-[0.98]"
          >
            重新测算
          </Link>
          <Link
            to="/"
            className="rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
          >
            返回首页
          </Link>
        </div>
      </PageSection>
    </div>
  );
}
