# 个人作品展厅 Implementation Plan

> **For agentic workers:** 使用已确认方案连续执行，独立页面并行实现，主代理负责集成与全站验证。

**Goal:** 交付一个可本地预览的静态作品集与两个产品宣传页。
**Architecture:** Astro 生成静态 HTML，Three.js 按需装载，交互为浏览器脚本，无后台。
**Tech Stack:** Astro 5、TypeScript、Three.js、pnpm。
**Spec:** ../specs/2026-11-05-portfolio-design.md

## Global Constraints
中文交流与注释；只使用 PowerShell；不执行 Git；品牌素材从既有仓库复制，来源项目保持原样；全部输出留在 portfolio。

## Review Focus
手机宽度与长文本溢出；WebGL 不可用；减少动态效果；键盘导航和交互；无效工具输入。

### Task 1: 站点基础与首页
- [x] 创建 package、Astro 配置、SiteLayout、global.css、projects.ts、index.astro。
- [x] 复制现有品牌标志，制作本地分享图与 fallback。
- [x] 实现导航、首页项目选择、未来项目展示和联系入口。
- [x] 检查静态结构、内部链接和 390px 布局。

### Task 2: 独立产品页
- [x] knowweft.astro：知识节点切换、场景预览、可拖动时间线、下载与功能叙述。
- [x] tessera.astro：工具分类、单位换算与文本处理、下载与 FAQ。
- [x] 检查交互正确性及品牌规范，功能函数写最小有效测试。

### Task 3: 空间场景
- [x] Scene.astro 与 scene.ts 支持 home / knowweft / tessera，包装元素高度由页面控制。
- [x] 静态 fallback 始终存在，成功渲染后隐藏；可见性控制渲染、像素比封顶、缩放与资源释放。
- [x] 实际检查正常渲染、无 WebGL、减少动态效果。

### Task 4: 集成交付
- [x] pnpm check、pnpm test、pnpm build。
- [x] Playwright 桌面和手机浏览器验证；截图评估并修正布局。
- [x] 独立评审、README、启动脚本与本地预览交付。

## 收尾复核记录（2026-11-05）

- 首轮构建产物早于分享图生成，静态资源测试 3 项失败；重建后 `pnpm check` 为 0 errors / 0 warnings / 0 hints，`pnpm test` 7/7 通过。
- KnowWeft 首屏修正：品牌标志 205px → 120px；`hero-stage` 由 `min-height` 改为明确 `height`，解决 `.scene { height: 100% }` 在父级无确定高度时退化到 18rem 的问题；`h1` 行高 .94 → 1.06、字距 -.07em → -.045em，消除行间挤压；移动端舞台不透明度 .34 → .24，提升正文对比度。
- 3D 光影：首页线束配色改为品牌色（#A9B6FF / #5F9FD1 / #75D4C7 / #D8B98E），首页曝光 1.18 → 1.04，避免高光把色相冲白；KnowWeft 与 Tessera 曝光保持不变。
- 视觉复核改用 CDP 精确视口（1440×900 / 390×844），`scripts/capture-preview.mjs` 可复跑；6 组页面均为 `overflow=0`、内容裁切 0、WebGL 1/1；另复核减少动态效果与无 WebGL 的静态 SVG 降级。
- 分享图按用户决定保持相对路径，未设置 `SITE_URL`；本地预览不受影响，社交平台抓取分享卡片需在确定正式域名后再启用绝对地址与 canonical。
- 复核形式为源码审查、构建测试、实机截图与 DOM 边界测量，未启用独立评审代理。
