import { parseBirthTimeValue } from "../components/BirthPickerField";
import { defaultProfile } from "../data/site";

export const REPORT_ENDPOINTS = {
  preview: "/api/report/preview",
  full: "/api/report/full"
};

const REPORT_PROVIDER = import.meta.env.VITE_REPORT_PROVIDER ?? "hybrid";
const PROFILE_STORAGE_KEY = "mingyu:last-profile";
const REPORT_CACHE_PREFIX = "mingyu:report-cache";
const MIN_YEAR = 1940;

const ZODIAC_ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const FIVE_ELEMENTS = ["木", "火", "土", "金", "水"];
const MONTH_NAMES = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月"
];
const SCORE_BASE = {
  career: 76,
  wealth: 72,
  relationship: 74
};

function hasWindow() {
  return typeof window !== "undefined";
}

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

function readStorage(key) {
  if (!hasWindow()) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  if (!hasWindow()) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures and keep the UI functional.
  }
}

function createDelay(duration = 700) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function parseBirthDate(birthDate) {
  const [year, month, day] = (birthDate || defaultProfile.birthDate).split("-").map(Number);

  return {
    year: clamp(year || 2000, MIN_YEAR, new Date().getFullYear()),
    month: clamp(month || 1, 1, 12),
    day: clamp(day || 1, 1, 31)
  };
}

function parseBirthHour(birthTime) {
  const parsed = parseBirthTimeValue(birthTime);

  if (parsed.unknown) {
    return null;
  }

  const hour = Number(parsed.hour);
  return Number.isFinite(hour) ? hour : null;
}

function normalizeProfile(profile = {}) {
  const merged = {
    ...defaultProfile,
    ...profile,
    preferences:
      Array.isArray(profile.preferences) && profile.preferences.length > 0
        ? profile.preferences
        : defaultProfile.preferences
  };

  return {
    name: merged.name?.trim() || defaultProfile.name,
    gender: merged.gender || defaultProfile.gender,
    birthDate: merged.birthDate || defaultProfile.birthDate,
    birthTime: merged.birthTime || defaultProfile.birthTime,
    birthPlace: merged.birthPlace?.trim() || defaultProfile.birthPlace,
    preferences: merged.preferences
  };
}

function createProfileKey(profile) {
  return JSON.stringify(normalizeProfile(profile));
}

function createCacheKey(type, profile) {
  return `${REPORT_CACHE_PREFIX}:${type}:${createProfileKey(profile)}`;
}

