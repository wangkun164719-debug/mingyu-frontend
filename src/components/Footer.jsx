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
            洞悉命运轨迹，倾听宇宙密语。专业命理解读，陪伴你的人生旅程。
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
            {/* <p>微信公众号：命语 MingYu</p> */}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-gold-500/10 px-4 py-6 text-center text-sm text-mist-400 sm:px-6 lg:px-8">
        <p>© 2026 命语 MingYu. All rights reserved.</p>
        <p className="mt-2">本网站仅供娱乐参考，请理性看待命理解读结果</p>
      </div>
    </footer>
  );
}
