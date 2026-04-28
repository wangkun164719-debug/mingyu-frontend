# 命语 UTM 链接规范

命语官网当前以测算页作为主要转化入口：

`https://www.mingyuwk.com/measure`

发文、投放、社群分享时，优先使用带 UTM 的链接，方便百度统计、轻量埋点和 OpenClaw 日报按来源、平台、内容主题复盘。

## 通用规则

- `utm_source`：平台来源，例如 `xiaohongshu`、`zhihu`、`baijiahao`、`wechat`。
- `utm_medium`：渠道类型，例如 `social`、`qa`、`seo_article`、`official_account`。
- `utm_campaign`：内容主题和日期，建议格式为 `主题_日期`，例如 `career_20260428`。
- `utm_content`：可选，用于区分同一主题下的不同标题、封面、评论区链接或正文链接。
- `utm_term`：可选，用于 SEO 或关键词实验。

不要把姓名、生日、手机号、身份证、详细地址等个人信息放进 UTM 参数。

## 平台链接模板

### 小红书

```text
https://www.mingyuwk.com/measure?utm_source=xiaohongshu&utm_medium=social&utm_campaign=主题_日期
```

示例：

```text
https://www.mingyuwk.com/measure?utm_source=xiaohongshu&utm_medium=social&utm_campaign=career_20260428
```

### 知乎

```text
https://www.mingyuwk.com/measure?utm_source=zhihu&utm_medium=qa&utm_campaign=主题_日期
```

示例：

```text
https://www.mingyuwk.com/measure?utm_source=zhihu&utm_medium=qa&utm_campaign=relationship_20260428
```

### 百家号

```text
https://www.mingyuwk.com/measure?utm_source=baijiahao&utm_medium=seo_article&utm_campaign=主题_日期
```

示例：

```text
https://www.mingyuwk.com/measure?utm_source=baijiahao&utm_medium=seo_article&utm_campaign=bazi_intro_20260428
```

### 微信公众号

```text
https://www.mingyuwk.com/measure?utm_source=wechat&utm_medium=official_account&utm_campaign=主题_日期
```

示例：

```text
https://www.mingyuwk.com/measure?utm_source=wechat&utm_medium=official_account&utm_campaign=trust_story_20260428
```

### 百度自然搜索

百度自然搜索通常不加 UTM。命语埋点会通过 `referrer` 和搜索来源识别为 `baidu`，并在 OpenClaw 日报的 `top_sources` 中体现。

## Campaign 命名建议

建议用英文或拼音短词，避免空格：

- 兴趣种草：`interest_YYYYMMDD`
- 产品解释：`product_explain_YYYYMMDD`
- 信任建设：`trust_YYYYMMDD`
- 测算流程说明：`measure_flow_YYYYMMDD`
- 详细报告价值说明：`detail_value_YYYYMMDD`
- SEO 内容沉淀：`seo_bazi_YYYYMMDD`

同一天同平台多篇内容，可以增加 `utm_content`：

```text
https://www.mingyuwk.com/measure?utm_source=xiaohongshu&utm_medium=social&utm_campaign=career_20260428&utm_content=note_a
```

## 日报复盘口径

OpenClaw 每天读取 `/api/analytics/daily-summary?date=YYYY-MM-DD` 或仓库内 `/data/analytics/daily-summary.json`，重点看：

- 官网访问量：`site.pv`、`site.uv`
- 主要平台来源：`site.top_sources`
- 平台进入测算意愿：`click_start_measure`、`measure_page_view`
- 平台完成测算意愿：`content_sources[].measure_submit_success`
- 流失步骤：`funnel` 与 `conversion_rates`
- 详细报告点击率：`conversion_rates.report_to_detail_click_rate`
- Campaign 表现：`content_sources`