function readCachedReport(type, profile) {
  const raw = readStorage(createCacheKey(type, profile));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCachedReport(type, profile, report) {
  writeStorage(createCacheKey(type, profile), JSON.stringify(report));
}

function scoreFromSeed(base, seed) {
  return clamp(base + (seed % 11) - 5, 62, 93);
}

function buildProfileSignals(profile) {
  const normalized = normalizeProfile(profile);
  const { year, month, day } = parseBirthDate(normalized.birthDate);
  const birthHour = parseBirthHour(normalized.birthTime);
  const monthIndex = month - 1;
  const zodiac = ZODIAC_ANIMALS[(year - 4 + 1200) % 12];
  const element = FIVE_ELEMENTS[(year + month + day) % FIVE_ELEMENTS.length];
  const primaryPreference = normalized.preferences[0] || "事业";
  const secondaryPreference = normalized.preferences[1] || "关系";
  const place = normalized.birthPlace;

  const rhythm =
    birthHour === null
      ? "稳中带柔"
      : birthHour < 5
        ? "内敛敏锐"
        : birthHour < 11
          ? "舒展清醒"
          : birthHour < 17
            ? "明朗果断"
            : "沉静有定力";

  const personalityCore = {
    木: "成长感强，重视长期积累",
    火: "行动力充足，表达直接真诚",
    土: "稳定务实，擅长守住节奏",
    金: "判断清晰，重视边界和原则",
    水: "感知细腻，擅长观察与调和"
  }[element];

  const focusSuggestion = {
    事业: "把主要精力放在可持续成长和关键选择上",
    财富: "优先梳理财务节奏，再谈扩张与冒进",
    财运: "优先梳理财务节奏，再谈扩张与冒进",
    婚姻: "先建立稳定的沟通方式，再推进关系承诺",
    情感: "先建立稳定的沟通方式，再推进关系承诺",
    子女: "用耐心和边界感换取更稳的陪伴质量"
  }[primaryPreference] || "先稳住节奏，再决定下一步方向";

  const monthHint = MONTH_NAMES[monthIndex];
  const timeHint =
    birthHour === null
      ? "由于出生时辰暂未确认，本次报告会以更稳妥的语言给出阶段判断。"
      : `出生在 ${String(birthHour).padStart(2, "0")} 点附近，说明你在重要节点更依赖内在判断，而不是外界催促。`;

  const tone =
    normalized.gender === "女"
      ? "你更容易在细节和情绪变化里捕捉到真正重要的信息。"
      : "你更容易在复杂局面里抓住重点，并逐步形成自己的判断。";

  const seed =
    year + month * 3 + day * 5 + (birthHour ?? 7) * 2 + normalized.preferences.length * 11;

  return {
    ...normalized,
    year,
    month,
    day,
    birthHour,
    zodiac,
    element,
    primaryPreference,
    secondaryPreference,
    rhythm,
    personalityCore,
    focusSuggestion,
    monthHint,
    timeHint,
    tone,
    place,
    seed
  };
}

function buildPreviewReport(profile) {
  const signals = buildProfileSignals(profile);

  return {
    source: "mock-ai",
    title: `${signals.name || "命主"}的简版解读`,
    summary:
      `结合出生日期、出生地与关注主题来看，你当前的人生主轴更偏向“${signals.primaryPreference} + 稳定推进”。` +
      `你身上最明显的底色是 ${signals.rhythm}，这会让你在面对变化时更愿意先观察、再表态。`,
    cards: [
      {
        title: "命理概览",
        icon: "star",
        description: `五行倾向偏 ${signals.element}，整体气质呈现出“${signals.rhythm}”的感觉。${signals.personalityCore}。`
      },
      {
        title: "偏好主题",
        icon: "briefcase",
        description: `你当前最适合优先关注的是 ${signals.primaryPreference}，其次是 ${signals.secondaryPreference}。${signals.focusSuggestion}。`
      },
      {
        title: "近期提醒",
        icon: "heart",
        description: `${signals.monthHint}对你来说更适合梳理、定方向与留余地，不必急着把所有问题一次解决。`
      }
    ],
    interpretations: [
      `${signals.tone}${signals.timeHint}`,
      "你并不适合被外部节奏强行推着走，越是在关键阶段，越需要保留自己的判断窗口。",
      `如果最近正在处理和 ${signals.primaryPreference} 相关的问题，建议先把“当前最重要的一件事”明确下来，再分配精力。`
    ],
    advice:
      `命语建议你把注意力放回真正可持续的结构里：先稳住作息与节奏，再逐步推进 ${signals.primaryPreference}。` +
      "当你不再被短期波动带着跑，很多判断会自然清晰。"
  };
}

function createSection({ title, icon, description, score, highlights = [], cautions = [], actions = [] }) {
  return {
    title,
    icon,
    description,
    score,
    highlights,
    cautions,
    actions
  };
}

function buildFullReport(profile) {
  const signals = buildProfileSignals(profile);
  const careerScore = scoreFromSeed(SCORE_BASE.career, signals.seed);
  const wealthScore = scoreFromSeed(SCORE_BASE.wealth, signals.seed + 7);
  const relationshipScore = scoreFromSeed(SCORE_BASE.relationship, signals.seed + 13);
  const themeLabel = signals.primaryPreference === "财运" ? "财富" : signals.primaryPreference;

  return {
    source: "mock-ai",
    title: `${signals.name || "命主"}的详细解析`,
    summary:
      `这是一份围绕 ${signals.birthDate}、${signals.birthPlace} 与关注主题生成的结构化报告。` +
      `整体来看，你的人生节奏更强调“先判断，再行动”，适合通过稳定积累换来阶段性突破。`,
    overviewCards: [
      { label: "五行属性", value: signals.element },
      { label: "生肖", value: signals.zodiac },
      { label: "当前主轴", value: themeLabel }
    ],
    keySignals: [
      {
        label: "命盘基调",
        value: signals.rhythm,
        detail: "你的优势不在爆发式推进，而在看清局势后持续用力，这让你更适合做长期盘面。"
      },
      {
        label: "关键课题",
        value: signals.primaryPreference,
        detail: `当前更值得投入的不是同时解决所有问题，而是优先围绕 ${signals.primaryPreference} 建立确定性。`
      },
      {
        label: "阶段策略",
        value: "先稳后进",
        detail: `${signals.monthHint}更适合梳理节奏、收拢资源、校准方向，而不是被外部变化推着跑。`
      }
    ],
    strategicFocus: {
      title: "现阶段判断",
      summary:
        "如果只保留一句话来概括这份报告，那就是：你需要先把力量收回来，围绕最重要的一件事建立稳定投入，再等待结果自然放大。对你来说，聚焦比同时推进更重要，节奏感比情绪化冲刺更重要。",
      priorities: [
        `优先把 ${signals.primaryPreference} 相关任务排到日程前列，减少低价值分心。`,
        "给重大决定预留观察窗口，避免在外部压力最大的时候立刻拍板。",
        "把长期收益放在短期刺激前面，尤其在资源分配和承诺选择上更要如此。"
      ],
      cautions: [
        "不要因为短期没有立刻见效，就怀疑自己前面的积累是否有意义。",
        "不要在关系、工作、金钱三条线同时求快，这会削弱你的判断质量。",
        "遇到不确定局面时，先缩短反馈周期，再扩大投入，而不是反过来。"
      ]
    },
    sections: {
      overall: createSection({
        title: "整体总评",
        icon: "star",
        description:
          `从整体命理底色来看，你的人生主轴并不在“快速爆发”，而在“稳步累积”。${signals.personalityCore}。` +
          "越是在安静、不被打扰的阶段，你越容易看清真正适合自己的方向。",
        highlights: [
          `核心关键词是“${signals.rhythm}”与“长期感”。`,
          "你更擅长做后劲型选手，而不是一开始就把能量全部打光。",
          "当外部信息过载时，回到自己的节奏反而更容易做出正确判断。"
        ],
        cautions: [
          "不要拿自己的长期节奏去和别人短期冲刺做对比。",
          "不要因为局势暂时不明，就被迫频繁改变方向。"
        ],
        actions: [
          "把近期目标压缩到一个主目标和一个辅助目标。",
          "为关键事项设置固定复盘点，而不是靠情绪判断进度。"
        ]
      }),
      personality: createSection({
        title: "性格特质",
        icon: "user",
        description:
          `${signals.tone}同时，你也很重视边界、秩序和长期感。` +
          "在合作与关系里，你更适合建立慢热但可信的连接，而不是高强度地消耗自己。",
        highlights: [
          `你天生带有 ${signals.element} 的气质，判断偏细腻，做事讲究内在一致。`,
          "别人容易在你身上感受到可靠、稳住局面的能力。",
          "你不是没情绪，而是习惯先消化，再表达。"
        ],
        cautions: [
          "过度内耗会让你错把谨慎当成拖延。",
          "如果总是先照顾外部期待，反而会让真实需求长期被压住。"
        ],
        actions: [
          "重要合作前先明确边界、角色和交付预期。",
          "把“我真正想要什么”写下来，再决定是否配合外部节奏。"
        ]
      }),
      career: createSection({
        title: "事业运势",
        icon: "briefcase",
        description:
          "事业层面更适合先做深、再做大。如果你正在寻找新的机会，优先考虑那些能积累专业优势、沉淀话语权和形成复利的位置。你未必总是第一个冲出去的人，但常常是能把结果做稳的人。",
        score: `事业指数：${careerScore}%`,
        highlights: [
          "你更适合确定性成长，而不是被短期风口反复牵引。",
          "专业壁垒、持续输出、稳定交付，都会成为你的加分项。",
          `如果当前主轴就是 ${signals.primaryPreference}，事业线会成为你接下来最值得经营的抓手之一。`
        ],
        cautions: [
          "避免在方向尚未判断清楚之前就投入过多试错成本。",
          "不要让“想一次性做到最好”拖慢真实推进速度。"
        ],
        actions: [
          "筛掉低确定性的机会，只保留最能形成积累的那一类。",
          "把接下来 30 天的职业目标拆成可以被验证的三个节点。"
        ]
      }),
      wealth: createSection({
        title: "财富节奏",
        icon: "sun",
        description:
          "财务主题更适合稳中求进，尤其要区分短期刺激和长期收益。先把现金流、支出边界和关键投入梳理清楚，再决定是否扩大风险敞口，会更符合你的整体节奏。",
        score: `财富指数：${wealthScore}%`,
        highlights: [
          "你对金钱的敏感点不只是赚多少，更在于节奏是否可持续。",
          "一旦建立稳定结构，你的资源积累往往比看起来更扎实。",
          "适合先做收口，再谈放大。"
        ],
        cautions: [
          "不要因为外界赚钱故事太多，就打乱原本的资金秩序。",
          "避免把情绪性消费和战略性投入混在一起。"
        ],
        actions: [
          "先列清楚固定支出、弹性支出、成长投入三类预算。",
          "对高风险决定增加一天冷静期，再确认是否值得进入。"
        ]
      }),
      relationship: createSection({
        title: "关系与情感",
        icon: "heart",
        description:
          "在关系里，你更看重安全感、真诚和节奏匹配。无论是亲密关系还是家庭互动，最重要的都不是立刻得到结果，而是建立稳定、可持续的沟通方式。",
        score: `情感指数：${relationshipScore}%`,
        highlights: [
          "你不太适合高波动、高拉扯的关系模式。",
          "真正能让你安心的人，通常会尊重你的节奏与边界。",
          "当你不再压抑真实感受，关系质量反而更容易提升。"
        ],
        cautions: [
          "不要为了维持表面平和，长期不表达自己的真实需求。",
          "关系里的过度揣测会消耗你原本很强的感知力。"
        ],
        actions: [
          "先谈事实、再谈感受、最后谈期待，避免情绪上头时直接下结论。",
          "把你最在意的关系底线说清楚，不要默认对方会自动理解。"
        ]
      }),
      advice: createSection({
        title: "行动建议",
        icon: "moon",
        description:
          `未来一段时间，建议你把重心放在三个动作上：第一，明确当前阶段最重要的一件事；第二，为 ${signals.primaryPreference} 保留稳定投入；第三，在重大决定前给自己留下观察窗口。`,
        highlights: [
          "你真正的优势从来不是冲动一击，而是看清之后持续推进。",
          `当你把精力重新收拢，${signals.primaryPreference} 这条线往往会先于其他主题出现改善。`
        ],
        cautions: [
          "不要同时开太多战线，信息越多越要回到主目标。",
          "不要把焦虑误当成行动力，真正有效的是有节奏地推进。"
        ],
        actions: [
          "写下你接下来最重要的一件事，并配一条可执行标准。",
          "把未来两周的注意力预算优先分配给最关键的结果。"
        ]
      })
    },
    actionPlan: [
      {
        title: "先收拢重点",
        horizon: "未来 7 天",
        icon: "target",
        detail: `把所有正在推进的事项做一次筛选，只保留最值得投入的 1 到 2 项，优先围绕 ${signals.primaryPreference} 配置时间和精力。`
      },
      {
        title: "建立稳定节奏",
        horizon: "未来 30 天",
        icon: "calendar",
        detail: "给关键事项设计固定推进频率，例如每周一次复盘、每三天一次跟进，让结果靠结构推进，而不是靠临时状态推进。"
      },
      {
        title: "等待结构放大",
        horizon: "未来 90 天",
        icon: "clock",
        detail: "当方向、投入和反馈逐渐稳定后，再考虑放大资源或做更大的决定，不要在根基未稳时抢跑。"
      }
    ],
    final_message:
      "命语想送给你的一句话是：命理不是替你决定人生，而是帮助你看见自己真正擅长的节奏。当你愿意按自己的节拍前进，很多看似纠结的问题，都会慢慢变得清楚。"
  };
}

async function requestRemoteReport(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("报告服务暂时不可用，请稍后重试。");
  }

  return response.json();
}

