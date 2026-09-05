/**
 * DD 设计交易平台 —— 零依赖服务端
 * 仅使用 Node.js 内置模块，无需 npm install，直接 `node server.js` 运行。
 *
 * 运行：  node server.js
 * 访问：  http://localhost:3000
 * 端口：  可用环境变量 PORT 覆盖
 *
 * 设计目标：无构建步骤、单端口、同源、无代理、无第三方依赖 —— 从根上消除
 * 之前版本里"按钮点不了 / 页面打不开"那一类由构建链路（Vite 代理、端口冲突、
 * Windows 启动脚本、CORS）引起的 bug。
 *
 * SEO：/category/:slug 服务端渲染分类落地页（百度可直接抓取正文与关键词），
 * 并内置百度统计、结构化数据、canonical、OG；robots.txt 与 sitemap.xml 为静态文件。
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_FILE = path.join(ROOT, "data.json");

// 站点正式域名（用于 canonical / sitemap / 结构化数据）。上线后替换为已备案域名。
const SITE_DOMAIN = process.env.SITE_DOMAIN || "https://www.dd-design.com";

// 百度统计（国内资源，非 Google Analytics）。上线前把 YOUR_BAIDU_TONGJI_ID 替换为
// 百度统计「网站ID」（hm.baidu.com 后台获取）。缺失也不会影响页面，仅无统计。
const BAIDU_TONGJI_ID = process.env.BAIDU_TONGJI_ID || "YOUR_BAIDU_TONGJI_ID";
const BAIDU_TONGJI = `<script>
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
</script>`;

// 百度搜索资源平台（站长）验证。在百度站长后台获取后替换 content。
const BAIDU_VERIFY = `<meta name="baidu-site-verification" content="YOUR_BAIDU_VERIFY_CODE" />`;

// ---------------------------------------------------------------------------
// 分类 SEO 数据（供 /category/:slug 服务端渲染）
// ---------------------------------------------------------------------------
let CATEGORIES = [];
try {
  const catFile = path.join(PUBLIC_DIR, "data", "categories.json");
  CATEGORIES = JSON.parse(fs.readFileSync(catFile, "utf-8"));
  } catch (e) {
    console.error("读取 categories.json 失败，分类落地页将不可用：", e.message);
  }

  // 本地真实 AI 配图（public/images/*.png），用于分类 Hero 与专题页，避免引用缺失的 .svg 破图。
  const IMG_PNG = {
    hotel: "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
    minsu: "/images/Beautiful_countryside_guesthou_2026-08-06T14-17-42.png",
    residential: "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
    commercial: "/images/Trendy_commercial_retail_space_2026-08-06T14-17-22.png",
    softdecor: "/images/Elegant_soft_decoration_interi_2026-08-06T14-17-22.png",
    "ai-design": "/images/Futuristic_AI_smart_home_desig_2026-08-06T14-17-22.png",
    homestead: "/images/Beautiful_rural_countryside_vi_2026-08-06T14-18-23.png",
    lighting: "/images/Professional_architectural_lig_2026-08-06T14-18-23.png",
    garden: "/images/Beautiful_landscape_garden_des_2026-08-06T14-18-23.png",
    architecture: "/images/Modern_architectural_building__2026-08-06T14-18-23.png",
    restaurant: "/images/Elegant_fine_dining_restaurant_2026-08-06T14-18-23.png",
  };

  // 分类页「作品图集」真实配图（≥4 张），支持微信公众号式多图展示。
  const GALLERY_PNG = {
    hotel: [
      "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
      "/images/Elegant_fine_dining_restaurant_2026-08-06T14-18-23.png",
      "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
      "/images/Professional_architectural_lig_2026-08-06T14-18-23.png",
      "/images/Trendy_commercial_retail_space_2026-08-06T14-17-22.png",
    ],
    minsu: [
      "/images/Beautiful_countryside_guesthou_2026-08-06T14-17-42.png",
      "/images/Beautiful_rural_countryside_vi_2026-08-06T14-18-23.png",
      "/images/Beautiful_landscape_garden_des_2026-08-06T14-18-23.png",
      "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
      "/images/Elegant_soft_decoration_interi_2026-08-06T14-17-22.png",
    ],
    residential: [
      "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
      "/images/Elegant_soft_decoration_interi_2026-08-06T14-17-22.png",
      "/images/Beautiful_rural_countryside_vi_2026-08-06T14-18-23.png",
      "/images/Beautiful_landscape_garden_des_2026-08-06T14-18-23.png",
      "/images/Futuristic_AI_smart_home_desig_2026-08-06T14-17-22.png",
    ],
    commercial: [
      "/images/Trendy_commercial_retail_space_2026-08-06T14-17-22.png",
      "/images/Elegant_fine_dining_restaurant_2026-08-06T14-18-23.png",
      "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
      "/images/Professional_architectural_lig_2026-08-06T14-18-23.png",
      "/images/Modern_architectural_building__2026-08-06T14-18-23.png",
    ],
    softdecor: [
      "/images/Elegant_soft_decoration_interi_2026-08-06T14-17-22.png",
      "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
      "/images/Beautiful_countryside_guesthou_2026-08-06T14-17-42.png",
      "/images/Futuristic_AI_smart_home_desig_2026-08-06T14-17-22.png",
      "/images/Professional_architectural_lig_2026-08-06T14-18-23.png",
    ],
    "ai-design": [
      "/images/Futuristic_AI_smart_home_desig_2026-08-06T14-17-22.png",
      "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
      "/images/Trendy_commercial_retail_space_2026-08-06T14-17-22.png",
      "/images/Elegant_soft_decoration_interi_2026-08-06T14-17-22.png",
      "/images/Professional_architectural_lig_2026-08-06T14-18-23.png",
    ],
    homestead: [
      "/images/Beautiful_rural_countryside_vi_2026-08-06T14-18-23.png",
      "/images/Beautiful_countryside_guesthou_2026-08-06T14-17-42.png",
      "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
      "/images/Beautiful_landscape_garden_des_2026-08-06T14-18-23.png",
      "/images/Modern_architectural_building__2026-08-06T14-18-23.png",
    ],
    lighting: [
      "/images/Professional_architectural_lig_2026-08-06T14-18-23.png",
      "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
      "/images/Elegant_fine_dining_restaurant_2026-08-06T14-18-23.png",
      "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
      "/images/Futuristic_AI_smart_home_desig_2026-08-06T14-17-22.png",
    ],
    garden: [
      "/images/Beautiful_landscape_garden_des_2026-08-06T14-18-23.png",
      "/images/Beautiful_rural_countryside_vi_2026-08-06T14-18-23.png",
      "/images/Beautiful_countryside_guesthou_2026-08-06T14-17-42.png",
      "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
      "/images/Elegant_soft_decoration_interi_2026-08-06T14-17-22.png",
    ],
    architecture: [
      "/images/Modern_architectural_building__2026-08-06T14-18-23.png",
      "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
      "/images/Trendy_commercial_retail_space_2026-08-06T14-17-22.png",
      "/images/Beautiful_rural_countryside_vi_2026-08-06T14-18-23.png",
      "/images/Futuristic_AI_smart_home_desig_2026-08-06T14-17-22.png",
    ],
    restaurant: [
      "/images/Elegant_fine_dining_restaurant_2026-08-06T14-18-23.png",
      "/images/Trendy_commercial_retail_space_2026-08-06T14-17-22.png",
      "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
      "/images/Professional_architectural_lig_2026-08-06T14-18-23.png",
      "/images/Beautiful_landscape_garden_des_2026-08-06T14-18-23.png",
    ],
  };
  // 专题页各类风格图映射到真实配图（旧代码引用了不存在的 home-1.svg 等）
  const GALLERY_IMG = {
    "home-1": IMG_PNG.homestead,
    "home-2": IMG_PNG.residential,
    "home-3": IMG_PNG.minsu,
    "home-4": IMG_PNG.garden,
    "home-5": IMG_PNG.hotel,
    "home-6": IMG_PNG.architecture,
    "villa": IMG_PNG.residential,
  };
  const gimg = (src) => {
    const key = String(src).split("/").pop().replace(/\.(svg|png)$/, "");
    return GALLERY_IMG[key] || src;
  };

// ---------------------------------------------------------------------------
// 数据存储（JSON 文件，零依赖）
// ---------------------------------------------------------------------------
const DEFAULT_ADMIN = {
  username: process.env.ADMIN_USER || "admin",
  password: process.env.ADMIN_PASS || "Dd@2026",
};

function loadData() {
  let data = null;
  try {
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("读取 data.json 失败，将使用空数据：", e.message);
  }
  if (!data || typeof data !== "object") data = {};
  data.users = data.users || [];
  data.codes = data.codes || {};
  data.videos = data.videos || [];
  data.contacts = data.contacts || [];
  data.extraCases = data.extraCases || {};        // slug -> [case objects]
  data.categoryBlocks = data.categoryBlocks || {}; // slug -> [{type:'text'|'image', content, id}]
  data.workNotes = data.workNotes || {};           // slug -> { workId -> [{ id, text }] }
  // 管理员账号保存在内存 + 环境变量，不写进可被用户读到的 data.json
  return data;
}

let data = loadData();

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("写入 data.json 失败：", e.message);
  }
}

// 简单口令哈希（演示用，非生产级）
function hashPwd(pwd) {
  return crypto.createHash("sha256").update("dd_salt_" + pwd).digest("hex");
}

// ---------------------------------------------------------------------------
// 鉴权 token（内存态，重启即失效，符合演示场景）
// ---------------------------------------------------------------------------
const tokens = new Map(); // token -> { type: 'user' | 'admin', id }

function issueToken(type, id) {
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, { type, id });
  return token;
}

function getToken(req) {
  const auth = req.headers["authorization"] || "";
  if (!auth.startsWith("Bearer ")) return null;
  const t = auth.slice(7).trim();
  return tokens.get(t) || null;
}

// ---------------------------------------------------------------------------
// HTTP 工具
// ---------------------------------------------------------------------------
function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("请求体过大"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch (e) {
        reject(new Error("请求体不是合法 JSON"));
      }
    });
    req.on("error", reject);
  });
}

const PHONE_RE = /^1\d{10}$/;

// HTML 转义（分类页渲染用，防止内容里的特殊字符破坏结构）
function escHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function safeSlug(s) {
  return String(s || "").replace(/[^\w-]/g, "").slice(0, 40);
}

// 保存 base64 图片到 public/images（复刻微信公众号上传）
function saveBase64Image(base64, prefix) {
  const m = String(base64).match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
  if (!m) throw new Error("仅支持 PNG/JPG/WEBP 格式的 base64 图片");
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 5 * 1024 * 1024) throw new Error("图片不能超过 5MB");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `${prefix}_${ts}.${ext}`;
  const p = path.join(PUBLIC_DIR, "images", name);
  fs.writeFileSync(p, buf);
  return "/images/" + name;
}

// ---------------------------------------------------------------------------
// 分类落地页（服务端渲染，微信公众号文章风格 + 多图画廊 + 案例管理）
// ---------------------------------------------------------------------------
function renderCategoryPage(slug) {
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (!c) return null;
  const s = c.seo || {};
  const title = s.metaTitle || `${c.title} | DD设计交易平台`;
  const desc = s.metaDescription || c.description;
  const kw = s.metaKeywords || c.title;
  const url = SITE_DOMAIN + "/category/" + c.slug;

  const extra = data.extraCases[slug] || [];
  const allCases = (c.projects || []).concat(extra);
  const featured = allCases.slice(0, 3);
  const moreCases = allCases.slice(3);

  const heroImg = IMG_PNG[c.slug] || IMG_PNG.hotel;
  const gallery = (data.categoryBlocks && data.categoryBlocks[slug]
    ? data.categoryBlocks[slug].filter((b) => b.type === "image").map((b) => b.content)
    : []).concat(GALLERY_PNG[c.slug] || []);

  const introHtml = (s.intro || []).map((t) => `<p>${escHtml(t)}</p>`).join("");
  const processHtml = (s.process || []).map((p) => `
    <div class="wx-process-step">
      <div class="wx-process-no">${escHtml(p.step)}</div>
      <div><h4>${escHtml(p.title)}</h4><p>${escHtml(p.desc)}</p></div>
    </div>`).join("");
  const faqHtml = (s.faq || []).map((f) => `
    <div class="wx-faq-item">
      <h4>${escHtml(f.q)}</h4>
      <p>${escHtml(f.a)}</p>
    </div>`).join("");

  const statImages = (GALLERY_PNG[c.slug] || []).slice(0, 4);
  const statsHtml = (c.stats || []).map((st, i) => {
    const img = statImages[i] || heroImg;
    return `<div class="wx-stat" style="background-image:url('${escHtml(img)}'), linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.60) 100%)">
      <strong>${escHtml(st.value)}</strong>
      <span>${escHtml(st.label)}</span>
    </div>`;
  }).join("");

  function caseImage(p) {
    const img = String(p.image || "");
    return img && !img.endsWith(".svg") ? img : (heroImg);
  }

  const caseCard = (p) => `
    <div class="wx-case-card" data-case-id="${escHtml(p.id || "")}">
      <div class="wx-case-img wx-zoomable" data-img="${escHtml(caseImage(p))}" style="background-image:url('${escHtml(caseImage(p))}'), linear-gradient(135deg,#f6eed9,#d6b271)">
        <span class="wx-case-tag">${escHtml(p.style || c.title)}</span>
        <span class="wx-zoom-ico" aria-hidden="true">⤢</span>
      </div>
      <div class="wx-case-body">
        <h3>${escHtml(p.title)}</h3>
        <p class="wx-case-loc">${escHtml(p.location || "")} · ${escHtml(p.area || "")} · ${escHtml(p.duration || "")}</p>
        <p class="wx-case-desc">${escHtml(p.description || "")}</p>
        <div class="wx-case-foot"><span>${escHtml(p.savings || "")}</span><span>${escHtml(p.budget || "")}</span></div>
      </div>
    </div>`;

  const featuredHtml = featured.map((p) => caseCard(p)).join("");
  const moreHtml = moreCases.length
    ? `<div class="wx-more-cases">${moreCases.map((p) => caseCard(p)).join("")}</div>`
    : "";

  const galleryHtml = gallery.slice(0, 8).map((src, i) => `
    <figure class="wx-gallery-item wx-zoomable" data-img="${escHtml(src)}">
      <img src="${escHtml(src)}" alt="${escHtml(c.title)}作品图${i + 1}" loading="lazy" />
      <span class="wx-zoom-ico" aria-hidden="true">⤢</span>
    </figure>`).join("");

  const dynamicBlocks = ((data.categoryBlocks && data.categoryBlocks[slug]) || [])
    .filter((b) => b.type === "text")
    .map((b) => `<div class="wx-block-text">${escHtml(b.content).replace(/\n/g, "<br>")}</div>`)
    .join("");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": c.title,
    "description": desc,
    "image": heroImg,
    "author": { "@type": "Organization", "name": "DD设计交易平台" },
    "publisher": { "@type": "Organization", "name": "DD设计交易平台", "logo": { "@type": "ImageObject", "url": SITE_DOMAIN + "/favicon.ico" } },
    "datePublished": "2026-08-08",
    "dateModified": "2026-08-08",
  });

  const adminScript = `
<script>
(function(){
  const slug = ${JSON.stringify(c.slug)};
  const token = localStorage.getItem("dd_admin") || "";
  const params = new URLSearchParams(location.search);
  const isEdit = params.get("edit") === "1" && token;

  function toast(msg){ const t=document.createElement("div"); t.className="wx-toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2200); }

  async function api(path, method, body){
    const opts={method, headers:{"Authorization":"Bearer "+token, "Content-Type":"application/json"}};
    if(body) opts.body=JSON.stringify(body);
    const r=await fetch(path, opts); return r.json().catch(()=>({success:false,message:"网络错误"}));
  }

  const addCaseBtn = document.getElementById("wxAddCase");
  if(addCaseBtn){
    if(!token) addCaseBtn.classList.add("hidden");
    addCaseBtn.addEventListener("click", async ()=>{
      if(!token){ toast("请先登录管理员账号"); return; }
      const title=prompt("案例名称："); if(!title) return;
      const location=prompt("项目地点：")||"";
      const area=prompt("面积：")||"";
      const style=prompt("风格：")||"";
      const budget=prompt("设计费：")||"";
      const savings=prompt("节省金额：")||"";
      const duration=prompt("工期：")||"";
      const description=prompt("案例描述：")||"";
      const image=prompt("图片URL（留空使用默认）：")||"";
      const res=await api("/api/admin/categories/"+slug+"/cases","POST",{title,location,area,style,budget,savings,duration,description,image});
      if(res.success){ toast("案例已添加"); location.reload(); } else { toast(res.message||"添加失败"); }
    });
  }

  // 顶部为管理员显示「编辑图文」入口
  if(token){
    const topbar = document.querySelector(".wx-topbar");
    if(topbar && !topbar.querySelector(".wx-edit-link")){
      const a=document.createElement("a");
      a.className="wx-edit-link";
      a.href="?edit=1";
      a.textContent="编辑图文";
      a.style="position:absolute;right:48px;font-size:13px;color:var(--gold-deep);";
      topbar.appendChild(a);
    }
  }

  const editor = document.getElementById("wxEditor");
  const editorBlocks = document.getElementById("wxEditorBlocks");
  if(isEdit && editor){
    editor.classList.remove("hidden");
    document.getElementById("wxEditBadge").classList.remove("hidden");
    document.body.classList.add("wx-edit-mode");
    window.wxAddText = function(){
      const wrap=document.createElement("div"); wrap.className="wx-ed-block";
      wrap.innerHTML='<textarea placeholder="输入文字段落..."></textarea><button class="wx-ed-del">删除</button>';
      wrap.querySelector(".wx-ed-del").onclick=()=>wrap.remove();
      editorBlocks.appendChild(wrap);
    };
    window.wxAddImage = function(){
      const wrap=document.createElement("div"); wrap.className="wx-ed-block wx-ed-img";
      wrap.innerHTML='<input type="file" accept="image/*"><div class="wx-ed-preview"></div><button class="wx-ed-del">删除</button>';
      const input=wrap.querySelector("input"), preview=wrap.querySelector(".wx-ed-preview");
      input.onchange=function(){
        const file=this.files[0]; if(!file) return;
        const reader=new FileReader();
        reader.onload=(e)=>{ preview.innerHTML='<img src="'+e.target.result+'">'; wrap.dataset.base64=e.target.result; };
        reader.readAsDataURL(file);
      };
      wrap.querySelector(".wx-ed-del").onclick=()=>wrap.remove();
      editorBlocks.appendChild(wrap);
    };
    window.wxSaveBlocks = async function(){
      const blocks=[];
      editorBlocks.querySelectorAll(".wx-ed-block").forEach((el)=>{
        if(el.classList.contains("wx-ed-img")){
          const b64=el.dataset.base64||""; if(b64) blocks.push({type:"image", content:b64});
        } else {
          const text=el.querySelector("textarea").value.trim(); if(text) blocks.push({type:"text", content:text});
        }
      });
      const res=await api("/api/admin/categories/"+slug+"/blocks","POST",{blocks});
      if(res.success){ toast("已保存"); location.search=""; } else { toast(res.message||"保存失败"); }
    };
  }
})();
</script>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc)}" />
<meta name="keywords" content="${escHtml(kw)}" />
<link rel="canonical" href="${escHtml(url)}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escHtml(title)}" />
<meta property="og:description" content="${escHtml(desc)}" />
<meta property="og:url" content="${escHtml(url)}" />
<meta property="og:image" content="${escHtml(SITE_DOMAIN + heroImg)}" />
${BAIDU_VERIFY}
<script type="application/ld+json">${jsonLd}</script>
${BAIDU_TONGJI}
<link rel="stylesheet" href="/styles.css" />
</head>
<body class="wx-body">
<div class="wx-topbar">
  <a class="wx-back" href="/" onclick="history.back();return false;">← 返回</a>
  <span class="wx-topbar-title">${escHtml(c.title)}</span>
  <a class="wx-close" href="/" aria-label="关闭">✕</a>
</div>
<span id="wxEditBadge" class="wx-edit-badge hidden">编辑模式</span>

<main class="wx-article">
  <h1 class="wx-title">${escHtml(c.title)}</h1>
  <p class="wx-subtitle">${escHtml(c.subtitle)}</p>

  <figure class="wx-hero">
    <img src="${escHtml(heroImg)}" alt="${escHtml(c.title)}" />
  </figure>

  <section class="wx-section">
    <div class="wx-lead">${introHtml || `<p>${escHtml(c.description)}</p>`}</div>
    <div class="wx-stats">${statsHtml}</div>
  </section>

  ${dynamicBlocks ? `<section class="wx-section wx-dynamic">${dynamicBlocks}</section>` : ""}

  <section class="wx-section">
    <h2>精选案例</h2>
    <div class="wx-cases">${featuredHtml}</div>
    ${moreHtml}
    <button id="wxAddCase" class="wx-add-case">+ 添加案例</button>
  </section>

  <section class="wx-section">
    <h2>作品图集</h2>
    <div class="wx-gallery">${galleryHtml}</div>
  </section>

  <section class="wx-section">
    <h2>服务流程</h2>
    <div class="wx-process">${processHtml}</div>
  </section>

  <section class="wx-section">
    <h2>常见问题</h2>
    <div class="wx-faq">${faqHtml}</div>
  </section>

  <section class="wx-cta">
    <h3>预约${escHtml(c.title)}顾问</h3>
    <p>留下需求，平台将在 1 个工作日内为您匹配资深设计师。</p>
    <a class="btn btn-gold btn-lg" href="/#contact">免费获取方案</a>
  </section>

  ${c.slug === "homestead" ? `<section class="wx-section" style="text-align:center">
    <h2>想先看农村别墅效果图？</h2>
    <p>我们整理了 12 套新中式、现代极简、欧式等风格的农村别墅效果图大全。</p>
    <a class="btn btn-gold" href="/nongcun-bieshu-xiaoguotu">浏览农村别墅效果图大全</a>
  </section>` : ""}

  <section class="wx-section">
    <h2>其他设计服务</h2>
    <div class="wx-links">
      ${CATEGORIES.filter((x) => x.slug !== c.slug).map((x) => `<a href="/category/${x.slug}">${escHtml(x.title)}</a>`).join("")}
    </div>
  </section>
</main>

<div id="wxEditor" class="wx-editor hidden">
  <div class="wx-editor-hd">微信公众号式编辑器</div>
  <div class="wx-editor-bar">
    <button onclick="wxAddText()">+ 文字</button>
    <button onclick="wxAddImage()">+ 图片</button>
    <button class="wx-editor-save" onclick="wxSaveBlocks()">保存并发布</button>
  </div>
  <div id="wxEditorBlocks" class="wx-editor-blocks"></div>
</div>

<footer class="wx-footer">© 2026 DD设计交易平台 · 本站为演示项目</footer>
${adminScript}

<script>
(function(){
  const zoomables = Array.from(document.querySelectorAll(".wx-zoomable[data-img]"))
    .filter(function(el){ return el.dataset.img; });
  if(!zoomables.length) return;
  const items = zoomables.map(function(el){ return el.dataset.img; });

  const lightbox = document.createElement("div");
  lightbox.className = "wx-lightbox hidden";
  lightbox.id = "wxLightbox";
  lightbox.innerHTML = '<button class="wx-lb-close" aria-label="关闭">✕</button><button class="wx-lb-prev" aria-label="上一张">‹</button><img class="wx-lb-img" alt=""><button class="wx-lb-next" aria-label="下一张">›</button><div class="wx-lb-counter"><span id="wxLbCurrent">1</span> / <span id="wxLbTotal">' + items.length + '</span></div>';
  document.body.appendChild(lightbox);

  const imgEl = lightbox.querySelector(".wx-lb-img");
  const curEl = document.getElementById("wxLbCurrent");
  let current = 0;
  function open(i){ current = i; update(); lightbox.classList.remove("hidden"); document.body.style.overflow = "hidden"; }
  function close(){ lightbox.classList.add("hidden"); document.body.style.overflow = ""; }
  function update(){ imgEl.src = items[current]; if(curEl) curEl.textContent = current + 1; }
  function prev(){ current = (current - 1 + items.length) % items.length; update(); }
  function next(){ current = (current + 1) % items.length; update(); }

  zoomables.forEach(function(el, i){
    el.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); open(i); });
  });
  lightbox.querySelector(".wx-lb-close").addEventListener("click", close);
  lightbox.querySelector(".wx-lb-prev").addEventListener("click", function(e){ e.stopPropagation(); prev(); });
  lightbox.querySelector(".wx-lb-next").addEventListener("click", function(e){ e.stopPropagation(); next(); });
  lightbox.addEventListener("click", function(e){ if(e.target === lightbox) close(); });
  document.addEventListener("keydown", function(e){
    if(lightbox.classList.contains("hidden")) return;
    if(e.key === "Escape") close();
    if(e.key === "ArrowLeft") prev();
    if(e.key === "ArrowRight") next();
  });
})();
</script>
</body>
</html>`;
}

// 设计作品展示页（作品筛选列表，复刻截图设计）
// ---------------------------------------------------------------------------
function renderWorksPage(slug) {
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (!c) return null;
  const projects = c.projects || [];
  const title = `${c.title}作品展示 | DD设计交易平台`;
  const desc = `精选${c.title}作品，每一个项目都经过精心设计，为业主节省大量设计费用。`;
  const url = SITE_DOMAIN + "/works/" + slug;

  const styles = ["全部风格", "新中式", "现代商务", "热带度假", "禅意东方", "轻奢现代", "江南水乡", "现代极简", "欧式", "田园", "滨海度假", "徽派新解", "精品度假", "商务现代"];
  const areas = ["全部面积", "200㎡以下", "200-500㎡", "500-1000㎡", "1000-3000㎡", "3000㎡以上"];

  const styleButtons = styles.map((s) => `<button class="${s === "全部风格" ? "active" : ""}" data-value="${s === "全部风格" ? "all" : s}">${escHtml(s)}</button>`).join("");
  const areaButtons = areas.map((a) => `<button class="${a === "全部面积" ? "active" : ""}" data-value="${a === "全部面积" ? "all" : a}">${escHtml(a)}</button>`).join("");

  const galleryImgs = (GALLERY_PNG[slug] && GALLERY_PNG[slug].length) ? GALLERY_PNG[slug] : (GALLERY_PNG.hotel && GALLERY_PNG.hotel.length ? GALLERY_PNG.hotel : [IMG_PNG[slug] || IMG_PNG.hotel]);
  function cardHtml(p, i) {
    const img = galleryImgs[i % galleryImgs.length];
    const tags = (p.tags || []).slice(0, 2);
    const rating = p.rating || 5;
    return `
    <a class="works-card" href="/works/${escHtml(c.slug)}/${escHtml(p.id)}" data-style="${escHtml(p.style || "")}" data-area="${escHtml(p.area || "")}" data-index="${i}">
      <div class="works-card-img">
        <img src="${escHtml(img)}" alt="${escHtml(p.title)}" loading="lazy" />
        <div class="works-card-tags">${tags.map((t) => `<span>${escHtml(t)}</span>`).join("")}</div>
        <div class="works-card-rating">★ ${escHtml(rating)}</div>
        <div class="works-card-save">${escHtml(p.savings || "")}</div>
      </div>
      <div class="works-card-body">
        <h3>${escHtml(p.title)}</h3>
        <p>${escHtml(p.description || "")}</p>
      </div>
    </a>`;
  }

  const cardsHtml = projects.map((p, i) => cardHtml(p, i)).join("");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "酒店设计作品展示",
    "description": desc,
    "url": url,
    "hasPart": projects.map((p, i) => ({
      "@type": "CreativeWork",
      "name": p.title,
      "description": p.description,
      "image": galleryImgs[i % galleryImgs.length],
    })),
  });

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc)}" />
<link rel="canonical" href="${escHtml(url)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escHtml(title)}" />
<meta property="og:description" content="${escHtml(desc)}" />
<meta property="og:url" content="${escHtml(url)}" />
${BAIDU_VERIFY}
<script type="application/ld+json">${jsonLd}</script>
${BAIDU_TONGJI}
<link rel="stylesheet" href="/styles.css" />
</head>
<body class="works-body">
<div class="works-topbar">
  <div class="container works-topbar-inner">
    <a class="works-topbar-back" href="/" title="返回主页"><span class="works-topbar-icon">⌂</span><span>返回主页</span></a>
    <a class="works-topbar-exit" href="/" title="退出">退出 ✕</a>
  </div>
</div>
<div class="works-catnav">
  <div class="container works-catnav-inner">
    <a class="works-catnav-home" href="/">主页</a>
    ${CATEGORIES.map((x) => `<a class="works-catnav-pill ${x.slug === slug ? "active" : ""}" href="/works/${escHtml(x.slug)}">${escHtml(x.title)}</a>`).join("")}
  </div>
</div>
<header class="works-header">
  <div class="container works-header-inner">
    <div class="works-header-text">
      <div class="works-kicker">精选作品</div>
      <h1>${escHtml(c.title)}作品展示</h1>
      <p>每一个项目都经过精心设计，为业主节省大量设计费用</p>
    </div>
    <a class="works-cta-btn" href="/#contact">我也要抢单</a>
  </div>
</header>

<main class="works-main container">
  <section class="works-filter">
    <h3>筛选条件</h3>
    <div class="filter-row">
      <span class="filter-label">设计风格</span>
      <div class="filter-tags" data-filter="style">${styleButtons}</div>
    </div>
    <div class="filter-row">
      <span class="filter-label">项目面积</span>
      <div class="filter-tags" data-filter="area">${areaButtons}</div>
    </div>
  </section>

  <div class="works-count">共 <strong id="worksCount">${projects.length}</strong> 个作品</div>

  <div class="works-grid" id="worksGrid">${cardsHtml}</div>
</main>

<footer class="works-footer"><div class="container">© 2026 DD设计交易平台 · 本站为演示项目</div></footer>

<script>
(function(){
  function parseArea(s){
    const m = String(s).replace(/,/g,"").match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }
  function matchesArea(card, val){
    if (val === "all") return true;
    const v = parseArea(card.dataset.area);
    if (val === "200㎡以下") return v > 0 && v < 200;
    if (val === "200-500㎡") return v >= 200 && v <= 500;
    if (val === "500-1000㎡") return v > 500 && v <= 1000;
    if (val === "1000-3000㎡") return v > 1000 && v <= 3000;
    if (val === "3000㎡以上") return v > 3000;
    return true;
  }
  const state = { style: "all", area: "all" };
  function apply(){
    let n = 0;
    document.querySelectorAll(".works-card").forEach((card)=>{
      const okStyle = state.style === "all" || card.dataset.style === state.style;
      const okArea = matchesArea(card, state.area);
      const show = okStyle && okArea;
      card.style.display = show ? "" : "none";
      if (show) n++;
    });
    document.getElementById("worksCount").textContent = n;
  }
  document.querySelectorAll(".filter-tags").forEach((group)=>{
    const key = group.dataset.filter;
    group.addEventListener("click", (e)=>{
      const btn = e.target.closest("button");
      if (!btn) return;
      group.querySelectorAll("button").forEach((b)=>b.classList.remove("active"));
      btn.classList.add("active");
      state[key] = btn.dataset.value;
      apply();
    });
  });
})();
</script>
</body>
</html>`;
}

// 作品详情页（服务端渲染，可点击浏览单个作品）
// ---------------------------------------------------------------------------
function renderWorkDetailPage(slug, workId) {
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (!c) return null;
  const extra = data.extraCases[slug] || [];
  const allProjects = (c.projects || []).concat(extra);
  const idx = allProjects.findIndex((p) => p.id === workId);
  if (idx === -1) return null;
  const p = allProjects[idx];

  const galleryImgs = (GALLERY_PNG[slug] && GALLERY_PNG[slug].length)
    ? GALLERY_PNG[slug]
    : (GALLERY_PNG.hotel && GALLERY_PNG.hotel.length ? GALLERY_PNG.hotel : [IMG_PNG[slug] || IMG_PNG.hotel]);
  const heroImg = galleryImgs[idx % galleryImgs.length];

  const title = `${p.title} | ${c.title}作品 | DD设计交易平台`;
  const desc = `${p.description || ""}`.slice(0, 120) + "…";
  const url = `${SITE_DOMAIN}/works/${slug}/${workId}`;
  const tags = (p.tags || []).map((t) => escHtml(t));
  const rating = p.rating || 5;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": p.title,
    "description": p.description,
    "image": heroImg,
    "url": url,
    "genre": p.style,
    "creator": { "@type": "Organization", "name": "DD设计交易平台" },
  });

  // 设计说明：优先使用管理员保存的内容；否则用服务端默认文案，确保百度抓取到原创文字
  const savedNotes = (data.workNotes[slug] && data.workNotes[slug][workId]) || [];
  const defaultNotes = [
    { id: `${slug}-${workId}-note-1`, text: `设计说明：${p.title}位于${p.location || "待定地点"}，建筑面积约${p.area || "待定"}，整体以${p.style || "定制"}风格为主轴。设计师从空间尺度、动线逻辑、材质光影三个维度切入，营造出兼具实用性与艺术感的场所体验。` },
    { id: `${slug}-${workId}-note-2`, text: `项目亮点：通过DD设计交易平台直连资深${c.title}设计师，业主在方案阶段即可充分沟通生活方式与审美偏好；设计周期${p.duration || "按项目定制"}，在把控落地效果的同时，较传统模式${p.savings ? `节省约${String(p.savings).replace(/节省/, "").trim()}` : "节省可观的设计成本"}。` },
  ];
  const notes = savedNotes.length ? savedNotes : defaultNotes;
  const notesHtml = notes.map((n) => `
    <p class="wd-note-item" data-id="${escHtml(n.id)}">
      <span class="wd-note-text" contenteditable="false">${escHtml(n.text)}</span>
      <button class="wd-note-del hidden" type="button" data-action="del" aria-label="删除">🗑</button>
    </p>`).join("");

  const galleryList = galleryImgs.slice(0, 6);
  const galleryHtml = galleryList.map((src, i) => `
    <figure class="wd-gallery-item" data-index="${i}">
      <img src="${escHtml(src)}" alt="${escHtml(p.title)}作品图${i + 1}" loading="lazy" />
    </figure>`).join("");

  const lightboxScript = `
<script>
(function(){
  const items = ${JSON.stringify(galleryList)};
  const lightbox = document.createElement("div");
  lightbox.className = "wd-lightbox hidden";
  lightbox.id = "wdLightbox";
  lightbox.innerHTML = '<button class="wd-lb-close" aria-label="关闭">✕</button><button class="wd-lb-prev" aria-label="上一张">‹</button><img class="wd-lb-img" alt=""><button class="wd-lb-next" aria-label="下一张">›</button><div class="wd-lb-counter"><span id="wdLbCurrent">1</span> / <span id="wdLbTotal">' + items.length + '</span></div>';
  document.body.appendChild(lightbox);
  const imgEl = lightbox.querySelector(".wd-lb-img");
  const curEl = document.getElementById("wdLbCurrent");
  let current = 0;
  function open(i){ current = i; update(); lightbox.classList.remove("hidden"); document.body.style.overflow = "hidden"; }
  function close(){ lightbox.classList.add("hidden"); document.body.style.overflow = ""; }
  function update(){ imgEl.src = items[current]; if(curEl) curEl.textContent = current + 1; }
  function prev(){ current = (current - 1 + items.length) % items.length; update(); }
  function next(){ current = (current + 1) % items.length; update(); }
  document.querySelectorAll(".wd-gallery-item").forEach(function(el){ el.addEventListener("click", function(){ open(parseInt(el.dataset.index||0)); }); });
  lightbox.querySelector(".wd-lb-close").addEventListener("click", close);
  lightbox.querySelector(".wd-lb-prev").addEventListener("click", function(e){ e.stopPropagation(); prev(); });
  lightbox.querySelector(".wd-lb-next").addEventListener("click", function(e){ e.stopPropagation(); next(); });
  lightbox.addEventListener("click", function(e){ if(e.target === lightbox) close(); });
  document.addEventListener("keydown", function(e){ if(lightbox.classList.contains("hidden")) return; if(e.key === "Escape") close(); if(e.key === "ArrowLeft") prev(); if(e.key === "ArrowRight") next(); });
})();
</script>`;

  const notesScript = `
<script>
(function(){
  const wrap = document.getElementById("wdDesignNotes");
  if(!wrap) return;
  const slug = wrap.dataset.slug;
  const workId = wrap.dataset.id;
  const adminBar = document.getElementById("wdNotesAdmin");
  const tip = document.getElementById("wdNotesTip");
  const body = document.getElementById("wdNotesBody");
  const token = localStorage.getItem("admin_token");
  if(token){
    adminBar.classList.remove("hidden");
    tip.textContent = "管理员模式：点击段落可直接编辑，点击 🗑 删除，保存后刷新生效。";
    body.querySelectorAll(".wd-note-text").forEach(function(el){ el.contentEditable = "true"; });
    body.querySelectorAll(".wd-note-del").forEach(function(el){ el.classList.remove("hidden"); });
  }
  body.addEventListener("click", function(e){
    const btn = e.target.closest("button");
    if(!btn) return;
    if(btn.dataset.action === "del"){
      const item = btn.closest(".wd-note-item");
      if(item) item.remove();
      return;
    }
  });
  adminBar.addEventListener("click", function(e){
    const btn = e.target.closest("button");
    if(!btn) return;
    const action = btn.dataset.action;
    if(action === "add"){
      const p = document.createElement("p");
      p.className = "wd-note-item";
      p.dataset.id = "new-" + Date.now();
      p.innerHTML = '<span class="wd-note-text" contenteditable="true">请输入设计说明，支持多段落...</span><button class="wd-note-del" data-action="del" type="button" aria-label="删除">🗑</button>';
      body.appendChild(p);
      p.querySelector(".wd-note-text").focus();
      return;
    }
    if(action === "save"){
      const notes = Array.from(body.querySelectorAll(".wd-note-item")).map(function(el, idx){
        return { id: el.dataset.id || ("new-" + idx), text: el.querySelector(".wd-note-text").innerText.trim() };
      }).filter(function(n){ return n.text; });
      fetch("/api/admin/works/" + slug + "/" + workId + "/description", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ notes: notes })
      }).then(function(r){ return r.json(); }).then(function(res){
        if(res.success){
          tip.textContent = "保存成功，刷新页面后生效。";
          setTimeout(function(){ location.reload(); }, 600);
        } else {
          alert("保存失败：" + (res.message || ""));
        }
      }).catch(function(err){ alert("保存失败：" + err.message); });
      return;
    }
    if(action === "done"){
      adminBar.classList.add("hidden");
      body.querySelectorAll(".wd-note-text").forEach(function(el){ el.contentEditable = "false"; });
      body.querySelectorAll(".wd-note-del").forEach(function(el){ el.classList.add("hidden"); });
      tip.textContent = "管理员登录后可在此增删改设计说明。";
    }
  });
})();
</script>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc)}" />
<link rel="canonical" href="${escHtml(url)}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escHtml(title)}" />
<meta property="og:description" content="${escHtml(desc)}" />
<meta property="og:url" content="${escHtml(url)}" />
<meta property="og:image" content="${escHtml(SITE_DOMAIN + heroImg)}" />
${BAIDU_VERIFY}
<script type="application/ld+json">${jsonLd}</script>
${BAIDU_TONGJI}
<link rel="stylesheet" href="/styles.css" />
</head>
<body class="works-body">
<div class="works-topbar">
  <div class="container works-topbar-inner">
    <a class="works-topbar-back" href="/" title="返回主页"><span class="works-topbar-icon">⌂</span><span>返回主页</span></a>
    <a class="works-topbar-exit" href="/" title="退出">退出 ✕</a>
  </div>
</div>
<div class="works-catnav">
  <div class="container works-catnav-inner">
    <a class="works-catnav-home" href="/">主页</a>
    ${CATEGORIES.map((x) => `<a class="works-catnav-pill ${x.slug === slug ? "active" : ""}" href="/works/${escHtml(x.slug)}">${escHtml(x.title)}</a>`).join("")}
  </div>
</div>

<main class="container work-detail">
  <nav class="wd-breadcrumb">
    <a href="/">首页</a>
    <span>/</span>
    <a href="/works/${escHtml(c.slug)}">${escHtml(c.title)}作品</a>
    <span>/</span>
    <span>${escHtml(p.title)}</span>
  </nav>

  <header class="wd-header">
    <div class="wd-left-col">
      <div class="wd-hero">
        <img src="${escHtml(heroImg)}" alt="${escHtml(p.title)}" />
      </div>
      <section class="wd-design-notes" id="wdDesignNotes" data-slug="${escHtml(slug)}" data-id="${escHtml(workId)}">
        <div class="wd-notes-header">
          <h2>设计说明</h2>
          <div class="wd-notes-adminbar hidden" id="wdNotesAdmin">
            <button class="wd-notes-btn" type="button" data-action="add">+ 添加段落</button>
            <button class="wd-notes-btn primary" type="button" data-action="save">保存</button>
            <button class="wd-notes-btn" type="button" data-action="done">完成</button>
          </div>
        </div>
        <div class="wd-notes-body" id="wdNotesBody">${notesHtml}</div>
        <p class="wd-notes-tip" id="wdNotesTip">管理员登录后可在此增删改设计说明。</p>
      </section>
    </div>
    <div class="wd-info">
      <div class="wd-tags">
        ${tags.map((t) => `<span>${t}</span>`).join("")}
        <span class="wd-rating">★ ${escHtml(rating)}</span>
      </div>
      <h1>${escHtml(p.title)}</h1>
      <p class="wd-desc">${escHtml(p.description || "")}</p>
      <ul class="wd-meta">
        <li><strong>项目地点</strong><span>${escHtml(p.location || "")}</span></li>
        <li><strong>项目面积</strong><span>${escHtml(p.area || "")}</span></li>
        <li><strong>设计风格</strong><span>${escHtml(p.style || "")}</span></li>
        <li><strong>主案设计师</strong><span>${escHtml(p.designer || "")}</span></li>
        <li><strong>设计周期</strong><span>${escHtml(p.duration || "")}</span></li>
        <li><strong>设计费用</strong><span>${escHtml(p.budget || "")}</span></li>
        <li><strong>平台节省</strong><span class="wd-save">${escHtml(p.savings || "")}</span></li>
      </ul>
      <a class="works-cta-btn" href="/#contact">我也要这样的设计</a>
    </div>
  </header>

  <section class="wd-gallery-section">
    <h2>作品图集</h2>
    <div class="wd-gallery">${galleryHtml}</div>
  </section>
</main>

<footer class="works-footer"><div class="container">© 2026 DD设计交易平台 · 本站为演示项目</div></footer>
${lightboxScript}
${notesScript}
</body>
</html>`;
}

// 农村别墅效果图 专题图集（服务端渲染，精准捕捉百度词）
// ---------------------------------------------------------------------------
const GALLERY = {
  slug: "nongcun-bieshu-xiaoguotu",
  title: "农村别墅效果图_自建房设计效果图_乡村别墅图纸大全 | DD设计交易平台",
  keywords: "农村别墅效果图,农村自建房设计效果图,农村别墅图纸,乡村别墅效果图,农村建房设计图,二层农村别墅效果图,三层农村别墅效果图,新中式农村别墅,欧式农村别墅,自建房效果图,农村小别墅设计图,农村别墅外观效果图",
  description: "精选农村别墅效果图大全，涵盖新中式、现代极简、欧式、田园合院等多种风格，附自建房设计图纸与报建要点。DD设计交易平台提供农村别墅、自建房一站式设计，平均节省12万设计费。",
};

function renderGalleryPage() {
  const url = SITE_DOMAIN + "/" + GALLERY.slug;
  const title = GALLERY.title;
  const desc = GALLERY.description;
  const kw = GALLERY.keywords;

  const introHtml = [
    "回乡建一栋体面的农村别墅，是无数家庭的心愿。但在动工之前，先看懂「农村别墅效果图」，能帮您和家人统一审美、减少返工、避免与施工队反复扯皮。效果图不是炫技，而是把脑中的家，提前变成能反复确认的图纸。",
    "DD设计交易平台的农村别墅效果图，覆盖新中式、现代极简、欧式、田园合院、滨海度假、徽派新解等主流风格。每一张都配套可施工的施工图与报建图，让「好看」真正落地为「能盖」。平台直连擅长自建房的别墅设计师，设计费平均节省12万。",
  ].map((t) => `<p>${escHtml(t)}</p>`).join("");

  const styles = [
    { name: "新中式农村别墅效果图", img: "/images/home-1.svg", desc: "白墙黛瓦、坡屋顶、院落感，新中式农村别墅把传统东方美学与现代居住结合，是返乡建房最稳妥也最有面子的选择。", items: ["云栖·新中式农村别墅", "白墙黛瓦 · 380㎡ · 新中式"] },
    { name: "现代极简农村别墅效果图", img: "/images/home-2.svg", desc: "大开窗、干净线条、造价可控，现代极简自建房深受年轻业主喜爱，用最少的元素做出高级感。", items: ["现代·极简自建房", "大开窗 · 320㎡ · 现代极简"] },
    { name: "欧式乡村别墅效果图", img: "/images/home-3.svg", desc: "坡屋顶、拱窗、双拼布局，欧式乡村别墅凸显地域气质，适合追求气派的业主。", items: ["欧韵·乡村双拼别墅", "坡屋顶 · 460㎡ · 欧式"] },
    { name: "田园合院一层农村别墅效果图", img: "/images/home-4.svg", desc: "围合庭院、一层布局，田园合院自建房安全便利、老人居住友好，是养老房的热门方案。", items: ["田园·一层合院自建房", "围合庭院 · 260㎡ · 田园合院"] },
    { name: "滨海度假农村别墅效果图", img: "/images/home-5.svg", desc: "露台、通透立面、最大化景观视野，滨海度假自建宅把海景资源用到极致。", items: ["滨海·度假自建宅", "露台 · 350㎡ · 滨海现代"] },
    { name: "徽派乡村自建房效果图", img: "/images/home-6.svg", desc: "马头墙意象现代演绎，可自住可经营，徽派新解乡村自建房兼顾接待与居住。", items: ["民宿化·乡村自建房", "马头墙 · 420㎡ · 徽派新解"] },
  ];
  const stylesHtml = styles.map((s) => `
    <div class="gallery-style">
      <div class="gallery-style-img" style="background-image:url('${escHtml(gimg(s.img))}'), linear-gradient(135deg,#f6eed9,#d6b271)">
        <div class="work-img-cap"><span class="wic-cat">风格图集</span><span class="wic-title">${escHtml(s.name)}</span></div>
      </div>
      <div class="gallery-style-body">
        <h3>${escHtml(s.name)}</h3>
        <p>${escHtml(s.desc)}</p>
        <ul class="gallery-style-tags"><li>${escHtml(s.items[0])}</li><li>${escHtml(s.items[1])}</li></ul>
      </div>
    </div>`).join("");

  const galleryItems = [
    { t: "新中式农村别墅效果图", s: "新中式", a: "380㎡", img: "/images/home-1.svg" },
    { t: "现代极简自建房效果图", s: "现代极简", a: "320㎡", img: "/images/home-2.svg" },
    { t: "欧式乡村别墅效果图", s: "欧式", a: "460㎡", img: "/images/home-3.svg" },
    { t: "田园合院一层别墅效果图", s: "田园合院", a: "260㎡", img: "/images/home-4.svg" },
    { t: "滨海度假自建宅效果图", s: "滨海现代", a: "350㎡", img: "/images/home-5.svg" },
    { t: "徽派乡村自建房效果图", s: "徽派新解", a: "420㎡", img: "/images/home-6.svg" },
    { t: "二层农村别墅效果图", s: "二层独栋", a: "300㎡", img: "/images/villa.svg" },
    { t: "三层农村别墅效果图", s: "三层独栋", a: "420㎡", img: "/images/villa.svg" },
    { t: "双拼农村别墅效果图", s: "双拼", a: "460㎡", img: "/images/home-3.svg" },
    { t: "农村别墅外观效果图", s: "外观", a: "380㎡", img: "/images/home-1.svg" },
    { t: "农村小别墅效果图", s: "小别墅", a: "260㎡", img: "/images/home-4.svg" },
    { t: "乡村豪华别墅效果图", s: "豪华", a: "450㎡", img: "/images/home-5.svg" },
  ];
  const gridHtml = galleryItems.map((g) => `
    <div class="work-card">
      <div class="work-img" style="background-image:url('${escHtml(gimg(g.img))}'), linear-gradient(135deg,#f6eed9,#d6b271)">
        <div class="work-img-cap"><span class="wic-cat">${escHtml(g.s)}</span><span class="wic-title">${escHtml(g.t)}</span></div>
      </div>
      <div class="work-body">
        <h4>${escHtml(g.t)}</h4>
        <div class="loc">${escHtml(g.a)} · ${escHtml(g.s)}</div>
      </div>
    </div>`).join("");

  const faqHtml = [
    { q: "农村别墅效果图一般包含哪些图？", a: "完整的效果图通常包含外观效果图、各层平面布置图、重点空间（客厅/堂屋/主卧）效果图，以及庭院景观示意，帮您提前看见建成样子。" },
    { q: "二层、三层农村别墅怎么选？", a: "地块小、家庭人口多建议三层；重视庭院与老人便利可选二层或一层合院。我们会在需求阶段结合地块与人口给出建议。" },
    { q: "效果图能直接拿去报建吗？", a: "效果图用于确认外观与意向，报建需另出总平图、立面图与简要结构图，DD平台的自建房设计包含报建图，一站式交付。" },
    { q: "农村施工队能按效果图施工吗？", a: "可以。我们以清晰、可施工的施工图配合效果图，并在关键节点答疑，降低施工队理解成本。" },
    { q: "做一套农村别墅效果图多少钱？", a: "自建房设计费通常3万-30万，含效果图、施工图与报建图，平台平均可节省12万。" },
  ].map((f) => `
    <div class="faq-item"><h4>问：${escHtml(f.q)}</h4><p>答：${escHtml(f.a)}</p></div>`).join("");

  const links = [
    { t: "自建房设计（农村别墅）", u: "/category/homestead" },
    { t: "别墅与住宅设计", u: "/category/residential" },
    { t: "园林庭院设计", u: "/category/garden" },
    { t: "灯光设计", u: "/category/lighting" },
    { t: "民宿设计", u: "/category/minsu" },
  ].map((l) => `<a href="${escHtml(l.u)}">${escHtml(l.t)}</a>`).join("");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": "农村别墅效果图大全",
    "description": desc,
    "url": url,
    "provider": { "@type": "Organization", "name": "DD设计交易平台", "url": SITE_DOMAIN },
  });

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc)}" />
<meta name="keywords" content="${escHtml(kw)}" />
<link rel="canonical" href="${escHtml(url)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escHtml(title)}" />
<meta property="og:description" content="${escHtml(desc)}" />
<meta property="og:url" content="${escHtml(url)}" />
${BAIDU_VERIFY}
<script type="application/ld+json">${jsonLd}</script>
${BAIDU_TONGJI}
<link rel="stylesheet" href="/styles.css" />
</head>
<body>
<header class="cat-head">
  <div class="container cat-head-inner">
    <a class="brand" href="/"><span class="brand-mark">DD</span><span class="brand-text">设计交易平台</span></a>
    <nav class="cat-nav">
      <a href="/">首页</a>
      <a href="/category/homestead">自建房设计</a>
      <a href="/nongcun-bieshu-xiaoguotu">农村别墅效果图</a>
      <a href="/category/residential">别墅设计</a>
      <a href="/category/garden">庭院设计</a>
    </nav>
  </div>
</header>
<main>
  <section class="cat-hero" style="background-image:url('${IMG_PNG.homestead}'), linear-gradient(180deg, rgba(20,16,10,.55), rgba(20,16,10,.78))">
    <div class="cat-hero-ov"></div>
    <div class="container cat-hero-in">
      <p class="kicker">RURAL VILLA RENDERINGS</p>
      <h1>农村别墅效果图大全</h1>
      <p class="cat-sub">新中式 · 现代极简 · 欧式 · 田园合院 · 滨海度假 · 徽派 —— 先看清样子，再安心盖房</p>
    </div>
  </section>

  <section class="section"><div class="container">
    <div class="section-head"><p class="kicker">ABOUT</p><h2>为什么先看农村别墅效果图</h2></div>
    <div class="cat-intro">${introHtml}</div>
  </div></section>

  <section class="section section-alt"><div class="container">
    <div class="section-head"><p class="kicker">STYLES</p><h2>各风格农村别墅效果图</h2><p class="section-desc">按风格挑，找到最适合您家的那一款。</p></div>
    <div class="gallery-styles">${stylesHtml}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="section-head"><p class="kicker">GALLERY</p><h2>农村别墅效果图大全（12套）</h2><p class="section-desc">涵盖二层、三层、双拼、小别墅等多种户型。</p></div>
    <div class="grid works-grid">${gridHtml}</div>
  </div></section>

  <section class="section section-alt"><div class="container">
    <div class="section-head"><p class="kicker">FAQ</p><h2>农村别墅效果图常见问题</h2></div>
    <div class="faq-list">${faqHtml}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="section-head"><p class="kicker">LINKS</p><h2>相关设计服务</h2></div>
    <div class="cat-links">${links}</div>
  </div></section>

  <section class="section section-dark"><div class="container cat-cta">
    <h2>获取您的农村别墅效果图</h2>
    <p>留下地块尺寸与预算，资深别墅设计师 1 个工作日内为您出专属效果图与报价。</p>
    <a class="btn btn-gold btn-lg" href="/#contact">免费获取方案</a>
  </div></section>
</main>
<footer class="footer"><div class="container footer-inner">
  <div class="footer-brand"><span class="brand-mark">DD</span><p>DD设计交易平台 —— 共享顶级设计师资源，让好设计触手可及。</p></div>
</div><div class="footer-bottom">© 2026 DD设计交易平台 · 本站为演示项目，数据仅存于本地</div></footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 业务处理
// ---------------------------------------------------------------------------
async function handleApi(req, res, pathname) {
  const method = req.method;

  // 健康检查
  if (pathname === "/api/health" && method === "GET") {
    return sendJSON(res, 200, { success: true, data: { status: "ok" } });
  }

  // 发送验证码
  if (pathname === "/api/auth/send-code" && method === "POST") {
    const body = await readBody(req);
    const phone = String(body.phone || "").trim();
    if (!PHONE_RE.test(phone)) {
      return sendJSON(res, 400, { success: false, message: "手机号格式不正确" });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    data.codes[phone] = { code, expires: Date.now() + 5 * 60 * 1000 };
    saveData();
    // 演示环境直接把验证码返回给前端，方便测试；生产环境应通过短信下发
    return sendJSON(res, 200, {
      success: true,
      message: "验证码已发送",
      data: { code, dev: true },
    });
  }

  // 注册
  if (pathname === "/api/auth/register" && method === "POST") {
    const body = await readBody(req);
    const phone = String(body.phone || "").trim();
    const code = String(body.code || "").trim();
    const password = String(body.password || "");
    const name = String(body.name || "").trim() || "用户" + phone.slice(-4);
    if (!PHONE_RE.test(phone)) {
      return sendJSON(res, 400, { success: false, message: "手机号格式不正确" });
    }
    if (code.length !== 6) {
      return sendJSON(res, 400, { success: false, message: "请输入 6 位验证码" });
    }
    if (password.length < 6) {
      return sendJSON(res, 400, { success: false, message: "密码至少 6 位" });
    }
    const rec = data.codes[phone];
    if (!rec || rec.code !== code || rec.expires < Date.now()) {
      return sendJSON(res, 400, { success: false, message: "验证码错误或已过期" });
    }
    if (data.users.some((u) => u.phone === phone)) {
      return sendJSON(res, 400, { success: false, message: "该手机号已注册，请直接登录" });
    }
    const user = {
      id: crypto.randomUUID(),
      phone,
      name,
      password: hashPwd(password),
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    delete data.codes[phone];
    saveData();
    const token = issueToken("user", user.id);
    return sendJSON(res, 200, {
      success: true,
      message: "注册成功",
      data: { token, user: { id: user.id, phone: user.phone, name: user.name } },
    });
  }

  // 登录
  if (pathname === "/api/auth/login" && method === "POST") {
    const body = await readBody(req);
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    const user = data.users.find((u) => u.phone === phone);
    if (!user || user.password !== hashPwd(password)) {
      return sendJSON(res, 401, { success: false, message: "手机号或密码错误" });
    }
    const token = issueToken("user", user.id);
    return sendJSON(res, 200, {
      success: true,
      message: "登录成功",
      data: { token, user: { id: user.id, phone: user.phone, name: user.name } },
    });
  }

  // 联系/预约表单
  if (pathname === "/api/contact" && method === "POST") {
    const body = await readBody(req);
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const message = String(body.message || "").trim();
    if (!name || !phone || !message) {
      return sendJSON(res, 400, { success: false, message: "请填写姓名、电话和留言" });
    }
    data.contacts.push({
      id: crypto.randomUUID(),
      name,
      phone,
      message,
      createdAt: new Date().toISOString(),
    });
    saveData();
    return sendJSON(res, 200, { success: true, message: "提交成功，我们会尽快与您联系" });
  }

  // 管理员登录
  if (pathname === "/api/admin/login" && method === "POST") {
    const body = await readBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    if (username !== DEFAULT_ADMIN.username || password !== DEFAULT_ADMIN.password) {
      return sendJSON(res, 401, { success: false, message: "管理员账号或密码错误" });
    }
    const token = issueToken("admin", "admin");
    return sendJSON(res, 200, {
      success: true,
      message: "管理员登录成功",
      data: { token },
    });
  }

  // 视频列表（公开）
  if (pathname === "/api/videos" && method === "GET") {
    const list = [...data.videos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return sendJSON(res, 200, { success: true, data: { videos: list } });
  }

  // 新增视频（需管理员）
  if (pathname === "/api/videos" && method === "POST") {
    const auth = getToken(req);
    if (!auth || auth.type !== "admin") {
      return sendJSON(res, 401, { success: false, message: "需要管理员登录" });
    }
    const body = await readBody(req);
    const title = String(body.title || "").trim();
    const url = String(body.url || "").trim();
    const cover = String(body.cover || "").trim();
    if (!title || !url) {
      return sendJSON(res, 400, { success: false, message: "标题和视频链接必填" });
    }
    const video = {
      id: crypto.randomUUID(),
      title,
      url,
      cover: cover || "",
      createdAt: new Date().toISOString(),
    };
    data.videos.push(video);
    saveData();
    return sendJSON(res, 200, { success: true, message: "视频已添加", data: { video } });
  }

  // 删除视频（需管理员）
  if (pathname.startsWith("/api/videos/") && method === "DELETE") {
    const auth = getToken(req);
    if (!auth || auth.type !== "admin") {
      return sendJSON(res, 401, { success: false, message: "需要管理员登录" });
    }
    const id = pathname.split("/").pop();
    const idx = data.videos.findIndex((v) => v.id === id);
    if (idx === -1) {
      return sendJSON(res, 404, { success: false, message: "视频不存在" });
    }
    const [removed] = data.videos.splice(idx, 1);
    saveData();
    return sendJSON(res, 200, { success: true, message: "已删除", data: { id: removed.id } });
  }

  // ---------------------------------------------------------------------------
  // 分类案例管理（需管理员）—— 复刻微信公众号添加图文
  // ---------------------------------------------------------------------------

  // 添加案例
  const caseMatch = pathname.match(/^\/api\/admin\/categories\/([\w-]+)\/cases$/);
  if (caseMatch && method === "POST") {
    const auth = getToken(req);
    if (!auth || auth.type !== "admin") {
      return sendJSON(res, 401, { success: false, message: "需要管理员登录" });
    }
    const slug = safeSlug(caseMatch[1]);
    const c = CATEGORIES.find((x) => x.slug === slug);
    if (!c) return sendJSON(res, 404, { success: false, message: "分类不存在" });
    const body = await readBody(req);
    const title = String(body.title || "").trim();
    if (!title) return sendJSON(res, 400, { success: false, message: "案例名称必填" });
    const item = {
      id: crypto.randomUUID(),
      title,
      location: String(body.location || "").trim(),
      area: String(body.area || "").trim(),
      style: String(body.style || "").trim(),
      budget: String(body.budget || "").trim(),
      savings: String(body.savings || "").trim(),
      duration: String(body.duration || "").trim(),
      description: String(body.description || "").trim(),
      image: String(body.image || "").trim() || (IMG_PNG[slug] || IMG_PNG.hotel),
      createdAt: new Date().toISOString(),
    };
    data.extraCases[slug] = data.extraCases[slug] || [];
    data.extraCases[slug].push(item);
    saveData();
    return sendJSON(res, 200, { success: true, message: "案例已添加", data: { item } });
  }

  // 删除案例
  const caseDelMatch = pathname.match(/^\/api\/admin\/categories\/([\w-]+)\/cases\/([\w-]+)$/);
  if (caseDelMatch && method === "DELETE") {
    const auth = getToken(req);
    if (!auth || auth.type !== "admin") {
      return sendJSON(res, 401, { success: false, message: "需要管理员登录" });
    }
    const slug = safeSlug(caseDelMatch[1]);
    const id = caseDelMatch[2];
    const list = data.extraCases[slug] || [];
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return sendJSON(res, 404, { success: false, message: "案例不存在" });
    const [removed] = list.splice(idx, 1);
    saveData();
    return sendJSON(res, 200, { success: true, message: "已删除", data: { id: removed.id } });
  }

  // 保存分类图文块（文字 + 图片，类微信公众号编辑器）
  const blocksMatch = pathname.match(/^\/api\/admin\/categories\/([\w-]+)\/blocks$/);
  if (blocksMatch && method === "POST") {
    const auth = getToken(req);
    if (!auth || auth.type !== "admin") {
      return sendJSON(res, 401, { success: false, message: "需要管理员登录" });
    }
    const slug = safeSlug(blocksMatch[1]);
    const c = CATEGORIES.find((x) => x.slug === slug);
    if (!c) return sendJSON(res, 404, { success: false, message: "分类不存在" });
    const body = await readBody(req, 10 * 1024 * 1024);
    const blocks = Array.isArray(body.blocks) ? body.blocks : [];
    const normalized = [];
    for (const b of blocks) {
      const type = b.type === "image" ? "image" : "text";
      if (type === "image") {
        try {
          const src = saveBase64Image(String(b.content || ""), slug);
          normalized.push({ type: "image", content: src, id: crypto.randomUUID() });
        } catch (e) {
          return sendJSON(res, 400, { success: false, message: e.message });
        }
      } else {
        const text = String(b.content || "").trim();
        if (text) normalized.push({ type: "text", content: text, id: crypto.randomUUID() });
      }
    }
    data.categoryBlocks[slug] = normalized;
    saveData();
    return sendJSON(res, 200, { success: true, message: "已保存", data: { blocks: normalized } });
  }

  // 通用图片上传（base64，类微信公众号插入图片）
  if (pathname === "/api/admin/upload" && method === "POST") {
    const auth = getToken(req);
    if (!auth || auth.type !== "admin") {
      return sendJSON(res, 401, { success: false, message: "需要管理员登录" });
    }
    const body = await readBody(req, 10 * 1024 * 1024);
    try {
      const src = saveBase64Image(String(body.image || ""), "upload");
      return sendJSON(res, 200, { success: true, message: "上传成功", data: { src } });
    } catch (e) {
      return sendJSON(res, 400, { success: false, message: e.message });
    }
  }

  // 作品详情「设计说明」编辑保存（需管理员）
  const notesMatch = pathname.match(/^\/api\/admin\/works\/([\w-]+)\/([a-zA-Z0-9-]+)\/description$/);
  if (notesMatch && method === "POST") {
    const auth = getToken(req);
    if (!auth || auth.type !== "admin") {
      return sendJSON(res, 401, { success: false, message: "需要管理员登录" });
    }
    const slug = safeSlug(notesMatch[1]);
    const workId = notesMatch[2];
    const c = CATEGORIES.find((x) => x.slug === slug);
    if (!c) return sendJSON(res, 404, { success: false, message: "分类不存在" });
    const body = await readBody(req);
    const raw = Array.isArray(body.notes) ? body.notes : [];
    const normalized = [];
    for (const n of raw) {
      const text = String(n.text || "").trim();
      if (text) normalized.push({ id: String(n.id || "").trim() || crypto.randomUUID(), text });
    }
    data.workNotes[slug] = data.workNotes[slug] || {};
    data.workNotes[slug][workId] = normalized;
    saveData();
    return sendJSON(res, 200, { success: true, message: "设计说明已保存", data: { notes: normalized } });
  }

  // 未匹配到的 API → 明确 404（避免返回 HTML 被前端当 JSON 解析，掩盖真实错误）
  return sendJSON(res, 404, { success: false, message: `接口不存在：${method} ${pathname}` });
}

// ---------------------------------------------------------------------------
// 静态文件服务（带路径穿越防护）
// ---------------------------------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

function serveStatic(req, res, pathname) {
  // 默认首页
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";

  // 规范化并阻止路径穿越
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // 找不到文件时回退到首页（支持前端路由刷新）
      const indexPath = path.join(PUBLIC_DIR, "index.html");
      fs.readFile(indexPath, (e2, buf) => {
        if (e2) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          return res.end("404 Not Found");
        }
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(buf);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  // 允许同源/跨域（开发期便利，同源下也无害）
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // 基础安全响应头（提升站点信任度，对百度收录友好）
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsed.pathname;

  try {
    // 农村别墅效果图 专题图集（服务端渲染，精准捕捉百度词）
    if (pathname === "/" + GALLERY.slug) {
      const html = renderGalleryPage();
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      return res.end(html);
    }

    // 设计作品展示页（支持所有分类 /works/:slug）
    const worksMatch = pathname.match(/^\/works\/([a-z0-9-]+)\/?$/);
    if (worksMatch) {
      const html = renderWorksPage(worksMatch[1]);
      if (html) {
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        return res.end(html);
      }
    }

    // 作品详情页（/works/:slug/:id）
    const workDetailMatch = pathname.match(/^\/works\/([a-z0-9-]+)\/([a-zA-Z0-9-]+)\/?$/);
    if (workDetailMatch) {
      const html = renderWorkDetailPage(workDetailMatch[1], workDetailMatch[2]);
      if (html) {
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        return res.end(html);
      }
      res.writeHead(404, { "Content-Type": MIME[".html"] });
      return res.end(
        "<!doctype html><html lang='zh-CN'><head><meta charset='utf-8'><title>作品不存在</title></head>" +
        "<body style='font-family:system-ui;padding:60px;text-align:center'><h1>404</h1>" +
        "<p>该作品不存在。<a href='/'>返回首页</a></p></body></html>"
      );
    }

    // 分类落地页（服务端渲染，百度可抓取）—— 在 /api 与静态兜底之前处理
    if (pathname.startsWith("/category/")) {
      const slug = decodeURIComponent(pathname.slice("/category/".length))
        .replace(/\/+$/, "")
        .replace(/[^\w-]/g, "");
      const html = renderCategoryPage(slug);
      if (html) {
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        return res.end(html);
      }
      res.writeHead(404, { "Content-Type": MIME[".html"] });
      return res.end(
        "<!doctype html><html lang='zh-CN'><head><meta charset='utf-8'><title>页面不存在</title></head>" +
        "<body style='font-family:system-ui;padding:60px;text-align:center'><h1>404</h1>" +
        "<p>该设计分类不存在。<a href='/'>返回首页</a></p></body></html>"
      );
    }

    // 原创文章（静态 HTML，支持无扩展名友好 URL，便于百度收录）
    if (pathname.startsWith("/article/")) {
      const slug = decodeURIComponent(pathname.slice("/article/".length))
        .replace(/\/+$/, "")
        .replace(/[^\w-]/g, "");
      const artPath = path.join(PUBLIC_DIR, "article", slug + ".html");
      if (fs.existsSync(artPath) && fs.statSync(artPath).isFile()) {
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        fs.createReadStream(artPath).pipe(res);
        return;
      }
      res.writeHead(404, { "Content-Type": MIME[".html"] });
      return res.end(
        "<!doctype html><html lang='zh-CN'><head><meta charset='utf-8'><title>文章不存在</title></head>" +
        "<body style='font-family:system-ui;padding:60px;text-align:center'><h1>404</h1>" +
        "<p>该文章不存在。<a href='/'>返回首页</a></p></body></html>"
      );
    }

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
    } else {
      serveStatic(req, res, pathname);
    }
  } catch (err) {
    console.error("请求处理出错：", err.message);
    if (!res.headersSent) {
      sendJSON(res, 400, { success: false, message: err.message || "请求处理失败" });
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n  DD 设计交易平台已启动`);
  console.log(`  ➜  本地访问： http://localhost:${PORT}`);
  console.log(`  ➜  管理员默认账号： ${DEFAULT_ADMIN.username} / ${DEFAULT_ADMIN.password}`);
  console.log(`  ➜  数据文件： ${DATA_FILE}`);
  console.log(`  ➜  分类落地页： http://localhost:${PORT}/category/hotel 等 11 个\n`);
});
