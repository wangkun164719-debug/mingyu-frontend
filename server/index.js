import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getAnalyticsDailySummary,
  recordAnalyticsPageView,
  resolveAnalyticsDateKey,
  TRACKED_PAGES
} from "./analyticsStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// 只从服务端目录读取密钥配置，避免和前端 Vite 环境变量混在一起。
dotenv.config({ path: path.join(__dirname, ".env") });

const distDir = path.join(projectRoot, "dist");
const app = express();

const PORT = Number(process.env.PORT || 8787);
const REPORT_PROVIDER = process.env.REPORT_PROVIDER || "minimax";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || "MiniMax-M2.5";
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "";
const ANALYTICS_TIMEZONE = process.env.ANALYTICS_TIMEZONE || "Asia/Shanghai";
const ANALYTICS_API_TOKEN = process.env.ANALYTICS_API_TOKEN || "";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "";
const ANALYTICS_DATA_FILE = path.join(__dirname, "data", "analytics.json");

const SECTION_ORDER = ["overall", "personality", "career", "wealth", "relationship", "advice"];
const PREVIEW_ICONS = ["star", "briefcase", "heart"];
const FULL_SECTION_ICONS = {
  overall: "star",
  personality: "user",
  career: "briefcase",
  wealth: "sun",
  relationship: "heart",
  advice: "moon"
};

const BRAND_WRITING_REQUIREMENTS = [
  "你不是通用算命助手，而是“命语”品牌的专属写作者。",
  "“命语”的气质是：东方、安静、克制、温柔、真诚，像深夜里有人替用户把纷乱思绪慢慢梳理清楚。",
  "你的任务不是做绝对化预测，而是根据用户信息和结构化标签，生成一份细腻、自然、有代入感的专属人生解读。",
  "写作时要让用户产生“这段话像是在说我”的感觉，但这种共鸣来自细节观察、节奏判断和情绪理解，而不是夸张断言。",
  "请多写“一个人通常如何感受、如何做选择、在什么阶段容易出现什么课题”，少写空泛的大词。",
  "语气要温和、真诚、略带神秘感，但不过度玄学；像熟悉东方语境的写作者，而不是神秘学表演者。",
  "避免绝对化表达，不要制造恐慌，多使用“通常、往往、倾向于、现阶段、在某些时候、更适合、可能会”这类表述。",
  "不要使用宿命论话术，不要写“注定、必然、一定、逃不过、命中注定如此”之类的句子。",
  "不要使用夸张承诺，如“你一定大富大贵”“你注定婚姻不顺”“你的人生会彻底改变”。",
  "报告重点是启发、共鸣和自我理解，不是医学、法律、财务、投资或任何高风险建议。",
  "内容应围绕性格、事业、财运、情感、阶段建议展开，但每个部分侧重点不同，不能机械重复。",
  "如果出生时间未知，要自然提示结论会更偏向阶段性观察，而不是假装非常确定。",
  "文字风格上，要像品牌内容，不像说明书：句子有呼吸感，有层次，有一点余韵，但不要堆砌辞藻。",
  "每一部分都要有真实细节，比如用户在关系中的反应方式、面对压力时的倾向、对机会和风险的态度。",
  "不要写成说教，不要居高临下。建议部分要像温和提醒，而不是命令。",
  "输出必须是结构化 JSON，不要输出 markdown，不要加额外解释，不要在 JSON 外补充任何话。"
].join("\n");

const BRAND_TONE_APPENDIX = [
  "补充风格要求：",
  "1. 开头不要太像模板，不要一上来就说“根据你提供的信息”。",
  "2. 可以适度使用“你身上有一种…的倾向”“你并不是…的人，反而更像…”这类更有代入感的表达。",
  "3. 不要每段都重复“建议你”“你需要”，避免说教感。",
  "4. 允许保留一点东方命理的意象感，比如节奏、气场、起伏、转机、沉潜，但不要神叨叨。",
  "5. 如果是事业或财运，不要只谈成功，要谈节奏、选择、积累、边界。",
  "6. 如果是情感，不要只谈桃花，要谈靠近方式、情绪表达、安全感和沟通。",
  "7. advice 要具体、温和、可执行，像一句能被用户记住的提醒。",
  "8. final_message 要像品牌收尾文案，留有余韵，不要像总结报告。"
].join("\n");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function isAnalyticsAuthorized(request) {
  if (!ANALYTICS_API_TOKEN) {
    return true;
  }

  const headerToken = request.get("x-analytics-token") || "";
  const queryToken = typeof request.query?.token === "string" ? request.query.token : "";

  return headerToken === ANALYTICS_API_TOKEN || queryToken === ANALYTICS_API_TOKEN;
}

function getPublicSiteUrl(request) {
  if (PUBLIC_SITE_URL) {
    return PUBLIC_SITE_URL;
  }

  return `${request.protocol}://${request.get("host")}`;
}