async function requestMockReport(type, payload) {
  await createDelay(type === "preview" ? 800 : 1200);
  return type === "preview" ? buildPreviewReport(payload.profile) : buildFullReport(payload.profile);
}

async function requestReport(type, profile, options = {}) {
  const normalizedProfile = normalizeProfile(profile);
  const { force = false } = options;
  const cached = !force ? readCachedReport(type, normalizedProfile) : null;

  saveLatestProfile(normalizedProfile);

  if (cached) {
    return cached;
  }

  const endpoint = REPORT_ENDPOINTS[type];
  const payload = { profile: normalizedProfile };
  let report;

  if (REPORT_PROVIDER === "mock") {
    report = await requestMockReport(type, payload);
  } else if (REPORT_PROVIDER === "remote") {
    report = await requestRemoteReport(endpoint, payload);
  } else {
    try {
      report = await requestRemoteReport(endpoint, payload);
    } catch {
      report = await requestMockReport(type, payload);
    }
  }

  writeCachedReport(type, normalizedProfile, report);
  return report;
}

export function saveLatestProfile(profile) {
  writeStorage(PROFILE_STORAGE_KEY, JSON.stringify(normalizeProfile(profile)));
}

export function loadLatestProfile() {
  const raw = readStorage(PROFILE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function peekPreviewReport(profile) {
  return readCachedReport("preview", profile);
}

export function peekFullReport(profile) {
  return readCachedReport("full", profile);
}

export function clearReportCache(profile) {
  if (!hasWindow()) {
    return;
  }

  ["preview", "full"].forEach((type) => {
    try {
      window.sessionStorage.removeItem(createCacheKey(type, profile));
    } catch {
      // Ignore storage removal failures.
    }
  });
}

export async function fetchPreviewReport(profile, options) {
  return requestReport("preview", profile, options);
}

export async function fetchFullReport(profile, options) {
  return requestReport("full", profile, options);
}
