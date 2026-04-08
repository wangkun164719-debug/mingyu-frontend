---
name: mingyu-ops
description: Operate the MingYu website using daily funnel metrics, landing-page conversion analysis, and channel recommendations. Use when Codex or OpenClaw needs to review MingYu traffic, summarize yesterday's PV/UV and funnel conversion, diagnose homepage/measure/report drop-off, propose daily growth actions, or generate promotion ideas for Xiaohongshu, Zhihu, and Douyin.
---

# Mingyu Ops

## Overview

Operate the MingYu site as a lightweight growth operator.
Use the analytics API as the source of truth, then turn yesterday's numbers into concrete actions for today.

## Daily Workflow

Follow this order:

1. Read the daily summary endpoint for yesterday.
2. Extract homepage, measure page, and report page PV and UV.
3. Check the funnel rates:
   `home -> measure`
   `measure -> report`
4. Decide whether the main problem is traffic, homepage conversion, or downstream conversion.
5. Propose at most 3 actions that can be executed today.

## Data Source

Default site:
`http://39.101.77.13`

Default analytics endpoint:
`http://39.101.77.13/api/analytics/daily-summary?date=yesterday`

Send the analytics token with header:
`x-analytics-token: <token>`

If the token is missing, report that the analytics endpoint is protected and cannot be read.

Treat the API response as authoritative.
Do not infer fake numbers.
If the endpoint returns no data, say so clearly and switch to instrumentation or traffic debugging advice.

## Diagnosis Rules

Use these heuristics:

- If homepage UV is low, treat the bottleneck as acquisition.
- If homepage UV is acceptable but `home -> measure` UV conversion is weak, treat the bottleneck as homepage messaging or CTA.
- If measure UV is acceptable but `measure -> report` UV conversion is weak, treat the bottleneck as form friction, expectation mismatch, or report-page trust.
- If all three pages have traffic but PV is much higher than UV, check repeat visits and landing-page clarity before recommending more traffic spend.

## Channel Priority

Prioritize channels in this order unless the user says otherwise:

1. Xiaohongshu
   Best for search-driven discovery, emotional resonance, and self-exploration topics.
2. Zhihu
   Best for trust, long-tail search, and explanatory content.
3. Douyin
   Use after the first two are producing stable hooks and proof points.

## Recommendation Rules

Every recommendation must map to one of these buckets:

- Traffic acquisition
- Homepage conversion
- Measure-page completion
- Report-page trust and payoff
- Content distribution

Keep actions small and testable.
Prefer actions that can be executed in one day.
Tie each action to a page or channel.

## Output Format

Return five short sections:

1. `昨日概览`
   Include total PV/UV and page-level PV/UV.
2. `漏斗判断`
   State the main bottleneck in one sentence.
3. `关键异常`
   Mention up to 2 anomalies or risks.
4. `今日动作`
   List up to 3 concrete actions.
5. `渠道建议`
   Give 1 content angle for Xiaohongshu or Zhihu first; mention Douyin only if relevant.

## Guardrails

Do not fabricate metrics.
Do not give generic growth advice without tying it to the funnel.
Do not recommend superstition-heavy or fear-based promotion angles.
Keep the brand tone calm, restrained, and trust-building.
