import { useEffect, useMemo, useState } from "react";
import { SparkIcon } from "./Icons";

const TIPS = [
  "有些答案，不是预言，而是提醒。",
  "真正的测算，是帮你看清选择。",
  "命运不是固定剧本，而是趋势与行动的交汇。",
  "你关注的问题，往往也藏着你的期待。",
  "好的建议，不替你决定，只帮你看得更清楚。"
];

const PREFERENCE_META = {
  career: { label: "事业", direction: "事业发展方向" },
  事业: { label: "事业", direction: "事业发展方向" },
  wealth: { label: "财运", direction: "财运与资源节奏" },
  财运: { label: "财运", direction: "财运与资源节奏" },
  财富: { label: "财运", direction: "财运与资源节奏" },
  relationship: { label: "婚姻", direction: "婚姻与关系状态" },
  婚姻: { label: "婚姻", direction: "婚姻与关系状态" },
  情感: { label: "婚姻", direction: "婚姻与关系状态" },
  children: { label: "子女", direction: "子女与家庭陪伴方向" },
  子女: { label: "子女", direction: "子女与家庭陪伴方向" }
};

const ELEMENTS = ["木", "火", "土", "金", "水"];

export function getGeneratingPreference(preference) {
  if (["career", "事业"].includes(preference)) {
    return "career";
  }

  if (["wealth", "财运", "财富"].includes(preference)) {
    return "wealth";
  }

  if (["relationship", "婚姻", "情感"].includes(preference)) {
    return "relationship";
  }

  if (["children", "子女"].includes(preference)) {
    return "children";
  }

  return undefined;
}

function getPreferenceMeta(preference) {
  return PREFERENCE_META[preference] ?? PREFERENCE_META.career;
}

function buildStages(mode, preferenceMeta) {
  if (mode === "detail") {
    return [
      {
        title: "正在扩展基础解读",
        subtitle: "正在沿用简版结果，补充更完整的命理脉络。"
      },
      {
        title: "正在补充重点方向分析",
        subtitle: `正在重点分析你的${preferenceMeta.direction}。`
      },
      {
        title: "正在生成行动建议",
        subtitle: "正在把判断整理成更可执行的阶段建议。"
      },
      {
        title: "正在整理完整报告",
        subtitle: "正在校对结构、语气与阅读顺序。"
      },
      {
        title: "深度报告已生成",
        subtitle: "即将为你展开完整解读。"
      }
    ];
  }

  return [
    {
      title: "正在接收你的出生信息",
      subtitle: "命语正在校验出生时间、性别与测算方向。"
    },
    {
      title: "正在生成基础命盘",
      subtitle: "正在分析五行分布、性格底色与人生倾向。"
    },
    {
      title: "正在匹配你的关注方向",
      subtitle: `正在重点分析你的${preferenceMeta.direction}。`
    },
    {
      title: "正在组织专属报告语言",
      subtitle: "正在将复杂结果整理成更容易理解的建议。"
    },
    {
      title: "报告已生成，即将为你展开",
      subtitle: "本次解读仅供参考，愿你更了解自己。"
    }
  ];
}

function AstroDisk() {
  return (
    <div className="generating-disk" aria-hidden="true">
      <div className="generating-ring generating-ring-outer" />
      <div className="generating-ring generating-ring-middle" />
      <div className="generating-ring generating-ring-inner" />
      <div className="generating-cross generating-cross-a" />
      <div className="generating-cross generating-cross-b" />
      <div className="generating-center">
        <SparkIcon className="h-7 w-7" />
      </div>
      {ELEMENTS.map((element, index) => {
        const angle = index * 72 - 90;
        const radius = 47;
        const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
        const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

        return (
          <span
            key={element}
            className="generating-element"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${index * 0.45}s`
            }}
          >
            {element}
          </span>
        );
      })}
    </div>
  );
}

export default function GeneratingReportScreen({
  mode = "basic",
  preference = "career",
  status = "generating",
  onRetry
}) {
  const preferenceMeta = useMemo(() => getPreferenceMeta(preference), [preference]);
  const stages = useMemo(() => buildStages(mode, preferenceMeta), [mode, preferenceMeta]);
  const [stageIndex, setStageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(status === "success" ? 100 : 12);
  const [showLongWait, setShowLongWait] = useState(false);

  useEffect(() => {
    if (status === "success") {
      setStageIndex(stages.length - 1);
      setProgress(100);
      return undefined;
    }

    if (status !== "generating") {
      return undefined;
    }

    setProgress((current) => (current >= 90 ? current : Math.max(current, 12)));
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(90, current + (current < 52 ? 6 : 3)));
    }, 900);

    return () => window.clearInterval(timer);
  }, [stages.length, status]);

  useEffect(() => {
    if (status !== "generating") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setStageIndex((current) => Math.min(stages.length - 2, current + 1));
    }, 3600);

    return () => window.clearInterval(timer);
  }, [stages.length, status]);

  useEffect(() => {
    if (status !== "generating") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % TIPS.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "generating") {
      setShowLongWait(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowLongWait(true);
    }, 20000);

    return () => window.clearTimeout(timer);
  }, [status]);

  if (status === "error") {
    return (
      <div className="panel mx-auto max-w-4xl p-6 text-center sm:p-8 lg:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/20 bg-gold-400/10 text-gold-300">
          <span className="text-2xl">!</span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-white">生成遇到一点问题</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-mist-300 sm:text-base">
          可能是网络波动导致，请稍后重试。
        </p>
        {onRetry ? (
          <button
            type="button"
            className="mt-6 w-full rounded-full border border-gold-300/40 bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98] sm:w-auto"
            onClick={onRetry}
          >
            重新生成
          </button>
        ) : null}
      </div>
    );
  }

  const stage = stages[stageIndex];

  return (
    <div className="generating-shell panel mx-auto max-w-4xl overflow-hidden p-6 sm:p-8 lg:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex justify-center">
          <AstroDisk />
        </div>

        <div className="min-w-0 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-200">
            <SparkIcon className="h-4 w-4" />
            {mode === "detail" ? "深度报告推演中" : "基础报告推演中"}
          </div>

          <div key={`${status}-${stageIndex}`} className="animate-rise">
            <h3 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">{stage.title}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-mist-300 sm:text-base lg:mx-0">
              {stage.subtitle}
            </p>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between text-xs text-mist-400">
              <span>命盘推演</span>
              <span>最高停留于 90%，完成后自动展开</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-200">命语小签</p>
            <p key={tipIndex} className="mt-3 text-sm leading-7 text-mist-100 animate-rise">
              {TIPS[tipIndex]}
            </p>
          </div>

          {showLongWait ? (
            <p className="mt-5 rounded-2xl border border-gold-400/16 bg-gold-400/8 px-4 py-3 text-sm leading-6 text-gold-100">
              分析仍在进行，请保持页面打开。
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
