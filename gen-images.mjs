// 生成 DD 设计交易平台所需的本地 SVG 图片（零网络依赖，永不破图）。
// 用法：  node gen-images.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/images");
fs.mkdirSync(OUT, { recursive: true });

const FONT = "'Noto Serif SC','Source Han Serif SC','Songti SC','STSong','SimSun','Microsoft YaHei',serif";

// 每个服务类目一个香槟金主色，保证视觉区分又有统一调性
const ACCENT = {
  hotel: "#d6b271",
  minsu: "#c9a86a",
  residential: "#b8893f",
  commercial: "#caa15c",
  softdecor: "#d8c08a",
  "ai-design": "#cdb27a",
  architecture: "#bfa46a",
  garden: "#9fae6a",
  restaurant: "#d09a5a",
  lighting: "#e0c47a",
};

const SERVICES = [
  { slug: "hotel", title: "酒店设计" },
  { slug: "minsu", title: "民宿设计" },
  { slug: "residential", title: "住宅设计" },
  { slug: "commercial", title: "商业空间" },
  { slug: "softdecor", title: "软装配饰" },
  { slug: "ai-design", title: "AI智能设计" },
  { slug: "architecture", title: "建筑设计" },
  { slug: "garden", title: "园林设计" },
  { slug: "restaurant", title: "餐饮设计" },
  { slug: "lighting", title: "灯光设计" },
];

// [案例id, 标题, 所属类目标题]
const CASES = [
  ["hotel-1", "云境·精品度假酒店", "酒店设计"],
  ["hotel-2", "都市·商务精品酒店", "酒店设计"],
  ["hotel-3", "海棠湾·度假酒店", "酒店设计"],
  ["hotel-4", "竹林·温泉酒店", "酒店设计"],
  ["hotel-5", "星河·城市精品酒店", "酒店设计"],
  ["hotel-6", "古镇·文化主题酒店", "酒店设计"],
  ["minsu-1", "山海间·海景民宿", "民宿设计"],
  ["minsu-2", "茶境·山间民宿", "民宿设计"],
  ["minsu-3", "稻田·乡村民宿", "民宿设计"],
  ["minsu-4", "星空·露营民宿", "民宿设计"],
  ["minsu-5", "竹隐·森林民宿", "民宿设计"],
  ["minsu-6", "渔村·海边民宿", "民宿设计"],
  ["res-1", "悦境·浦东大平层", "住宅设计"],
  ["res-2", "山居·独栋别墅", "住宅设计"],
  ["res-3", "云端·复式公寓", "住宅设计"],
  ["res-4", "花园·联排别墅", "住宅设计"],
  ["res-5", "湖畔·大平层", "住宅设计"],
  ["res-6", "御景·顶层复式", "住宅设计"],
  ["com-1", "墨·高端日料餐厅", "商业空间"],
  ["com-2", "创想·科技公司总部", "商业空间"],
  ["com-3", "花间·网红咖啡店", "商业空间"],
  ["com-4", "品·连锁火锅店", "商业空间"],
  ["com-5", "奢·高端美容会所", "商业空间"],
  ["com-6", "潮·买手店", "商业空间"],
  ["soft-1", "雅居·大平层软装", "软装配饰"],
  ["soft-2", "墨韵·中式软装", "软装配饰"],
  ["soft-3", "光影·灯光方案", "软装配饰"],
  ["soft-4", "花艺·空间花植", "软装配饰"],
  ["soft-5", "艺境·艺术品配置", "软装配饰"],
  ["soft-6", "织梦·窗帘布艺", "软装配饰"],
  ["ai-1", "AI·客厅空间重塑", "AI智能设计"],
  ["ai-2", "AI·全屋风格定制", "AI智能设计"],
  ["ai-3", "AI·商铺快速出图", "AI智能设计"],
  ["ai-4", "AI·旧房改造预览", "AI智能设计"],
  ["ai-5", "AI·民宿风格探索", "AI智能设计"],
  ["ai-6", "AI·VR全景漫游", "AI智能设计"],
  ["arch-1", "云顶·山地别墅群", "建筑设计"],
  ["arch-2", "星河·商业综合体", "建筑设计"],
  ["arch-3", "水岸·文化中心", "建筑设计"],
  ["arch-4", "云端·超高层住宅", "建筑设计"],
  ["arch-5", "竹境·度假酒店建筑", "建筑设计"],
  ["arch-6", "学府·教育综合体", "建筑设计"],
  ["garden-1", "枯山水·禅意庭院", "园林设计"],
  ["garden-2", "花境·英式花园", "园林设计"],
  ["garden-3", "山水间·中式园林", "园林设计"],
  ["garden-4", "绿洲·屋顶花园", "园林设计"],
  ["garden-5", "溪谷·度假村景观", "园林设计"],
  ["garden-6", "水境·滨水景观", "园林设计"],
  ["rest-1", "炉·创意日料", "餐饮设计"],
  ["rest-2", "火凤凰·川菜连锁", "餐饮设计"],
  ["rest-3", "云端·空中餐厅", "餐饮设计"],
  ["rest-4", "茶颜·新式茶饮", "餐饮设计"],
  ["rest-5", "牧场·西餐厅", "餐饮设计"],
  ["rest-6", "渔港·海鲜酒楼", "餐饮设计"],
  ["light-1", "星河·别墅全屋灯光", "灯光设计"],
  ["light-2", "夜·商业街亮化", "灯光设计"],
  ["light-3", "光影·美术馆照明", "灯光设计"],
  ["light-4", "暖·餐厅氛围灯光", "灯光设计"],
  ["light-5", "璀璨·酒店大堂灯光", "灯光设计"],
  ["light-6", "智·办公空间照明", "灯光设计"],
];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));

