import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatBirthTimeDisplay } from "../components/BirthPickerField";
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

function formatBirthMeta(profile) {
  const timeText = profile.birthTime ? formatBirthTimeDisplay(profile.birthTime) : "时辰待补充";
  return `出生于 ${profile.birthDate} ${timeText} · ${profile.birthPlace}`;
}

function LoadingState() {
  return (
    <div className="panel mx-auto max-w-4xl p-6 sm:p-8 lg:p-10">
      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-[26px] border border-gold-500/12 bg-white/5 p-5 animate-pulse"
          >
            <div className="h-5 w-24 rounded-full bg-white/10" />
            <div className="mt-4 h-4 w-full rounded-full bg-white/10" />
            <div className="mt-3 h-4 w-4/5 rounded-full bg-white/10" />
            <div className="mt-3 h-4 w-2/3 rounded-full bg-white/10" />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[28px] border border-gold-500/12 bg-white/5 p-6 sm:p-7">
        <div className="h-7 w-36 rounded-full bg-white/10 animate-pulse" />
        <div className="mt-5 h-4 w-full rounded-full bg-white/10 animate-pulse" />
        <div className="mt-3 h-4 w-[92%] rounded-full bg-white/10 animate-pulse" />
        <div className="mt-3 h-4 w-[86%] rounded-full bg-white/10 animate-pulse" />
        <div className="mt-5 h-4 w-full rounded-full bg-white/10 animate-pulse" />
        <div className="mt-3 h-4 w-[90%] rounded-full bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="panel mx-auto max-w-4xl p-6 text-center sm:p-8 lg:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/20 bg-gold-400/10 text-gold-300">
        <span className="text-2xl">!</span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold text-white">简版解读暂时生成失败</h3>
      <p className="mt-3 text-sm leading-7 text-mist-300 sm:text-base">
        这次请求没有顺利返回结果。我们已经保留了你的填写信息，可以直接重试，不需要重新填写。
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
          to="/measure"
          className="rounded-full border border-gold-400/25 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-mist-100 transition duration-200 hover:border-gold-300/40 hover:bg-white/10 active:scale-[0.98]"
          onClick={() => trackEvent("click_retry_measure", { cta_area: "simple_report_error" })}
        >
          返回填写页
        </Link>
      </div>
    </div>
  );
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
        {loading && !preview ? <LoadingState /> : null}

        {!loading && error ? <ErrorState onRetry={() => loadPreview(true)} /> : null}

        {!loading && preview ? (
          <div className="panel mx-auto max-w-4xl p-6 sm:p-8 lg:p-10">
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

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
                onClick={() => {
                  trackEvent("click_detail_report", { cta_area: "simple_report" });
                  trackPayEvent("pay_button_click", { cta_area: "simple_report" });
                  setPaymentOpen(true);
                }}
              >
                查看详细报告
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
