/**
 * 用 Chrome DevTools Protocol 精确设置视口，重拍三页截图并测量横向溢出。
 * 不引入第三方依赖：Node 22 内置 fetch / WebSocket，Chrome 由本机安装提供。
 * 用法：node scripts/capture-preview.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE_URL = process.argv[2] || 'http://127.0.0.1:4321';
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;
const OUT = resolve('.preview');
const USER_DATA = resolve('.preview/.chrome-profile');

const TARGETS = [
  { name: 'home', url: '/' },
  { name: 'knowweft', url: '/knowweft/' },
  { name: 'tessera', url: '/tessera/' },
];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) return;
    } catch { /* 服务尚未就绪 */ }
    await sleep(250);
  }
  throw new Error('Chrome 调试端口未就绪');
}

function connect(wsUrl) {
  return new Promise((done, fail) => {
    const socket = new WebSocket(wsUrl);
    const pending = new Map();
    let nextId = 1;
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const { resolve: ok, reject: no } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? no(new Error(message.error.message)) : ok(message.result);
    });
    socket.addEventListener('error', () => fail(new Error('WebSocket 连接失败')));
    socket.addEventListener('open', () => {
      done({
        send(method, params = {}) {
          return new Promise((ok, no) => {
            const id = nextId++;
            pending.set(id, { resolve: ok, reject: no });
            socket.send(JSON.stringify({ id, method, params }));
          });
        },
        close: () => socket.close(),
      });
    });
  });
}

// 测量真实内容宽度：排除 aria-hidden 装饰层（3D 舞台故意溢出视口）。
const PROBE = `(() => {
  const root = document.documentElement;
  const width = root.clientWidth;
  const decorated = (el) => el.closest('[aria-hidden="true"]') !== null;
  const overflowing = [...document.querySelectorAll('h1,h2,h3,p,a,button,li,dd,dt,summary,label,output')]
    .filter((el) => !decorated(el))
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ el, rect }) => rect.width > 0 && rect.height > 0 && (rect.right > width + 2 || rect.left < -2)
      && getComputedStyle(el).position !== 'absolute')
    .slice(0, 8)
    .map(({ el, rect }) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 34),
      right: Math.round(rect.right),
    }));
  return {
    clientWidth: width,
    scrollWidth: root.scrollWidth,
    pageOverflow: root.scrollWidth - width,
    overflowing,
    sceneReady: document.querySelectorAll('[data-scene-root][data-ready="true"]').length,
    sceneRoots: document.querySelectorAll('[data-scene-root]').length,
  };
})()`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-first-run', '--no-default-browser-check',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--hide-scrollbars', '--force-device-scale-factor=1',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${USER_DATA}`, 'about:blank',
  ], { stdio: 'ignore' });

  const report = { baseUrl: BASE_URL, generatedAt: new Date().toISOString(), pages: [] };
  try {
    await waitForDebugger();
    const pages = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = pages.find((entry) => entry.type === 'page');
    if (!page) throw new Error('未找到可用的浏览器页面');
    const cdp = await connect(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (const viewport of VIEWPORTS) {
      for (const target of TARGETS) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: viewport.width, height: viewport.height,
          deviceScaleFactor: 1, mobile: viewport.mobile,
        });
        await cdp.send('Page.navigate', { url: new URL(target.url, BASE_URL).href });
        await sleep(5000); // 等待 3D 引擎动态加载与首帧
        const probe = (await cdp.send('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result.value;
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        const file = resolve(OUT, `${target.name}-${viewport.name}.png`);
        await writeFile(file, Buffer.from(shot.data, 'base64'));
        report.pages.push({ page: target.name, viewport: viewport.name, file, ...probe });
        const flag = probe.pageOverflow > 0 || probe.overflowing.length > 0 ? ' ⚠' : ' ✓';
        console.log(`${target.name.padEnd(10)} ${viewport.name.padEnd(8)} overflow=${probe.pageOverflow} cut=${probe.overflowing.length} webgl=${probe.sceneReady}/${probe.sceneRoots}${flag}`);
      }
    }

    // 降级态：无 WebGL 与减少动态效果，仅首页桌面宽度。
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await cdp.send('Page.navigate', { url: new URL('/', BASE_URL).href });
    await sleep(3500);
    const reduced = await cdp.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(resolve(OUT, 'home-reduced.png'), Buffer.from(reduced.data, 'base64'));
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });
    console.log('home        reduced  ✓ 已截图');
    cdp.close();
  } finally {
    chrome.kill();
  }
  await writeFile(resolve(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n报告：${resolve(OUT, 'report.json')}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
