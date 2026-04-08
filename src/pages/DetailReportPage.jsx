import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UNKNOWN_TIME } from "../components/BirthPickerField";
import IconBadge from "../components/IconBadge";
import { BackIcon } from "../components/Icons";
import PageSection from "../components/PageSection";
import SectionTitle from "../components/SectionTitle";
import { defaultProfile } from "../data/site";
import {
  fetchFullReport,
  loadLatestProfile,
  peekFullReport,
  saveLatestProfile
} from "../services/reportApi";
import { usePageView } from "../services/analytics";

function formatBirthMeta(profile) {
  const timeText = profile.birthTime === UNKNOWN_TIME ? "时辰待补充" : profile.birthTime;
  return `出生于 ${profile.birthDate} ${timeText} · ${profile.birthPlace}`;
}

function LoadingState() {
  return (
    <>
      <PageSection className="pt-12">
        <div className="panel p-6 sm:p-8 lg:p-10 animate-pulse">
          <div className="h-8 w-40 rounded-full bg-white/10" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="rounded-[26px] border border-gold-500/12 bg-white/5 px-5 py-6"
              >
                <div className="mx-auto h-4 w-20 rounded-full bg-white/10" />
                <div className="mx-auto mt-4 h-10 w-16 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection className="space-y-5 pt-6">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="panel p-6 sm:p-8 lg:p-10 animate-pulse">
            <div className="h-7 w-40 rounded-full bg-white/10" />
            <div className="mt-5 h-4 w-full rounded-full bg-white/10" />
            <div className="mt-3 h-4 w-[94%] rounded-full bg-white/10" />
            <div className="mt-3 h-4 w-[86%] rounded-full bg-white/10" />
          </article>
        ))}
      </PageSection>
    </>
  );
}

function ErrorState({ onRetry }) {
  return (
    <PageSection className="pt-12">
      <div className="panel p-6 text-center sm:p-8 lg:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/20 bg-gold-400/10 text-gold-300">
          <span className="text-2xl">!</span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-white">详细报告暂时未能加载</h3>
        <p className="mt-3 text-sm leading-7 text-mist-300 sm:text-base">
          AI 报告请求这次没有顺利完成。你可以直接重试，我们会继续沿用刚才填写的信息。
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
            onClick={onRetry}
          >
            重新生成
          </button>
          <Link
            to="/result"
            className="rounded-full border border-gold-400/25 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-mist-100 transition duration-200 hover:border-gold-300/40 hover:bg-white/10 active:scale-[0.98]"
          >
            返回简版结果
          </Link>
        </div>
      </div>
    </PageSection>
  );
}

function orderSections(report) {
  if (!report?.sections) {
    return [];
  }

  return ["overall", "personality", "career", "wealth", "relationship", "advice"]
    .map((key) => report.sections[key])
    .filter(Boolean);
}

export default function DetailReportPage() {
  usePageView("report");

  const { state } = useLocation();
  const profile = useMemo(
    () => state?.profile ?? loadLatestProfile() ?? defaultProfile,
    [state]
  );

  const [report, setReport] = useState(() => peekFullReport(profile));
  const [loading, setLoading] = useState(() => !peekFullReport(profile));
  const [error, setError] = useState("");

  const loadReport = useCallback(
    async (force = false) => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchFullReport(profile, { force });
        setReport(data);
      } catch (requestError) {
        setError(requestError?.message || "详细报告生成失败，请稍后重试。");
      } finally {
        setLoading(false);
      }
    },
    [profile]
  );

  useEffect(() => {
    saveLatestProfile(profile);
  }, [profile]);

  useEffect(() => {
    setReport(peekFullReport(profile));
    setLoading(!peekFullReport(profile));
    setError("");
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    const request = async () => {
      if (peekFullReport(profile)) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchFullReport(profile);

        if (!cancelled) {
          setReport(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError?.message || "详细报告生成失败，请稍后重试。");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    request();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const sections = orderSections(report);

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
          title={report?.title || `${profile.name || "命主"}的命理解读`}
          subtitle={formatBirthMeta(profile)}
        />
      </PageSection>

      {loading && !report ? <LoadingState /> : null}
      {!loading && error ? <ErrorState onRetry={() => loadReport(true)} /> : null}

      {!loading && report ? (
        <>
          <PageSection className="pt-12">
            <div className="panel p-6 sm:p-8 lg:p-10">
              <h3 className="flex items-center gap-3 text-3xl font-semibold text-white">
                <IconBadge icon="star" className="h-12 w-12 rounded-2xl" />
                命理概览
              </h3>
              <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">{report.summary}</p>
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {report.overviewCards.map((item) => (
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
            {sections.map((section) => (
              <article key={section.title} className="panel p-6 sm:p-8 lg:p-10">
                <h3 className="flex items-center gap-3 text-2xl font-semibold text-white">
                  <IconBadge icon={section.icon} className="h-11 w-11 rounded-2xl" />
                  {section.title}
                </h3>
                <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">
                  {section.description}
                </p>
                {section.score ? (
                  <p className="mt-4 text-sm font-semibold text-gold-300">{section.score}</p>
                ) : null}
              </article>
            ))}

            <article className="panel p-6 sm:p-8 lg:p-10">
              <h3 className="flex items-center gap-3 text-2xl font-semibold text-gold-300">
                <IconBadge icon="star" className="h-11 w-11 rounded-2xl" />
                命语寄语
              </h3>
              <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">
                “{report.final_message}”
              </p>
            </article>
          </PageSection>

          <PageSection className="py-14 text-center">
            <p className="text-sm text-mist-300">
              以上解读仅供参考，具体情况还需结合个人实际综合分析
            </p>
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
        </>
      ) : null}
    </div>
  );
}
