import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UNKNOWN_TIME } from "../components/BirthPickerField";
import PageIntro from "../components/PageIntro";
import PageSection from "../components/PageSection";
import PaymentModal from "../components/PaymentModal";
import IconBadge from "../components/IconBadge";
import { defaultProfile } from "../data/site";

function formatBirthMeta(profile) {
  const timeText =
    profile.birthTime === UNKNOWN_TIME
      ? "时辰待补充"
      : profile.birthTime;

  return `出生于 ${profile.birthDate} ${timeText} · ${profile.birthPlace}`;
}

export default function SimpleResultPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const profile = useMemo(() => state?.profile ?? defaultProfile, [state]);

  return (
    <div className="pb-6">
      <PageIntro
        title={`${profile.name || "命主"}的简版解读`}
        subtitle={formatBirthMeta(profile)}
      />

      <PageSection className="pt-12">
        <div className="panel mx-auto max-w-4xl p-6 sm:p-8 lg:p-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-[26px] border border-gold-500/12 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-3">
                <IconBadge icon="star" className="h-10 w-10 rounded-xl" />
                <h3 className="text-lg font-semibold text-white">命理概览</h3>
              </div>
              <p className="text-sm leading-7 text-mist-300">
                你整体呈现出稳中有进的气质，外柔内定，拥有较强的观察力和长期主义倾向。
              </p>
            </div>

            <div className="rounded-[26px] border border-gold-500/12 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-3">
                <IconBadge icon="briefcase" className="h-10 w-10 rounded-xl" />
                <h3 className="text-lg font-semibold text-white">偏好主题</h3>
              </div>
              <p className="text-sm leading-7 text-mist-300">
                当前最值得关注的是 {profile.preferences?.join("、") || "事业与情感"}，适合把注意力放在稳定节奏与关键选择上。
              </p>
            </div>

            <div className="rounded-[26px] border border-gold-500/12 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-3">
                <IconBadge icon="heart" className="h-10 w-10 rounded-xl" />
                <h3 className="text-lg font-semibold text-white">近期提醒</h3>
              </div>
              <p className="text-sm leading-7 text-mist-300">
                不必急着追赶所有机会，先守住自己的节奏。越是关键阶段，越需要清晰的边界感与稳定表达。
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-gold-500/12 bg-white/5 p-6 sm:p-7">
            <h3 className="text-2xl font-semibold text-white">简版解读</h3>
            <p className="mt-4 text-sm leading-8 text-mist-200 sm:text-base">
              从整体气质来看，你属于越沉静越有力量的类型。对外不一定锋芒毕露，但内在有明确标准，擅长在复杂信息中捕捉重点。未来一段时间更适合稳扎稳打地积累，特别是在{profile.preferences?.[0] || "事业"}方向上，耐心会比冲动更有价值。
            </p>
            <p className="mt-4 text-sm leading-8 text-mist-300 sm:text-base">
              命语建议你把注意力放回自己真正想要的生活结构，不必被外界节奏裹挟。真正适合你的机会，往往出现在看似平静、实则蓄力的阶段。
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
              onClick={() => setPaymentOpen(true)}
            >
              查看详细报告
            </button>
            <Link
              to="/measure"
              className="rounded-full border border-gold-400/25 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-mist-100 transition duration-200 hover:border-gold-300/40 hover:bg-white/10 active:scale-[0.98]"
            >
              重新填写
            </Link>
          </div>
        </div>
      </PageSection>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onConfirm={() => navigate("/report", { state: { profile } })}
      />
    </div>
  );
}
