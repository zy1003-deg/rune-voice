# Rune Voice · 符文之声

> 一个开源的语音内容索引与浏览平台。粉丝项目，与任何游戏厂商均无关联。

Rune Voice 是一个开源的**语音内容索引、检索、浏览与播放**平台。项目的
工程重点在**数据处理流水线** — 抓取、标准化、索引、对外提供结构化
JSON 元数据。本仓库只包含代码、schema、流水线和一个小型合成 demo
数据集；生产级内容由运营者托管在仓库之外。

---

## 在线演示

维护者个人有一个针对《英雄联盟》粉丝内容数据集的部署实例，
运行在 <https://lol.zyyeah.asia>。这是维护者的私有实例，不是本项目
的官方 host；如果 fork 本项目，请通过 `VITE_SITE_URL` 指向你自己的
部署。

---

## 功能

- **实体网格** — 浏览所有条目，展示职业 / 数量 / 详情。
- **按事件分组** — 台词按皮肤与事件（选中 / 攻击 / 笑话 / 嘲讽 /
  移动 …）组织。
- **音频播放器** — 唯一、队列感知的 `<audio>` 引擎，支持进度 / 音量
  / 上下首 / 预取。
- **全文搜索** — 对内置索引做防抖客户端搜索。
- **职业筛选** — 顶部胶囊切换。
- **主题切换** — 浅色 / 深色，状态持久化到 `localStorage`。
- **Hash 路由** — `#/<名称>` 形式，便于分享。
- **纯静态可部署** — 运行时不需要任何后端服务，数据集托管位置由
  `VITE_API_BASE` 决定。

---

## 截图

> 后续会在 [`docs/images/`](docs/images/) 放精选截图。截图将单独在
> 后续版本中加入，且不会重新分发任何第三方 IP。

---

## 架构

```
  数据源（运营者托管）
                │
                ▼
  Python 异步爬虫 (core/、main.py)
                │
                ▼
  本地音频树 (./data/audio/<实体>/<皮肤>/<台词>.mp3)
                │
                ▼
  数据准备脚本 (web/generate_data.py 等)
                │
                ▼
  静态 JSON 数据集  ──► 托管在仓库之外
                │
                ▼
  React 19 + Vite SPA (web/src/)
                │
                ├── /demo-data（默认；仓库内合成 demo）
                │
                └── VITE_API_BASE（生产覆盖默认）
                          │
                          ▼
                  外部 CDN / 对象存储
                          │
                          ▼
                      用户
```

爬虫与数据准备脚本都是**离线的**。它们把运营者的数据源转成 SPA 运行时
消费的静态 JSON。SPA 运行时只依赖这些 JSON，不依赖爬虫脚本本身。

---

## 技术栈

| 层级        | 技术选型                                                      |
| ----------- | ------------------------------------------------------------- |
| 前端        | React 19 · Vite 6 · Tailwind v4 · framer-motion 12 · Vercel Analytics |
| 构建 / CDN  | Vite（静态 SPA）· Vercel 或任意静态托管 · 任何 S3 兼容桶         |
| 爬虫        | Python 3.10+ · `asyncio` · `httpx` · `aiofiles`                |
| 音频解码    | `vgmstream-cli` + `ffmpeg`（仅在处理 `.wem` 原始文件时需要）  |
| 测试        | `pytest`（Python）· `vitest`（JS）                              |
| Lint        | `ruff`（Python）                                               |

---

## 仓库 vs 生产数据

本仓库是**代码、schema、流水线和小合成 demo**，不是数据档案。

### 仓库包含

- 原创源代码（Python 爬虫 + React/Vite 前端）。
- 数据处理流水线（爬虫、标准化、JSON 生成）。
- JSON schema（见 [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md)）。
- 小型合成 demo 数据集（`web/public/demo-data/`，5 个虚构实体，约 20
  条合成台词）。
- 测试、CI 配置、文档。

### 仓库不包含

- Riot 拥有的游戏音频（`.wem` / `.mp3` 等）。
- Riot 拥有的英雄肖像 / 皮肤艺术 / 加载图。
- 生产级语音档案。
- 完整的逐实体台词数据集。
- 生产级搜索索引 / 精选台词池。

生产部署由运营者把自有数据集放在对象存储上，并通过 `VITE_API_BASE`
指向其公网 URL。

---

## 快速开始

### 环境要求

- **Node.js 20+** 和 **npm 10+**（前端）。
- **Python 3.10+**（爬虫与离线流水线，可选）。
- **`ffmpeg`** 在 `PATH` 中（处理 `.wem` 时需要）。
- **`vgmstream-cli`** 在 `PATH` 中（同上）。没有它会回退保留 `.wav`。

### 1. 克隆并安装

```bash
git clone https://github.com/zy1003-deg/rune-voice.git
cd rune-voice
pip install -r requirements.txt            # Python 爬虫（可选）
cd web && npm install && cd ..             # 前端
```

