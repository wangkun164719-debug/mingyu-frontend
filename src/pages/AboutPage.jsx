import { Link } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";
import PageIntro from "../components/PageIntro";
import PageSection from "../components/PageSection";
import { SparkIcon } from "../components/Icons";
import { aboutValues, promises } from "../data/site";

export default function AboutPage() {
  return (
    <div className="pb-6">
      <PageIntro title="关于命语" subtitle="传承东方智慧，解读生命密码" />

      <PageSection className="pt-12">
        <div className="panel px-6 py-8 sm:px-8 lg:px-10">
          <h3 className="text-2xl font-semibold text-white">品牌故事</h3>
          <div className="mt-5 space-y-5 text-sm leading-8 text-mist-300 sm:text-base">
            <p>
              命语，取“倾听命运的话语”之意，是一个专注于东方命理文化传播与现代化解读的品牌。我们相信，古老的命理智慧与当代心理学、社会学结合，能为现代人提供更有价值的人生参考。
            </p>
            <p>
              在快节奏的现代生活中，人们常常迷失方向，感到困惑。命语希望成为一座桥梁，用专业而温暖的方式，帮助每个人更好地认识自己，理解生命的规律，从而做出更明智的选择。
            </p>
            <p>
              我们的团队由资深命理师、心理咨询师和设计师组成，致力于将传统命理以优雅、现代的方式呈现，让更多年轻人了解和欣赏这份宝贵的文化遗产。
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection className="pt-20">
        <h3 className="text-center font-display text-3xl font-semibold text-white sm:text-4xl">我们的价值观</h3>
        <div className="gold-line mt-5" />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {aboutValues.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </PageSection>

      <PageSection className="py-20">
        <div className="panel px-6 py-8 sm:px-8 lg:px-10">
          <h3 className="text-center font-display text-3xl font-semibold text-gold-300">我们的承诺</h3>
          <div className="gold-line mt-5" />
          <ul className="mt-8 space-y-4 text-sm leading-8 text-mist-200 sm:text-base">
            {promises.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-gold-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-14 text-center">
          <p className="text-sm text-mist-300">想要了解更多关于您的命运密码？</p>
          <Link
            to="/measure"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
          >
            开始测算
            <SparkIcon className="h-4 w-4" />
          </Link>
        </div>
      </PageSection>
    </div>
  );
}
