/**
 * build-static.mjs —— 预渲染静态站点（用于 GitHub Pages 展示）
 *
 * 背景：本站是 Node.js 服务端渲染（SSR），GitHub Pages 只托管静态文件，
 * 直接部署会导致 /category/:slug、/works/:slug 等动态路由全部 404。
 * 本脚本启动本地服务，抓取全部页面渲染结果，落盘为静态 HTML，
 * 并把绝对路径重写为 GitHub Pages 子路径（/dd-design-platform/）。
 *
 * 用法：
 *   node build-static.mjs
 * 可选环境变量：
 *   BUILD_PORT  本地临时端口（默认 3999）
 *   BASE_PATH   站点子路径（默认 /dd-design-platform）
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.BUILD_PORT || 3999);
const BASE = process.env.BASE_PATH || "/dd-design-platform";
const DIST = path.join(__dirname, "dist");
const PUBLIC = path.join(__dirname, "public");
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SITE_DOMAIN = `https://linlaytop.github.io${BASE}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 把绝对路径重写为带子路径的形式（幂等，重复运行不会叠加前缀） */
function rewrite(code) {
  return (
    code
      // HTML 属性：href="/x"  src="/x"  action="/x"
      .replace(/(href|src|action)="\/(?!\/)([^"]*)"/g, (_, attr, p) => `${attr}="${BASE}/${p}"`)
      // CSS：url('/x') 或 url(/x)
      .replace(/url\(['"]?\/(?!\/)([^)'"]*)['"]?\)/g, (_, p) => `url('${BASE}/${p}')`)
      // JS 字符串里的 "/api/..."、"/images/..."、'/images/...'
      .replace(/"\/api\//g, `"${BASE}/api/`)
      .replace(/"\/images\//g, `"${BASE}/images/`)
      .replace(/'\/images\//g, `'${BASE}/images/`)
  );
}

/** 收集全部需要预渲染的路由 */
function collectRoutes() {
  const cats = JSON.parse(fs.readFileSync(path.join(PUBLIC, "data/categories.json"), "utf8"));
  const routes = ["/", "/preview.html", "/nongcun-bieshu-xiaoguotu"];

  for (const c of cats) {
    routes.push(`/category/${c.slug}`);
    routes.push(`/works/${c.slug}`);
    for (const p of c.projects || []) {
      if (p.id) routes.push(`/works/${c.slug}/${p.id}`);
    }
  }

  // 文章页（无 .html 后缀的动态路由）
  const articleDir = path.join(PUBLIC, "article");
  if (fs.existsSync(articleDir)) {
    for (const f of fs.readdirSync(articleDir)) {
      if (f.endsWith(".html")) routes.push(`/article/${f.replace(/\.html$/, "")}`);
    }
  }
  return routes;
}

/** 标记静态演示模式：无后端时前端降级为友好提示，避免暴露技术性报错 */
function injectDemoFlag(html) {
  return html.includes("</head>")
    ? html.replace("</head>", "<script>window.DD_STATIC_DEMO=true;</script>\n</head>")
    : html;
}

/** URL 落盘路径：/works/hotel/hotel-1 → dist/works/hotel/hotel-1/index.html */
function outFile(route) {
  if (route === "/") return path.join(DIST, "index.html");
  if (route.endsWith(".html")) return path.join(DIST, route.slice(1));
  return path.join(DIST, route.slice(1), "index.html");
}

async function waitServerReady(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(ORIGIN + "/");
      if (r.ok) return true;
    } catch {
      /* 服务器还没起来，继续等 */
    }
    await sleep(300);
  }
  return false;
}

async function main() {
  console.log("清理旧的 dist 目录...");
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  console.log(`启动本地服务（端口 ${PORT}）用于抓取渲染结果...`);
  const server = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(PORT), SITE_DOMAIN },
    stdio: "ignore",
  });

  try {
    if (!(await waitServerReady())) {
      throw new Error("本地服务启动超时");
    }

    // 1) 复制静态资源（js/css/图片等），顺带重写内部绝对路径
    const skip = new Set(["index.html"]); // 首页由 SSR 抓取结果覆盖
    const copyDir = (src, dest) => {
      fs.mkdirSync(dest, { recursive: true });
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDir(s, d);
        } else {
          if (skip.has(entry.name) && src === PUBLIC) continue;
          const ext = path.extname(entry.name);
          if ([".js", ".css", ".html", ".xml", ".txt", ".json"].includes(ext)) {
            let code = rewrite(fs.readFileSync(s, "utf8"));
            if (ext === ".html") code = injectDemoFlag(code);
            fs.writeFileSync(d, code, "utf8");
          } else {
            fs.copyFileSync(s, d);
          }
        }
      }
    };
    copyDir(PUBLIC, DIST);
    console.log("静态资源已复制并重写路径");

    // 2) 抓取全部页面并落盘
    const routes = collectRoutes();
    let ok = 0;
    const failed = [];
    for (const route of routes) {
      try {
        const res = await fetch(ORIGIN + route);
        if (!res.ok) {
          failed.push(`${route} (HTTP ${res.status})`);
          continue;
        }
        const html = injectDemoFlag(rewrite(await res.text()));
        const file = outFile(route);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, html, "utf8");
        ok++;
      } catch (e) {
        failed.push(`${route} (${e.message})`);
      }
    }

    // 3) 兜底文件：.nojekyll（跳过 Jekyll）、404 页
    fs.writeFileSync(path.join(DIST, ".nojekyll"), "", "utf8");
    if (!fs.existsSync(path.join(DIST, "404.html"))) {
      fs.copyFileSync(path.join(DIST, "index.html"), path.join(DIST, "404.html"));
    }

    console.log(`\n预渲染完成：成功 ${ok} 个页面`);
    if (failed.length) {
      console.log(`失败 ${failed.length} 个：`);
      failed.forEach((f) => console.log("  - " + f));
    }
    console.log(`输出目录：${DIST}`);
  } finally {
    server.kill();
    console.log("本地临时服务已关闭");
  }
}

main().catch((e) => {
  console.error("构建失败：", e.message);
  process.exit(1);
});