### 2. （可选）配置环境变量

默认值已经足够：

```bash
cp .env.example .env                       # Python 爬虫
cp web/.env.example web/.env.development   # Vite 开发服务器
```

### 3. 启动 demo 前端

```bash
cd web
npm run dev
# → 打开 http://localhost:5173
```

不设置任何环境变量时，SPA 会加载**合成的 demo 数据集**
（`web/public/demo-data/`）。你会看到 5 个虚构实体、可工作的搜索框、
职业切换、详情页和播放器。音频会显示"不可用"，因为 demo 数据集刻意
不带音频文件。

### 4. 指向你自己的数据集

```bash
echo "VITE_API_BASE=https://your-cdn.example.com/data" > web/.env.production
cd web && npm run build
# 把 web/dist/ 部署到任意静态托管。
```

### 5. （可选）刷新数据集

```bash
echo "LOL_VOICE_API_BASE=https://your-source.example.com" >> .env
echo "LOL_VOICE_CDN_BASE=https://your-source.example.com" >> .env
python main.py --mode search
python main.py --mode full
python web/generate_data.py
python web/add_roles.py
python web/update_events.py
python web/generate_search_index.py
python web/generate_sitemap.py
```

---

## 数据 / 素材准备

### Demo 自带什么

```
web/public/demo-data/
├── README.md              ← 解释合成数据集
└── data/
    ├── champions.json     ← 5 个虚构实体
    ├── quotes/*.json      ← 每个实体 3–5 条合成记录
    ├── search_index.json  ← 聚合搜索索引
    └── featured_quotes.json
```

所有名字、台词和音频路径都是**虚构**占位内容。Demo 适合展示 UI /
搜索 / 播放器，不引用任何第三方知识产权。

### 自有数据集

流水线需要外部数据源（你有权使用的 API、自己的档案 …）。爬虫 +
`web/` 下的脚本转出 4 类 JSON：

- `champions.json` — `{name, alias, quoteCount, skins, file, role}` 数组。
- `quotes/<name>.json` — `{skin, event, text, file, dir}` 数组。
- `search_index.json` — `{text, champion, event, skin}` 数组。
- `featured_quotes.json` — `{text, champion, dir, file, skin, event, featured}` 数组。

完整 schema 见 [docs/PROJECT_ARCHITECTURE.md §4](docs/PROJECT_ARCHITECTURE.md)。

### 头像

本仓库**不**附带实体肖像。两种方案：

1. 把肖像放到 `web/public/champion/{alias}.png`（Vite 直接作为静态资源
   提供）。
2. 设置 `VITE_AVATAR_BASE` 指向你自己的 CDN；SPA 会用
   `${VITE_AVATAR_BASE}/${alias}.png`。

### 音频

SPA 把音频 URL 拼接为 `${VITE_API_BASE}/${dir}/${file}`。生产 CDN 应
提供对应 MP3 文件。播放器失败走 `<audio>` 标准 `onerror`。

---

## 参与贡献

欢迎提 issue 和 PR。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。要点：

- **不要提交第三方游戏素材** — 语音、加载图、肖像等都属上游版权。
- 用功能分支命名（`feature/...`、`fix/...`、`chore/...`）。
- Python 测试：`pytest tests/`。
- 前端测试：`cd web && npm test`。
- 前端构建：`cd web && npm run build`。

---

## 安全

如发现漏洞，请私下联系维护者 —— 见 [SECURITY.md](SECURITY.md)。

---

## 非官方声明

Rune Voice 是非官方粉丝项目，**与 Riot Games、Garena、Tencent 或任何
其他游戏厂商没有任何官方关联或认可**，也未获得它们的赞助。

《英雄联盟》及任何相关游戏名称、标志、台词、英雄肖像、皮肤艺术、音
乐、商标或其他知识产权均为 Riot Games, Inc. 及其各自所有方的财产。
Rune Voice 是一个通用的语音内容索引与浏览平台；其开源协议仅覆盖本
仓库原创的源代码。

Riot 拥有的知识产权受 Riot Games 适用政策和适用法律约束。Riot 拥有
的素材不在本仓库开源协议覆盖范围内。维护者并未声明此处对第三方素材
的任何使用构成合理使用或其他许可；该判断由平台每位运营者自行负责。

---

## 协议

源代码：MIT —— 见 [LICENSE](LICENSE)。

范围说明：[NOTICE.md](NOTICE.md)。

运营者提供的数据与素材：受该运营者自身权利和协议约束。

---

## 延伸阅读

- [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md) — 给
  Reviewer / 贡献者的完整技术架构。
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — 开发流程。
- [`SECURITY.md`](SECURITY.md) — 漏洞报告渠道。
- [`NOTICE.md`](NOTICE.md) — 协议范围说明。
