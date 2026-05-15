# 照妖镜 CMS

高赞之下，未必真实。你的防认知操控守护神。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel)](https://vercel.com/)

**[在线体验 sudden-cms.vercel.app](https://sudden-cms.vercel.app/)** · **知乎 AI Hackathon 2026 参赛作品**

> **声明**：本项目并非知乎官方发布。「刘看山」形象与品牌归属知乎（北京智者天下科技有限公司）所有。本项目以社区好意致敬，不主张对该形象的任何权利。

---

照妖镜 CMS 是一款认知操控检测工具。它不判断观点对错，只分析表达结构——当你刷到一条「看起来很有道理」的回答时，不妨让它帮你看看里面藏着哪些认知操控的手法。

## 功能

- **文本分析**：直接粘贴回答正文，或输入知乎链接，AI 自动提取并分析
- **知乎热榜联动**：浏览实时热榜，一键搜索相关回答并分析
- **五维检测**：情绪诱导、逻辑跳跃、权威依赖、幸存者偏差、事实陈述
- **黑镜风格 UI**：扫描动画、HUD 界面、进度条、风险检测面板
- **历史记录**：所有扫描结果本地持久化，随时回溯
- **分享圈子**：将分析结果发布到知乎社区圈子
- **知乎登录**：支持知乎 OAuth 授权登录

## 开始使用

### 1. 配置环境变量

复制 `.env.local.example` 为 `.env.local`（或直接在 Vercel Dashboard 添加）：

```bash
# DeepSeek AI 分析
DEEPSEEK_API_KEY=your_deepseek_api_key

# 知乎开发者 API（热榜 + 搜索）
ZHIHU_ACCESS_SECRET=your_zhihu_access_secret

# 知乎 OAuth（登录功能）
ZHIHU_APP_ID=your_zhihu_app_id
ZHIHU_CLIENT_SECRET=your_zhihu_client_secret
ZHIHU_REDIRECT_URI=https://your-domain.com/api/auth/callback/zhihu

# 知乎社区 API（分享圈子）
ZHIHU_APP_KEY=your_zhihu_app_key
ZHIHU_APP_SECRET=your_zhihu_app_secret
```

### 2. 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 3. 部署

项目已配置为 Vercel 部署。连接你的 GitHub 仓库后，Vercel 会自动构建并部署。

## 开发

需要 Node.js 18+、npm。

```bash
npm install      # 安装依赖
npm run dev      # 开发模式
npm run build    # 生产构建
npm run lint     # 代码检查
```

## 技术栈

- **框架**：Next.js 16 (App Router)
- **运行时**：React 19 + TypeScript 5
- **样式**：Tailwind CSS v4
- **状态**：Zustand + persist (localStorage)
- **动画**：Framer Motion
- **AI**：DeepSeek API (`deepseek-v4-flash`)
- **抓取**：Puppeteer Core（知乎内容提取）

## 协议

源代码：**MIT**（见 `LICENSE`）  
角色形象「刘看山」：**知乎所有，不在 MIT 协议授权范围内**
