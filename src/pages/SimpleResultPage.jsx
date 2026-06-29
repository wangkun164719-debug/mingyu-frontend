import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatBirthTimeDisplay } from "../components/BirthPickerField";
import GeneratingReportScreen, { getGeneratingPreference } from "../components/GeneratingReportScreen";
import IconBadge from "../components/IconBadge";
import PageIntro from "../components/PageIntro";
import PageSection from "../components/PageSection";
import PaymentModal from "../components/PaymentModal";
import { defaultProfile } from "../data/site";
import {
  fetchPreviewReport,
  loadLatestProfile,
  peekPreviewReport,
  saveLatestProfile
} from "../services/reportApi";
import { trackEvent, trackPayEvent, usePageView, useScrollDepth } from "../services/analytics";

const detailUnlockItems = ["事业与财富节奏", "关系与情感提醒", "接下来一段时间的行动建议"];

function formatBirthMeta(profile) {
  const timeText = profile.birthTime ? formatBirthTimeDisplay(profile.birthTime) : "时辰待补充";
  return `出生于 ${profile.birthDate} ${timeText} · ${profile.birthPlace}`;
}

export default function SimpleResultPage() {
  usePageView("report");
  useScrollDepth({ 50: "report_scroll_50", 90: "report_scroll_90" });

  const navigate = useNavigate();
  const { state } = useLocation();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const profile = useMemo(
    () => state?.profile ?? loadLatestProfile() ?? defaultProfile,
    [state]
  );

  const [preview, setPreview] = useState(() => peekPreviewReport(profile));
  const [loading, setLoading] = useState(() => !peekPreviewReport(profile));
  const [error, setError] = useState("");
  const generatingPreference = useMemo(
    () => getGeneratingPreference(profile.preferences?.[0]),
    [profile.preferences]
  );

  const loadPreview = useCallback(
    async (force = false) => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchPreviewReport(profile, { force });
        setPreview(data);
      } catch (requestError) {
        setError(requestError?.message || "简版解读生成失败，请稍后再试。");
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
    setPreview(peekPreviewReport(profile));
    setLoading(!peekPreviewReport(profile));
    setError("");
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    const request = async () => {
      if (peekPreviewReport(profile)) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchPreviewReport(profile);

        if (!cancelled) {
          setPreview(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError?.message || "简版解读生成失败，请稍后再试。");
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

  return (
    <div className="pb-6">
      <PageIntro
        title={preview?.title || `${profile.name || "命主"}的简版解读`}
        subtitle={formatBirthMeta(profile)}
      />

      <PageSection className="pt-12">
        {loading && !preview ? (
          <GeneratingReportScreen
            mode="basic"
            preference={generatingPreference}
            status="generating"
          />
        ) : null}

        {!loading && error ? (
          <GeneratingReportScreen
            mode="basic"
            preference={generatingPreference}
            status="error"
            onRetry={() => loadPreview(true)}
          />
        ) : null}

        {!loading && preview ? (
          <div className="panel mx-auto max-w-4xl p-6 sm:p-8 lg:p-10 animate-rise">
            <div className="grid gap-5 lg:grid-cols-3">
              {preview.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[26px] border border-gold-500/12 bg-white/5 p-5"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <IconBadge icon={card.icon} className="h-10 w-10 rounded-xl" />
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                  </div>
                  <p className="text-sm leading-7 text-mist-300">{card.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] border border-gold-500/12 bg-white/5 p-6 sm:p-7">
              <h3 className="text-2xl font-semibold text-white">简版解读</h3>
              <p className="mt-4 text-sm leading-8 text-mist-200 sm:text-base">{preview.summary}</p>
              {preview.interpretations.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-sm leading-8 text-mist-300 sm:text-base">
                  {paragraph}
                </p>
              ))}
              <p className="mt-4 text-sm leading-8 text-gold-200 sm:text-base">{preview.advice}</p>
            </div>

            <div className="mt-8 rounded-[28px] border border-gold-400/18 bg-gold-400/8 p-5 sm:p-6">
              <p className="text-sm font-semibold text-gold-200">完整报告将继续展开</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {detailUnlockItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-gold-400/18 bg-white/5 px-4 py-2 text-xs font-semibold text-mist-100 sm:text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
                onClick={() => {
                  trackEvent("click_detail_report", {
                    cta_area: "simple_report",
                    cta_variant: "specific_detail_value"
                  });
                  trackPayEvent("pay_button_click", {
                    cta_area: "simple_report",
                    cta_variant: "specific_detail_value"
                  });
                  setPaymentOpen(true);
                }}
              >
                继续看事业、财运与关系完整分析
              </button>
              <Link
                to="/measure"
                className="rounded-full border border-gold-400/25 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-mist-100 transition duration-200 hover:border-gold-300/40 hover:bg-white/10 active:scale-[0.98]"
                onClick={() => trackEvent("click_retry_measure", { cta_area: "simple_report" })}
              >
                重新填写
              </Link>
            </div>
          </div>
        ) : null}
      </PageSection>

      <PaymentModal
        open={paymentOpen}
        onClose={() => {
          trackPayEvent("pay_cancel", { pay_mode: "free_trial" });
          setPaymentOpen(false);
        }}
        onConfirm={() => {
          trackPayEvent("pay_success", { pay_mode: "free_trial" });
          navigate("/report", {
            state: {
              profile,
              preview
            }
          });
        }}
      />
    </div>
  );
}
