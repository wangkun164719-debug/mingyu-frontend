import { useEffect } from "react";
import { SparkIcon } from "./Icons";

export default function PaymentModal({ open, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/70 px-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="panel relative z-10 w-full max-w-md animate-modal p-6 sm:p-7">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/10 text-gold-300">
          <SparkIcon className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-center font-display text-2xl font-semibold text-white">
          解锁完整命运之书
        </h3>
        <p className="mt-3 text-center text-sm leading-7 text-mist-300">
          限时开放免费体验资格。点击确认后将直接进入详细报告页，不会产生真实扣费。
        </p>

        <div className="mt-6 rounded-3xl border border-gold-500/15 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-5 text-sm text-mist-300">
            <span>完整报告</span>
            <span className="text-right">命理深度解读 / 阶段建议 / 主题分析</span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold-300/80">限时权益</p>
              <div className="mt-2 flex items-end gap-3">
                <p className="text-lg text-mist-400 line-through">¥29.9</p>
                <p className="text-3xl font-semibold text-gold-300">免费体验</p>
              </div>
            </div>
            <p className="text-right text-xs leading-6 text-mist-400">
              当前为限时活动，
              <br />
              不会产生真实扣费
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-full border border-gold-400/25 bg-white/5 px-5 py-3 text-sm font-semibold text-mist-200 transition duration-200 hover:border-gold-300/40 hover:bg-white/10 active:scale-[0.98]"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded-full border border-gold-300/40 bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(198,157,45,0.24)] active:scale-[0.98]"
            onClick={onConfirm}
          >
            立即免费体验
          </button>
        </div>
      </div>
    </div>
  );
}