function createPromptPayload(profile) {
  return {
    name: profile?.name || "命主",
    gender: profile?.gender || "未填写",
    birthDate: profile?.birthDate || "未填写",
    birthTime: profile?.birthTime || "UNKNOWN",
    birthPlace: profile?.birthPlace || "未填写",
    preferences: Array.isArray(profile?.preferences) ? profile.preferences : []
  };
}

function extractJsonObject(text) {
  const cleaned = `${text || ""}`.trim();

  if (!cleaned) {
    throw new Error("AI 没有返回可解析内容。");
  }

  const fenced = cleaned.match(/```json\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1].trim() : cleaned;

  try {
    return JSON.parse(jsonText);
  } catch {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI 返回内容不是有效 JSON。");
    }

    return JSON.parse(jsonText.slice(start, end + 1));
  }
}

function previewPrompt(profile) {
  const payload = JSON.stringify(createPromptPayload(profile), null, 2);

  return [
    BRAND_WRITING_REQUIREMENTS,
    BRAND_TONE_APPENDIX,
    "请生成“简版结果页”内容，重点是让用户快速感到被理解，并愿意继续查看详细报告。",
    "整体控制在产品页易读长度，不要写得过长。",
    "请根据下面用户信息，生成“简版结果页”结构，字段必须完整：",
    "{",
    '  "title": "string",',
    '  "summary": "string",',
    '  "cards": [',
    '    { "title": "命理概览", "icon": "star", "description": "string" },',
    '    { "title": "偏好主题", "icon": "briefcase", "description": "string" },',
    '    { "title": "近期提醒", "icon": "heart", "description": "string" }',
    "  ],",
    '  "interpretations": ["string", "string", "string"],',
    '  "advice": "string"',
    "}",
    "要求：summary、interpretations、advice 都要是自然中文，适合产品页面直接展示，避免太空泛。",
    "cards 的描述要彼此有区别，不要三段都在重复同一层意思。",
    "interpretations 三段最好分别落在：内在气质、当前阶段、行为提醒。",
    `用户信息：\n${payload}`
  ].join("\n");
}

function fullPrompt(profile) {
  const payload = JSON.stringify(createPromptPayload(profile), null, 2);

  return [
    BRAND_WRITING_REQUIREMENTS,
    BRAND_TONE_APPENDIX,
    "请生成“详细报告页”内容，要求既有共鸣感，也有可读的结构和层次。",
    "每个 section 都要像真人写作，不要只是换一种说法重复前文。",
    "请根据下面用户信息，生成“详细报告页”结构，字段必须完整：",
    "{",
    '  "title": "string",',
    '  "summary": "string",',
    '  "overviewCards": [',
    '    { "label": "五行属性", "value": "string" },',
    '    { "label": "生肖", "value": "string" },',
    '    { "label": "当前主轴", "value": "string" }',
    "  ],",
    '  "sections": {',
    '    "overall": { "title": "整体总评", "description": "string" },',
    '    "personality": { "title": "性格特质", "description": "string" },',
    '    "career": { "title": "事业运势", "description": "string", "score": "事业指数：80%" },',
    '    "wealth": { "title": "财富节奏", "description": "string", "score": "财富指数：78%" },',
    '    "relationship": { "title": "关系与情感", "description": "string", "score": "情感指数：82%" },',
    '    "advice": { "title": "行动建议", "description": "string" }',
    "  },",
    '  "final_message": "string"',
    "}",
    "要求：内容适合中文产品页直接渲染，结构清晰，避免重复和空话。",
    "overall 更像总评，personality 要写出性格纹理，career/wealth/relationship 要给出阶段感，advice 要给出温和但明确的行动建议。",
    "score 字段用百分比字符串表示，例如“事业指数：82%”，数值保持克制，不要极端。",
    "overall 要像把整个人的底色轻轻点出来；personality 要让用户感到被理解；career/wealth/relationship 要体现不同主题的细微差别；advice 要从“怎么过接下来这段时间”切入。",
    "final_message 请写成命语品牌式收束：温柔、留白、可回味，不要喊口号。",
    `用户信息：\n${payload}`
  ].join("\n");
}

async function callMiniMax(prompt, maxTokens) {
  if (!MINIMAX_API_KEY) {
    throw new Error("MiniMax API Key 未配置。");
  }

  const response = await fetch("https://api.minimax.io/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      temperature: 0.7,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content:
            "你是命语品牌的中文报告生成器。你擅长把用户信息写成细腻、有共鸣、非宿命论、带有东方气息的结构化报告。你的输出必须是合法 JSON，不能输出 markdown，不能写成机械说明书。"
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax 调用失败：${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("MiniMax 未返回有效内容。");
  }

  return extractJsonObject(content);
}

function normalizePreviewReport(report, profile) {
  const fallbackTitle = `${profile?.name || "命主"}的简版解读`;
  const cards = Array.isArray(report?.cards) ? report.cards.slice(0, 3) : [];

  return {
    title: report?.title || fallbackTitle,
    summary: report?.summary || "简版解读正在整理中，请稍后重试。",
    cards: Array.from({ length: 3 }, (_, index) => ({
      title: cards[index]?.title || ["命理概览", "偏好主题", "近期提醒"][index],
      icon: PREVIEW_ICONS[index],
      description: cards[index]?.description || "当前暂无更多描述，稍后可以再次生成。"
    })),
    interpretations: Array.isArray(report?.interpretations)
      ? report.interpretations.filter(Boolean).slice(0, 3)
      : ["当前暂无更多简版解读，建议稍后重试。"],
    advice: report?.advice || "建议保留当前信息，稍后重新生成完整分析。"
  };
}

function normalizeFullReport(report, profile) {
  const fallbackTitle = `${profile?.name || "命主"}的命理解读`;
  const overviewCards = Array.isArray(report?.overviewCards) ? report.overviewCards.slice(0, 3) : [];
  const sections = {};

  SECTION_ORDER.forEach((key) => {
    const current = report?.sections?.[key] || {};
    sections[key] = {
      title: current.title || {
        overall: "整体总评",
        personality: "性格特质",
        career: "事业运势",
        wealth: "财富节奏",
        relationship: "关系与情感",
        advice: "行动建议"
      }[key],
      icon: FULL_SECTION_ICONS[key],
      description: current.description || "当前暂无对应分析内容，建议稍后重试。",
      score: current.score
    };
  });

  return {
    title: report?.title || fallbackTitle,
    summary: report?.summary || "完整报告正在整理中，请稍后重试。",
    overviewCards: Array.from({ length: 3 }, (_, index) => ({
      label: overviewCards[index]?.label || ["五行属性", "生肖", "当前主轴"][index],
      value: overviewCards[index]?.value || "待生成"
    })),
    sections,
    final_message: report?.final_message || "命语会继续用更真实、更温和的方式陪你理解自己。"
  };
}

async function generatePreview(profile) {
  const raw = await callMiniMax(previewPrompt(profile), 800);
  return normalizePreviewReport(raw, profile);
}

async function generateFull(profile) {
  const raw = await callMiniMax(fullPrompt(profile), 1800);
  return normalizeFullReport(raw, profile);
}

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    provider: REPORT_PROVIDER,
    model: MINIMAX_MODEL,
    analytics: {
      trackedPages: Object.keys(TRACKED_PAGES),
      timeZone: ANALYTICS_TIMEZONE
    }
  });
});

app.post("/api/analytics/page-view", (request, response) => {
  try {
    const summary = recordAnalyticsPageView({
      dataFilePath: ANALYTICS_DATA_FILE,
      pageKey: request.body?.pageKey,
      visitorId: request.body?.visitorId,
      occurredAt: new Date(),
      timeZone: ANALYTICS_TIMEZONE
    });

    return response.status(202).json({
      ok: true,
      date: summary.date
    });
  } catch (error) {
    return response.status(400).json({
      message: error instanceof Error ? error.message : "埋点写入失败。"
    });
  }
});

app.get("/api/analytics/daily-summary", (request, response) => {
  if (!isAnalyticsAuthorized(request)) {
    return response.status(401).json({
      message: "analytics token 无效。"
    });
  }

  try {
    const dateKey = resolveAnalyticsDateKey(request.query?.date, ANALYTICS_TIMEZONE);
    const summary = getAnalyticsDailySummary({
      dataFilePath: ANALYTICS_DATA_FILE,
      dateKey,
      timeZone: ANALYTICS_TIMEZONE,
      siteUrl: getPublicSiteUrl(request)
    });

    return response.json(summary);
  } catch (error) {
    return response.status(400).json({
      message: error instanceof Error ? error.message : "日报生成失败。"
    });
  }
});

app.post("/api/report/preview", async (request, response) => {
  try {
    const profile = request.body?.profile || {};

    if (REPORT_PROVIDER !== "minimax") {
      return response.status(400).json({
        message: "当前后端未启用 minimax 提供者。"
      });
    }

    const report = await generatePreview(profile);
    return response.json(report);
  } catch (error) {
    return response.status(502).json({
      message: error instanceof Error ? error.message : "简版报告生成失败。"
    });
  }
});

app.post("/api/report/full", async (request, response) => {
  try {
    const profile = request.body?.profile || {};

    if (REPORT_PROVIDER !== "minimax") {
      return response.status(400).json({
        message: "当前后端未启用 minimax 提供者。"
      });
    }

    const report = await generateFull(profile);
    return response.json(report);
  } catch (error) {
    return response.status(502).json({
      message: error instanceof Error ? error.message : "完整报告生成失败。"
    });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api\/).*/, (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      return next();
    }

    return response.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[mingyu-server] listening on http://127.0.0.1:${PORT}`);
});
