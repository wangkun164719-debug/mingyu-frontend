import { Link } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";
import FAQAccordion from "../components/FAQAccordion";
import HeroSky from "../components/HeroSky";
import PageSection from "../components/PageSection";
import SectionTitle from "../components/SectionTitle";
import { SparkIcon } from "../components/Icons";
import {
  brandCards,
  faqs,
  serviceCards,
  steps,
  testimonials
} from "../data/site";

export default function HomePage() {
  return (
    <div className="pb-4">
      <section className="relative overflow-hidden border-b border-gold-500/10">
        <HeroSky />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_48%)]" />
        <PageSection className="relative z-10 flex min-h-[78vh] flex-col items-center justify-center pt-16 text-center sm:min-h-[82vh] lg:min-h-[90vh]">
          <div className="mb-5 flex justify-center rounded-full border border-gold-400/12 bg-gold-400/5 p-4 shadow-[0_0_40px_rgba(230,195,90,0.08)]">
            <SparkIcon className="h-14 w-14 text-gold-400 sm:h-16 sm:w-16" />
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-[0.12em] text-white sm:text-5xl lg:text-7xl">
            聆听命运的低语
          </h1>
          <p className="mt-5 text-lg text-gold-300 sm:text-xl">读懂人生的轨迹</p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-mist-200 sm:text-base">
            基于出生信息与东方命理意象，带你从性格、情感、事业与运势中找回方向。
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/measure"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
            >
              开始测算
              <SparkIcon className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded-full border border-gold-400/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-mist-100 transition duration-200 hover:-translate-y-0.5 hover:border-gold-300/40 hover:bg-white/10 active:scale-[0.98]"
            >
              了解命语
            </Link>
          </div>
          <div className="mt-16 h-16 w-px bg-gradient-to-b from-gold-400/70 to-transparent" />
        </PageSection>
      </section>

      <PageSection className="pt-16 sm:pt-20">
        <SectionTitle icon={false} title="专属命理解读服务" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {serviceCards.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </PageSection>

      <PageSection className="pt-20">
        <SectionTitle icon={false} title="命语品牌特色" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {brandCards.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </PageSection>

      <PageSection className="pt-20">
        <div className="panel story-grid overflow-hidden px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
          <SectionTitle icon={false} title="三步获得命理解读" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-400 text-sm font-semibold text-ink-950">
                      {step.index}
                    </div>
                    {index !== steps.length - 1 ? (
                      <div className="mt-3 h-full min-h-12 w-px bg-gradient-to-b from-gold-400/70 to-transparent" />
                    ) : null}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-mist-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative min-h-[320px] overflow-hidden rounded-[30px] border border-gold-500/12 bg-[radial-gradient(circle_at_50%_36%,rgba(83,109,165,0.22),rgba(12,23,48,0.94)_58%,rgba(11,18,34,0.98)_100%)] p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%)]" />
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(229,235,255,0.2),rgba(111,134,182,0.08)_48%,transparent_72%)] blur-xl" />
              <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.18),rgba(124,146,188,0.08)_48%,rgba(14,22,38,0.16)_100%)] shadow-[0_20px_60px_rgba(4,10,24,0.45)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.4em] text-gold-300/80">MingYu Flow</p>
                  <h3 className="font-display text-3xl text-white">在安静里，看见自己的节律</h3>
                </div>
                <div className="max-w-sm rounded-[24px] border border-gold-500/12 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm leading-7 text-mist-200">
                    不是急于给出答案，而是先让人生的脉络慢慢浮现。命语希望这份阅读像一盏灯，照见你此刻真正关心的方向。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection className="pt-20">
        <SectionTitle icon={false} title="用户心声" />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.author} className="panel bg-[linear-gradient(145deg,rgba(35,26,58,0.72),rgba(18,29,56,0.9))] p-6 text-center">
              <div className="mb-4 flex justify-center text-gold-300">
                <SparkIcon className="h-5 w-5" />
              </div>
              <p className="text-sm leading-7 text-mist-200">“{item.quote}”</p>
              <p className="mt-4 text-sm font-semibold text-gold-300">- {item.author}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection className="pt-20">
        <SectionTitle icon={false} title="常见问题" />
        <div className="mx-auto mt-10 max-w-3xl">
          <FAQAccordion items={faqs.slice(0, 2)} />
        </div>
      </PageSection>

      <PageSection className="pt-20">
        <div className="panel mx-auto max-w-2xl px-6 py-10 text-center sm:px-8">
          <div className="mb-4 flex justify-center text-gold-300">
            <SparkIcon className="h-7 w-7" />
          </div>
          <h3 className="font-display text-3xl font-semibold text-white">命运如月，盈亏有时</h3>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-mist-300">
            如同月相的流转起伏，人生也有其内在节律。了解它的轮廓不是为了逃避现实，而是让每一个阶段都能被温柔地看见。
          </p>
        </div>
      </PageSection>

      <PageSection className="py-20">
        <div className="panel mx-auto max-w-3xl bg-[linear-gradient(145deg,rgba(47,33,79,0.78),rgba(18,29,56,0.9))] px-6 py-10 text-center sm:px-8 lg:px-10">
          <h3 className="font-display text-3xl font-semibold text-white sm:text-4xl">探索你的命运之书</h3>
          <p className="mt-4 text-sm leading-7 text-mist-300">
            只需几分钟，即可获得关于你的节律与方向。
          </p>
          <Link
            to="/measure"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
          >
            立即开始
            <SparkIcon className="h-4 w-4" />
          </Link>
        </div>
      </PageSection>
    </div>
  );
}
