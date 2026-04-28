import { Link } from "react-router-dom";
import FAQAccordion from "../components/FAQAccordion";
import PageIntro from "../components/PageIntro";
import PageSection from "../components/PageSection";
import { SparkIcon } from "../components/Icons";
import { faqs } from "../data/site";
import { trackEvent, usePageView } from "../services/analytics";

export default function FAQPage() {
  usePageView("faq");

  return (
    <div className="pb-6">
      <PageIntro title="常见问题" subtitle="关于命理解读，您可能想知道的一切" />

      <PageSection className="pt-12">
        <div className="mx-auto max-w-3xl">
          <FAQAccordion
            items={faqs}
            onExpand={(_item, index) => trackEvent("faq_expand_item", { faq_index: index + 1 })}
          />
        </div>
      </PageSection>

      <PageSection className="pt-16">
        <div className="panel mx-auto max-w-3xl px-6 py-8 text-center sm:px-8">
          <h3 className="text-3xl font-semibold text-gold-300">还有其他问题？</h3>
          <p className="mt-4 text-sm leading-7 text-mist-300">
            如果您有其他疑问，欢迎随时联系我们的客服团队。
          </p>
          <div className="mt-6 flex flex-col gap-3 text-sm text-mist-200 sm:flex-row sm:justify-center sm:gap-6">
            <span>客服时间：每日 9:00 - 21:00</span>
            <span>邮箱：mingyuwk164@163.com</span>
          </div>
        </div>
      </PageSection>

      <PageSection className="py-16 text-center">
        <p className="text-sm text-mist-300">准备好开始您的命理之旅了吗？</p>
        <Link
          to="/measure"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
          onClick={() => trackEvent("click_faq_start_measure", { cta_area: "faq_bottom" })}
        >
          立即测算
          <SparkIcon className="h-4 w-4" />
        </Link>
      </PageSection>
    </div>
  );
}
