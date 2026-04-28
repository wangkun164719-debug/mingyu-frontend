import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { formatBirthTimeDisplay } from "../components/BirthPickerField";
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
import { trackEvent, usePageView, useScrollDepth } from "../services/analytics";

function formatBirthMeta(profile) {
  const timeText = profile.birthTime ? formatBirthTimeDisplay(profile.birthTime) : "时辰待补充";
  return `出生于 ${profile.birthDate} ${timeText} · ${profile.birthPlace}`;
}

function asList(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function getFinalMessage(report) {
  return report?.final_message || report?.finalMessage || "";
}

function orderSections(report) {
  if (!report?.sections) {
    return [];
  }

  const explicitOrder = Array.isArray(report.sectionOrder) ? report.sectionOrder : null;
  const fallbackOrder = ["overall", "personality", "career", "wealth", "relationship", "advice"];
  const order = explicitOrder?.length ? explicitOrder : fallbackOrder;

  return order.map((key) => report.sections[key]).filter(Boolean);
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
          这次 AI 请求没有顺利完成。你可以直接重试，我们会继续沿用刚才填写的信息。
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
            onClick={() => trackEvent("click_retry_measure", { cta_area: "detail_report_error" })}
          >
            返回简版结果
          </Link>
        </div>
      </div>
    </PageSection>
  );
}

