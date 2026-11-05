# CY 个人作品展厅

## 简介
个人作品集静态站，包含首页、KnowWeft 知织宣传页与 Tessera 千机宣传页。self_review 与 Creator 作为探索中的项目展示。

## 技术栈
Astro 5.18.2、Three.js 0.187.0、TypeScript 5.9.3、pnpm 10.24.0。原生 CSS 与浏览器事件处理；没有后端、数据库或运行时第三方请求。

## 项目结构
```text
src/pages/             三个独立页面及局部视觉样式
src/layouts/           导航、页脚、页面元信息
src/components/        3D 场景及 SVG 降级视觉
src/scripts/           场景生命周期、知识演示、工具逻辑
src/styles/            全站排版与共享组件
src/data/              作品与探索项目资料
public/brand/          从原项目复制的正式品牌资产
public/images/         示例画面、分享封面
scripts/               单元测试、静态产物检查与视觉截图回归
docs/superpowers/      已确认的设计与实施记录
```

## 快速开始
### 环境要求
Node.js 22.12 以上（本机使用 22.22.2）、pnpm 10.24.0。Windows 使用 PowerShell。

### 安装与运行
```powershell
Set-Location 'D:\my\portfolio'
pnpm install --frozen-lockfile
pnpm dev
```
打开终端提示的地址，默认 http://127.0.0.1:4321/。

### 验证与生产预览
```powershell
pnpm check
pnpm build
pnpm test
pnpm preview
```
静态资源检查依赖构建产物，先 build 再 test。生产预览不会自动更新，修改后重新 build；开发阶段使用 dev。

### 视觉回归截图
先启动 `pnpm preview`，另开终端执行：
```powershell
node scripts/capture-preview.mjs
```
脚本通过 Chrome DevTools Protocol 精确设置 1440×900 与 390×844 视口，输出 `.preview/*.png` 与 `.preview/report.json`（记录横向溢出、内容裁切与 WebGL 渲染状态），并额外截取减少动态效果的首页。默认使用本机 Chrome，可用 `CHROME_PATH` 覆盖；首个参数可指定站点地址，默认 `http://127.0.0.1:4321`。不需要额外安装 npm 依赖。

## 页面与交互
- `/`：三种空间装置主题、项目入口、正在构建的作品、关于创作者。
- `/knowweft/`：知识节点选择、可拖动时间线、浏览器概念演示和真实示例画面。
- `/tessera/`：四组工具预览、真实长度换算、文本整理、常见问题。
- 外部下载链接前往各项目公开 GitHub Releases，不固定过期的安装包版本。

## 配置说明
项目摘要在 `src/data/projects.ts`。完整产品内容在对应 Astro 页面；3D 由 `Scene.astro` 和 `scene.ts` 统一管理。
未来扩展项目时新增页面，再补充首页数据和导航。当前没有后台 API、账号或数据上传。

## 部署说明
构建输出 `dist/` 可交给任意静态托管服务。部署路径为域名根目录，保留 `knowweft/index.html` 与 `tessera/index.html`，服务器开启目录索引即可直接访问子页。
确定正式域名后，构建前设置 `SITE_URL`，会生成绝对分享图地址与 canonical：
```powershell
$env:SITE_URL = 'https://你的正式域名'
pnpm build
```
当前按交付决定保持分享图相对路径，未设置 `SITE_URL`：本地预览正常，但社交平台抓取时 `og:image` 需要绝对地址，分享卡片可能不出图；确定正式域名后按上述方式设置并重新构建即可，同时会生成 canonical。站点目前仅交付本地预览，尚未发布到公网。

## 常见问题
- **没有 3D：** 浏览器不支持 WebGL、上下文丢失或脚本不可用时显示静态 SVG，文字与导航仍正常。
- **减少动态：** 尊重系统减少动态效果偏好，保留静止 3D 与可操作的页面。
- **页面返回：** 场景在离页时释放 GPU 资源，浏览器前进后退恢复时重建；离屏与后台暂停动画。
- **大包提醒：** Three.js 为独立动态加载包，构建会提示超过 500 kB；页面文字在加载引擎前即可显示。
- **演示边界：** 网页演示不等于完整产品，截图、本机文件等能力须在桌面应用中使用。

## 素材来源与许可证
KnowWeft 的标志和示例画面来自本机 `knowweft-source/media/`；Tessera 标志来自 `tessera-source/artifacts/brandkit/tessera/assets/`。页面中的其他图形由 SVG/CSS/Three.js 程序绘制。
网站为个人项目，未指定开源许可证；各产品品牌和第三方依赖仍适用各自授权。