function svgCase(id, title, catTitle) {
  const accent = ACCENT[slugOf(catTitle)] || "#d6b271";
  const fs2 = title.length > 8 ? 46 : 54;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6eed9"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.82" cy="0.18" r="0.95">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <rect width="800" height="600" fill="url(#h)"/>
  <circle cx="666" cy="118" r="168" fill="#ffffff" opacity="0.12"/>
  <circle cx="110" cy="512" r="120" fill="#3a2f1d" opacity="0.07"/>
  <text x="60" y="80" font-family="${FONT}" font-size="20" fill="#3a2f1d" opacity="0.5" letter-spacing="3">DD 设计 · 精选案例</text>
</svg>`;
}

function svgService(slug, title) {
  const accent = ACCENT[slug] || "#d6b271";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6eed9"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.8" cy="0.2" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="520" fill="url(#g)"/>
  <rect width="800" height="520" fill="url(#h)"/>
  <circle cx="660" cy="90" r="150" fill="#ffffff" opacity="0.12"/>
  <text x="400" y="470" text-anchor="middle" font-family="${FONT}" font-size="20" fill="#3a2f1d" opacity="0.55" letter-spacing="4">DD 设计交易平台 · 共享顶级设计师</text>
</svg>`;
}

function svgHero() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3a2f1d"/>
      <stop offset="0.55" stop-color="#5a4a2e"/>
      <stop offset="1" stop-color="#d6b271"/>
    </linearGradient>
    <radialGradient id="h" cx="0.75" cy="0.25" r="0.9">
      <stop offset="0" stop-color="#ffe9b8" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#ffe9b8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#g)"/>
  <rect width="1920" height="1080" fill="url(#h)"/>
  <circle cx="1480" cy="240" r="320" fill="#ffffff" opacity="0.06"/>
  <circle cx="320" cy="900" r="240" fill="#000000" opacity="0.08"/>
  <g stroke="#ffe9b8" stroke-opacity="0.18" stroke-width="2" fill="none">
    <path d="M0 820 Q 480 700 960 820 T 1920 820"/>
    <path d="M0 900 Q 480 780 960 900 T 1920 900"/>
  </g>
</svg>`;
}

// 类目标题 -> slug
function slugOf(catTitle) {
  const s = SERVICES.find((x) => x.title === catTitle);
  return s ? s.slug : "hotel";
}

let count = 0;
for (const s of SERVICES) {
  fs.writeFileSync(path.join(OUT, `${s.slug}-hero.svg`), svgService(s.slug, s.title), "utf-8");
  count++;
}
for (const [id, title, cat] of CASES) {
  fs.writeFileSync(path.join(OUT, `${id}.svg`), svgCase(id, title, cat), "utf-8");
  count++;
}
fs.writeFileSync(path.join(OUT, "hero-bg.svg"), svgHero(), "utf-8");
count++;

console.log(`已生成 ${count} 张本地 SVG 图片 → ${OUT}`);
