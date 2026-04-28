import { Link } from "react-router-dom";
import { BrandMark, MoonIcon, SparkIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-gold-500/10 bg-ink-950/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <BrandMark className="h-5 w-5 text-gold-400" />
            <span className="font-display text-2xl tracking-[0.2em]">命语</span>
          </div>
          <p className="max-w-xs text-sm leading-7 text-mist-300">
            以东方命理为灵感，提供温和、克制、细腻的命理解读体验，陪你看见当下阶段真正关心的方向。
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gold-300">
            <SparkIcon className="h-4 w-4" />
            快速导航
          </div>
          <div className="space-y-2 text-sm text-mist-300">
            <Link className="block transition hover:text-gold-300" to="/">
              首页
            </Link>
            <Link className="block transition hover:text-gold-300" to="/about">
              关于命语
            </Link>
            <Link className="block transition hover:text-gold-300" to="/faq">
              常见问题
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gold-300">
            <MoonIcon className="h-4 w-4" />
            联系我们
          </div>
          <div className="space-y-2 text-sm leading-7 text-mist-300">
            <p>客服时间：每日 9:00 - 21:00</p>
            <p>邮箱：wk164719@163.com</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-gold-500/10 px-4 py-6 text-center text-sm text-mist-400 sm:px-6 lg:px-8">
        <p>© 2026 命语 MingYu. All rights reserved.</p>
        <p className="mt-2">本站内容仅供文化娱乐与自我观察参考，请理性看待命理解读结果。</p>
        <a
          className="mt-3 inline-block transition hover:text-gold-300"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noreferrer"
        >
          豫ICP备2026016497号-1
        </a>
      </div>
    </footer>
  );
}