function InsightGroup({ title, items, accent }) {
  const list = asList(items);

  if (!list.length) {
    return null;
  }

  const accentClass =
    accent === "gold"
      ? "border-gold-400/18 bg-gold-400/8"
      : accent === "rose"
        ? "border-rose-300/18 bg-rose-300/8"
        : "border-white/10 bg-white/5";

  return (
    <div className={`rounded-[24px] border p-5 ${accentClass}`}>
      <h4 className="text-sm font-semibold tracking-[0.18em] text-mist-100">{title}</h4>
      <ul className="mt-4 space-y-3">
        {list.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-mist-200">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DetailReportPage() {
  usePageView("report");
  useScrollDepth({ 50: "report_scroll_50", 90: "report_scroll_90" });

  const { state } = useLocation();
  const profile = useMemo(
    () => state?.profile ?? loadLatestProfile() ?? defaultProfile,
    [state]
  );

  const cachedReport = useMemo(() => peekFullReport(profile), [profile]);
  const [report, setReport] = useState(cachedReport);
  const [loading, setLoading] = useState(() => !cachedReport);
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
    const nextCachedReport = peekFullReport(profile);
    setReport(nextCachedReport);
    setLoading(!nextCachedReport);
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
  const finalMessage = getFinalMessage(report);
  const keySignals = asList(report?.keySignals);
  const actionPlan = asList(report?.actionPlan);
  const priorities = asList(report?.strategicFocus?.priorities);
  const cautions = asList(report?.strategicFocus?.cautions);

  return (
    <div className="pb-6">
      <PageSection className="pt-10 sm:pt-12">
        <Link
          to="/measure"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold-300 transition duration-200 hover:text-gold-200"
          onClick={() => trackEvent("click_retry_measure", { cta_area: "detail_report_top" })}
        >
          <BackIcon className="h-4 w-4" />
          重新测算
        </Link>
      </PageSection>

      <PageSection className="pt-6">
        <SectionTitle
          title={report?.title || `${profile.name || "命主"}的详细解析`}
          subtitle={formatBirthMeta(profile)}
        />
      </PageSection>

      {loading && !report ? <LoadingState /> : null}
      {!loading && error ? <ErrorState onRetry={() => loadReport(true)} /> : null}

      {!loading && report ? (
        <>
          <PageSection className="pt-12">
            <div className="panel p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <h3 className="flex items-center gap-3 text-3xl font-semibold text-white">
                    <IconBadge icon="star" className="h-12 w-12 rounded-2xl" />
                    命理概览
                  </h3>
                  <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">
                    {report.summary}
                  </p>
                </div>
                <div className="rounded-[24px] border border-gold-400/14 bg-white/5 px-5 py-4 text-sm text-mist-300 lg:max-w-xs">
                  <p className="font-semibold tracking-[0.16em] text-gold-200">阅读建议</p>
                  <p className="mt-3 leading-7">
                    先看总评与阶段判断，再看各主题下的风险提醒和行动建议，这样更容易把报告转成实际决策。
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {asList(report.overviewCards).map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[26px] border border-gold-500/12 bg-white/5 px-5 py-6 text-center"
                  >
                    <p className="text-sm text-mist-400">{item.label}</p>
                    <p className="mt-3 text-4xl font-semibold text-gold-300">{item.value}</p>
                  </div>
                ))}
              </div>

              {keySignals.length ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                  {keySignals.map((item) => (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-6"
                    >
                      <p className="text-xs font-semibold tracking-[0.18em] text-mist-400">
                        {item.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                      {item.detail ? (
                        <p className="mt-3 text-sm leading-7 text-mist-300">{item.detail}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </PageSection>

          {report.strategicFocus ? (
            <PageSection className="pt-6">
              <div className="panel p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-3">
                  <IconBadge icon="target" className="h-11 w-11 rounded-2xl" />
                  <div>
                    <h3 className="text-2xl font-semibold text-white">
                      {report.strategicFocus.title || "现阶段判断"}
                    </h3>
                    <p className="mt-1 text-sm text-mist-400">先抓重点，再扩展动作</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">
                  {report.strategicFocus.summary}
                </p>

                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  <InsightGroup title="优先推进" items={priorities} accent="gold" />
                  <InsightGroup title="特别留意" items={cautions} accent="rose" />
                </div>
              </div>
            </PageSection>
          ) : null}

          <PageSection className="space-y-5 pt-6">
            {sections.map((section) => (
              <article key={section.title} className="panel p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <h3 className="flex items-center gap-3 text-2xl font-semibold text-white">
                      <IconBadge icon={section.icon} className="h-11 w-11 rounded-2xl" />
                      {section.title}
                    </h3>
                    <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">
                      {section.description}
                    </p>
                  </div>
                  {section.score ? (
                    <div className="rounded-full border border-gold-300/25 bg-gold-400/10 px-4 py-2 text-sm font-semibold text-gold-200">
                      {section.score}
                    </div>
                  ) : null}
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                  <InsightGroup title="核心判断" items={section.highlights} accent="gold" />
                  <InsightGroup title="风险提醒" items={section.cautions} accent="rose" />
                  <InsightGroup title="可执行动作" items={section.actions} />
                </div>
              </article>
            ))}
          </PageSection>

          {actionPlan.length ? (
            <PageSection className="pt-6">
              <div className="panel p-6 sm:p-8 lg:p-10">
                <h3 className="flex items-center gap-3 text-2xl font-semibold text-white">
                  <IconBadge icon="calendar" className="h-11 w-11 rounded-2xl" />
                  下一阶段行动路线
                </h3>
                <p className="mt-4 text-sm leading-8 text-mist-300 sm:text-base">
                  这部分是把命理解读转成现实动作的关键。先做收拢，再做稳定推进，最后再考虑放大。
                </p>

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                  {actionPlan.map((item) => (
                    <div
                      key={`${item.title}-${item.horizon}`}
                      className="rounded-[24px] border border-gold-500/12 bg-white/5 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <IconBadge icon={item.icon || "target"} className="h-10 w-10 rounded-xl" />
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-xs tracking-[0.14em] text-gold-200">{item.horizon}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-mist-300">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </PageSection>
          ) : null}

          {finalMessage ? (
            <PageSection className="pt-6">
              <article className="panel p-6 sm:p-8 lg:p-10">
                <h3 className="flex items-center gap-3 text-2xl font-semibold text-gold-300">
                  <IconBadge icon="star" className="h-11 w-11 rounded-2xl" />
                  命语寄语
                </h3>
                <p className="mt-5 text-sm leading-8 text-mist-200 sm:text-base">
                  “{finalMessage}”
                </p>
              </article>
            </PageSection>
          ) : null}

          <PageSection className="py-14 text-center">
            <p className="text-sm text-mist-300">
              以上解读仅供参考，具体情况仍需结合个人实际综合分析。
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/measure"
                className="rounded-full border border-gold-400/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-mist-100 transition duration-200 hover:border-gold-300/40 hover:bg-white/10 active:scale-[0.98]"
                onClick={() => trackEvent("click_retry_measure", { cta_area: "detail_report_bottom" })}
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
