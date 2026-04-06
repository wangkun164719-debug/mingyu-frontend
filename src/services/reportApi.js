import { UNKNOWN_TIME } from "../components/BirthPickerField";
import { defaultProfile } from "../data/site";

export const REPORT_ENDPOINTS = {
  preview: "/api/report/preview",
  full: "/api/report/full"
};

const REPORT_PROVIDER = import.meta.env.VITE_REPORT_PROVIDER ?? "hybrid";
const PROFILE_STORAGE_KEY = "mingyu:last-profile";
const REPORT_CACHE_PREFIX = "mingyu:report-cache";
const MIN_YEAR = 1940;

// 第二版先把报告生成流程抽象成统一请求层：
// - 开发阶段默认走 mock 异步返回，便于前端独立联调
// - 当后端接入真实 MiniMax 时，只需要把 VITE_REPORT_PROVIDER 切到 remote，
//   再让 /api/report/preview 与 /api/report/full 转发到服务端即可

const ZODIAC_ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const FIVE_ELEMENTS = ["木", "火", "土", "金", "水"];
const MONTH_NAMES = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
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
  if (!birthTime || birthTime === UNKNOWN_TIME) {
    return null;
  }

  const [hour] = birthTime.split(":").map(Number);
  return Number.isFinite(hour) ? hour : null;
}

function normalizeProfile(profile = {}) {
  const merged = {
    ...defaultProfile,
    ...profile,
    preferences: Array.isArray(profile.preferences) && profile.preferences.length > 0
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
  const normalized = normalizeProfile(profile);
  return JSON.stringify(normalized);
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
      : `出生在${String(birthHour).padStart(2, "0")}点附近，说明你在重要节点更依赖内在判断而非外界催促。`;

  const tone =
    normalized.gender === "女"
      ? "你更容易在细节和情绪变化里捕捉到真正重要的信息。"
      : "你更容易在复杂局面里抓住重点，并逐步形成自己的判断。";

  const seed = year + month * 3 + day * 5 + (birthHour ?? 7) * 2 + normalized.preferences.length * 11;

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
      `你身上最明显的底色是 ${signals.rhythm}，这会让你在面对变化时，更愿意先观察、再表态。`,
    cards: [
      {
        title: "命理概览",
        icon: "star",
        description: `五行倾向偏${signals.element}，整体气质呈现出“${signals.rhythm}”的感觉。${signals.personalityCore}。`
      },
      {
        title: "偏好主题",
        icon: "briefcase",
        description: `你当前最适合优先关注的是${signals.primaryPreference}，其次是${signals.secondaryPreference}。${signals.focusSuggestion}。`
      },
      {
        title: "近期提醒",
        icon: "heart",
        description: `${signals.monthHint}对你来说更适合做梳理、定方向与留余地，不必急着把所有问题一次解决。`
      }
    ],
    interpretations: [
      `${signals.tone}${signals.timeHint}`,
      `你并不适合被外部节奏强行推着走，越是在关键阶段，越需要保留自己的判断窗口。`,
      `如果最近正在处理${signals.primaryPreference}相关问题，建议先把“当前最重要的一件事”明确下来，再分配精力。`
    ],
    advice:
      `命语建议你把注意力放回真正可持续的结构里：先稳住作息与节奏，再逐步推进${signals.primaryPreference}。` +
      `当你不再被短期波动带着跑，很多判断会自然清晰。`
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
    title: `${signals.name || "命主"}的命理解读`,
    summary:
      `这是一份围绕 ${signals.birthDate}、${signals.birthPlace} 与关注主题生成的结构化报告。` +
      `整体来看，你的人生节奏更强调“先判断，再行动”，适合通过稳定积累换来阶段突破。`,
    overviewCards: [
      { label: "五行属性", value: signals.element },
      { label: "生肖", value: signals.zodiac },
      { label: "当前主轴", value: themeLabel }
    ],
    sections: {
      overall: {
        title: "整体总评",
        icon: "star",
        description:
          `从整体命理底色来看，你的主轴并不在“快速爆发”，而在“稳步累积”。${signals.personalityCore}。` +
          `这类人往往在越安静、越不被打扰的阶段，越能看见真正适合自己的方向。`
      },
      personality: {
        title: "性格特质",
        icon: "user",
        description:
          `${signals.tone}与此同时，你也很重视边界、秩序和长期感。` +
          `在社交与合作里，你更适合建立慢热但可信的关系，而不是被动卷入高强度消耗。`
      },
      career: {
        title: "事业运势",
        icon: "briefcase",
        description:
          `事业层面更适合“先做深，再做大”。如果你正在寻找新的机会，优先考虑那些能持续积累专业优势和话语权的位置。` +
          `你不一定是最先冲出去的人，但往往是能把局面收住、把结果做稳的人。`,
        score: `事业指数：${careerScore}%`
      },
      wealth: {
        title: "财富节奏",
        icon: "sun",
        description:
          `财务主题更适合稳中求进，尤其要区分“短期刺激”和“长期收益”。` +
          `先把日常现金流、支出边界和关键投入梳理清楚，再决定是否扩大风险敞口，会更符合你的整体命盘节奏。`,
        score: `财富指数：${wealthScore}%`
      },
      relationship: {
        title: "关系与情感",
        icon: "heart",
        description:
          `在关系里，你更看重安全感、真诚和节奏匹配。无论是亲密关系还是家庭互动，最重要的不是立刻得到结果，而是建立稳定、可持续的沟通方式。` +
          `当你不再压抑真实感受，关系质量反而更容易提升。`,
        score: `情感指数：${relationshipScore}%`
      },
      advice: {
        title: "行动建议",
        icon: "moon",
        description:
          `未来一段时间，建议你把重心放在三个动作上：第一，明确当前阶段最重要的一件事；第二，为${signals.primaryPreference}保留稳定投入；第三，在重大决定前给自己留出观察窗口。` +
          `你的优势从来不是冲动一击，而是看清之后的持续推进。`
      }
    },
    final_message:
      `命语想送给你的一句话是：命理不是替你决定人生，而是帮助你看见自己真正擅长的节奏。` +
      `当你愿意按自己的节拍前进，很多看似纠结的问题，都会慢慢变得清楚。`
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
