"use strict";

/* =========================================================================
 * DD 设计交易平台 —— 前端逻辑（原生 JS，无框架、无构建）
 * 所有 API 同源，无代理/CORS。模态框用 display 开关，从根上避免遮罩挡点击。
 * ========================================================================= */

// AI 生成的真实设计案例图片（public/images/*.png），每个服务类目一张封面。
const IMG = {
  hotel: "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
  minsu: "/images/Beautiful_countryside_guesthou_2026-08-06T14-17-42.png",
  residential: "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
  commercial: "/images/Trendy_commercial_retail_space_2026-08-06T14-17-22.png",
  softdecor: "/images/Elegant_soft_decoration_interi_2026-08-06T14-17-22.png",
  "ai-design": "/images/Futuristic_AI_smart_home_desig_2026-08-06T14-17-22.png",
  architecture: "/images/Modern_architectural_building__2026-08-06T14-18-23.png",
  garden: "/images/Beautiful_landscape_garden_des_2026-08-06T14-18-23.png",
  restaurant: "/images/Elegant_fine_dining_restaurant_2026-08-06T14-18-23.png",
  lighting: "/images/Professional_architectural_lig_2026-08-06T14-18-23.png",
  homestead: "/images/Beautiful_rural_countryside_vi_2026-08-06T14-18-23.png",
  // 案例详情复用类目封面（案例卡片也用这些图）
  villa: "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
  hero: "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
  ph: "/images/Luxury_boutique_hotel_lobby_in_2026-08-06T14-17-21.png",
  pv: "/images/Modern_luxury_villa_living_roo_2026-08-06T14-17-22.png",
  pr: "/images/Beautiful_countryside_guesthou_2026-08-06T14-17-42.png",
  soft: "/images/Elegant_soft_decoration_interi_2026-08-06T14-17-22.png",
};

// 每个服务类目一个香槟金主色，用于图片缺失时的渐变兜底，保证视觉区分。
const ACCENT = {
  hotel: "#d6b271", minsu: "#c9a86a", residential: "#b8893f", commercial: "#caa15c",
  softdecor: "#d8c08a", "ai-design": "#cdb27a", architecture: "#bfa46a",
  garden: "#9fae6a", restaurant: "#d09a5a", lighting: "#e0c47a",
};
function accentOf(catTitle) {
  const s = SERVICES.find((x) => x.title === catTitle);
  return s ? ACCENT[s.slug] : "#d6b271";
}
// 双层背景：优先用本地 SVG，缺失时回退到同色系渐变（绝不出现破图白块）。
const coverBg = (file, catTitle) => `background-image:url('${file}'), linear-gradient(135deg,#f6eed9,${accentOf(catTitle)})`;

/* ===================== 真实服务数据（源自原项目） ===================== */
const SERVICES = [
  {
    id: "hotel", slug: "hotel", title: "酒店设计", subtitle: "精品酒店 · 连锁酒店 · 度假酒店",
    description: "从概念到落地，为酒店投资人提供全流程设计服务。共享顶级酒店设计师资源，节省50%-70%设计费用。",
    heroImage: IMG.hotel, priceRange: "¥50万-200万", avgSavings: "平均节省 ¥85万",
    stats: [{ value: "320+", label: "完成项目" }, { value: "¥2,700万", label: "累计节省" }, { value: "99%", label: "满意度" }, { value: "45天", label: "平均工期" }],
    projects: [
      { id: "hotel-1", title: "云境·精品度假酒店", location: "云南大理", area: "2,800㎡", style: "新中式", budget: "设计费 ¥120万", savings: "节省 ¥85万", designer: "张明远", duration: "60天", description: "坐落于洱海之畔的精品度假酒店，融合白族建筑元素与现代设计语言。", image: IMG.hotel, tags: ["新中式", "度假", "禅意", "洱海"], rating: 5 },
      { id: "hotel-2", title: "都市·商务精品酒店", location: "北京朝阳", area: "5,600㎡", style: "现代商务", budget: "设计费 ¥200万", savings: "节省 ¥160万", designer: "李建华", duration: "90天", description: "位于CBD核心区的商务酒店，以简洁高效的设计理念打造舒适空间。", image: IMG.ph, tags: ["商务", "现代", "高效", "CBD"], rating: 5 },
      { id: "hotel-3", title: "海棠湾·度假酒店", location: "海南三亚", area: "8,200㎡", style: "热带度假", budget: "设计费 ¥350万", savings: "节省 ¥230万", designer: "王海洋", duration: "120天", description: "面朝大海的热带度假酒店，将自然元素与现代奢华完美融合。", image: IMG.hero, tags: ["海景", "热带", "奢华", "度假"], rating: 5 },
      { id: "hotel-4", title: "竹林·温泉酒店", location: "四川峨眉", area: "3,500㎡", style: "禅意东方", budget: "设计费 ¥150万", savings: "节省 ¥95万", designer: "陈雅文", duration: "75天", description: "隐于竹林深处的温泉酒店，以东方禅意为设计灵魂。", image: IMG.minsu, tags: ["禅意", "温泉", "竹林", "东方"], rating: 5 },
      { id: "hotel-5", title: "星河·城市精品酒店", location: "上海浦东", area: "4,200㎡", style: "轻奢现代", budget: "设计费 ¥180万", savings: "节省 ¥120万", designer: "赵晨曦", duration: "80天", description: "位于陆家嘴金融区的城市精品酒店，以星空为设计主题。", image: IMG.ph, tags: ["轻奢", "现代", "城市", "未来感"], rating: 5 },
      { id: "hotel-6", title: "古镇·文化主题酒店", location: "江苏周庄", area: "1,800㎡", style: "江南水乡", budget: "设计费 ¥80万", savings: "节省 ¥55万", designer: "林婉清", duration: "50天", description: "坐落于千年古镇的文化主题酒店，将江南水乡诗意融入细节。", image: IMG.hotel, tags: ["江南", "文化", "古镇", "水乡"], rating: 5 },
    ],
  },
  {
    id: "minsu", slug: "minsu", title: "民宿设计", subtitle: "精品民宿 · 乡村民宿 · 主题民宿",
    description: "打造独具特色的民宿空间，提升入住体验和复购率。深度理解运营逻辑，让设计为经营赋能。",
    heroImage: IMG.minsu, priceRange: "¥10万-50万", avgSavings: "平均节省 ¥22万",
    stats: [{ value: "580+", label: "完成项目" }, { value: "¥1,280万", label: "累计节省" }, { value: "98%", label: "满意度" }, { value: "30天", label: "平均工期" }],
    projects: [
      { id: "minsu-1", title: "山海间·海景民宿", location: "浙江舟山", area: "680㎡", style: "现代海洋", budget: "设计费 ¥35万", savings: "节省 ¥22万", designer: "周海燕", duration: "35天", description: "面朝大海的精品民宿，将海洋元素巧妙融入空间设计。", image: IMG.pr, tags: ["海景", "现代", "轻奢", "舟山"], rating: 5 },
      { id: "minsu-2", title: "茶境·山间民宿", location: "福建武夷山", area: "1,200㎡", style: "茶文化", budget: "设计费 ¥48万", savings: "节省 ¥38万", designer: "吴茗轩", duration: "45天", description: "隐于茶山之间的精品民宿，以茶文化为设计主线。", image: IMG.minsu, tags: ["茶文化", "禅意", "自然", "山间"], rating: 5 },
      { id: "minsu-3", title: "稻田·乡村民宿", location: "广西桂林", area: "450㎡", style: "田园自然", budget: "设计费 ¥18万", savings: "节省 ¥12万", designer: "黄田野", duration: "25天", description: "坐落于稻田之间的乡村民宿，还原田园生活的本真。", image: IMG.pr, tags: ["田园", "乡村", "自然", "稻田"], rating: 5 },
      { id: "minsu-4", title: "星空·露营民宿", location: "内蒙古呼伦贝尔", area: "320㎡", style: "野奢露营", budget: "设计费 ¥25万", savings: "节省 ¥15万", designer: "马天骄", duration: "20天", description: "草原上的星空露营民宿，将野奢概念与蒙古族文化结合。", image: IMG.minsu, tags: ["野奢", "露营", "草原", "星空"], rating: 5 },
      { id: "minsu-5", title: "竹隐·森林民宿", location: "浙江安吉", area: "560㎡", style: "竹文化", budget: "设计费 ¥30万", savings: "节省 ¥20万", designer: "林竹青", duration: "30天", description: "藏于竹海深处的森林民宿，以竹为主要设计元素。", image: IMG.pr, tags: ["竹文化", "森林", "自然", "安吉"], rating: 5 },
      { id: "minsu-6", title: "渔村·海边民宿", location: "福建霞浦", area: "380㎡", style: "渔村风情", budget: "设计费 ¥22万", savings: "节省 ¥14万", designer: "陈海风", duration: "28天", description: "位于百年渔村的海边民宿，保留渔村原始风貌。", image: IMG.minsu, tags: ["渔村", "海边", "风情", "霞浦"], rating: 5 },
    ],
  },
  {
    id: "residential", slug: "residential", title: "住宅设计", subtitle: "大平层 · 别墅 · 复式",
    description: "高端住宅空间设计，融合业主生活方式与审美偏好。告别千篇一律，打造专属于您的理想居所。",
    heroImage: IMG.villa, priceRange: "¥5万-80万", avgSavings: "平均节省 ¥45万",
    stats: [{ value: "1,240+", label: "完成项目" }, { value: "¥5,580万", label: "累计节省" }, { value: "98%", label: "满意度" }, { value: "35天", label: "平均工期" }],
    projects: [
      { id: "res-1", title: "悦境·浦东大平层", location: "上海浦东", area: "380㎡", style: "现代简约", budget: "设计费 ¥65万", savings: "节省 ¥45万", designer: "张艺轩", duration: "40天", description: "俯瞰浦江的大平层住宅，以极简主义为设计哲学。", image: IMG.villa, tags: ["现代简约", "大平层", "定制", "浦东"], rating: 5 },
      { id: "res-2", title: "山居·独栋别墅", location: "杭州西湖", area: "650㎡", style: "新中式", budget: "设计费 ¥95万", savings: "节省 ¥72万", designer: "王雅琴", duration: "55天", description: "西湖畔的独栋别墅，将传统中式美学与现代生活融合。", image: IMG.pv, tags: ["新中式", "别墅", "西湖", "诗意"], rating: 5 },
      { id: "res-3", title: "云端·复式公寓", location: "深圳南山", area: "280㎡", style: "轻奢现代", budget: "设计费 ¥48万", savings: "节省 ¥35万", designer: "刘晨光", duration: "35天", description: "位于城市之巅的复式公寓，以轻奢现代风格打造居所。", image: IMG.villa, tags: ["轻奢", "复式", "现代", "城市"], rating: 5 },
      { id: "res-4", title: "花园·联排别墅", location: "苏州园区", area: "420㎡", style: "法式轻奢", budget: "设计费 ¥72万", savings: "节省 ¥55万", designer: "陈雅婷", duration: "45天", description: "苏州园区的联排别墅，以法式轻奢风格打造优雅家居。", image: IMG.pv, tags: ["法式", "轻奢", "花园", "别墅"], rating: 5 },
      { id: "res-5", title: "湖畔·大平层", location: "武汉东湖", area: "320㎡", style: "意式极简", budget: "设计费 ¥55万", savings: "节省 ¥40万", designer: "赵明远", duration: "38天", description: "东湖之畔的大平层住宅，以意大利极简主义为灵感。", image: IMG.villa, tags: ["意式", "极简", "湖景", "大平层"], rating: 5 },
      { id: "res-6", title: "御景·顶层复式", location: "广州天河", area: "450㎡", style: "现代奢华", budget: "设计费 ¥88万", savings: "节省 ¥65万", designer: "林雅诗", duration: "50天", description: "城市之巅的顶层复式，打造360度全景视野居住体验。", image: IMG.pv, tags: ["奢华", "顶层", "全景", "复式"], rating: 5 },
    ],
  },
  {
    id: "commercial", slug: "commercial", title: "商业空间", subtitle: "餐厅 · 办公室 · 零售店",
    description: "商业空间设计直接影响营业额，我们用数据驱动设计决策，帮助商业空间实现最大化价值。",
    heroImage: IMG.commercial, priceRange: "¥20万-150万", avgSavings: "平均节省 ¥68万",
    stats: [{ value: "890+", label: "完成项目" }, { value: "¥6,050万", label: "累计节省" }, { value: "97%", label: "满意度" }, { value: "40天", label: "平均工期" }],
    projects: [
      { id: "com-1", title: "墨·高端日料餐厅", location: "上海静安", area: "450㎡", style: "日式侘寂", budget: "设计费 ¥65万", savings: "节省 ¥48万", designer: "田中一郎", duration: "40天", description: "隐于闹市的高端日料餐厅，以侘寂美学传达食物本真。", image: IMG.commercial, tags: ["日式", "侘寂", "高端", "日料"], rating: 5 },
      { id: "com-2", title: "创想·科技公司总部", location: "北京海淀", area: "2,200㎡", style: "科技未来", budget: "设计费 ¥120万", savings: "节省 ¥85万", designer: "张科技", duration: "60天", description: "互联网科技公司总部，以开放协作为核心理念。", image: IMG.hotel, tags: ["科技", "开放", "协作", "未来"], rating: 5 },
      { id: "com-3", title: "花间·网红咖啡店", location: "成都太古里", area: "180㎡", style: "ins风", budget: "设计费 ¥28万", savings: "节省 ¥18万", designer: "李花间", duration: "25天", description: "太古里的网红咖啡店，以花艺为设计主题打造打卡空间。", image: IMG.commercial, tags: ["网红", "咖啡", "花艺", "打卡"], rating: 5 },
      { id: "com-4", title: "品·连锁火锅店", location: "重庆渝中", area: "800㎡", style: "国潮", budget: "设计费 ¥55万", savings: "节省 ¥38万", designer: "陈国潮", duration: "35天", description: "连锁火锅品牌旗舰店，将重庆码头文化融入现代餐饮。", image: IMG.commercial, tags: ["国潮", "火锅", "连锁", "文化"], rating: 5 },
      { id: "com-5", title: "奢·高端美容会所", location: "广州天河", area: "600㎡", style: "法式轻奢", budget: "设计费 ¥75万", savings: "节省 ¥52万", designer: "王美琳", duration: "45天", description: "高端美容会所，以法式轻奢风格营造尊贵私密空间。", image: IMG.soft, tags: ["轻奢", "美容", "法式", "私密"], rating: 5 },
      { id: "com-6", title: "潮·买手店", location: "深圳华侨城", area: "350㎡", style: "工业潮流", budget: "设计费 ¥42万", savings: "节省 ¥30万", designer: "赵潮流", duration: "30天", description: "华侨城创意园的潮流买手店，融入街头艺术元素。", image: IMG.commercial, tags: ["工业", "潮流", "买手", "街头"], rating: 5 },
    ],
  },
  {
    id: "softdecor", slug: "softdecor", title: "软装配饰", subtitle: "家具选配 · 艺术品 · 灯光方案",
    description: "专业软装设计团队，为硬装完成后的空间注入灵魂。精准把控预算，每一分钱都花在刀刃上。",
    heroImage: IMG.soft, priceRange: "¥3万-30万", avgSavings: "平均节省 ¥12万",
    stats: [{ value: "760+", label: "完成项目" }, { value: "¥912万", label: "累计节省" }, { value: "99%", label: "满意度" }, { value: "20天", label: "平均工期" }],
    projects: [
      { id: "soft-1", title: "雅居·大平层软装", location: "上海徐汇", area: "320㎡", style: "现代轻奢", budget: "软装费 ¥85万", savings: "节省 ¥28万", designer: "陈雅居", duration: "25天", description: "大平层住宅全案软装设计，从家具到艺术品一站式配置。", image: IMG.soft, tags: ["轻奢", "全案", "艺术品", "定制"], rating: 5 },
      { id: "soft-2", title: "墨韵·中式软装", location: "北京东城", area: "450㎡", style: "新中式", budget: "软装费 ¥120万", savings: "节省 ¥45万", designer: "王墨韵", duration: "30天", description: "四合院改造后的新中式软装，融合传统文人雅趣。", image: IMG.soft, tags: ["新中式", "文人", "雅趣", "四合院"], rating: 5 },
      { id: "soft-3", title: "光影·灯光方案", location: "深圳福田", area: "280㎡", style: "现代极简", budget: "灯光费 ¥35万", savings: "节省 ¥12万", designer: "刘光影", duration: "15天", description: "复式住宅专业灯光设计方案，用光影塑造空间层次。", image: IMG.villa, tags: ["灯光", "氛围", "场景", "极简"], rating: 5 },
      { id: "soft-4", title: "花艺·空间花植", location: "杭州西湖", area: "200㎡", style: "自然生态", budget: "花植费 ¥15万", savings: "节省 ¥6万", designer: "花小姐", duration: "10天", description: "高端住宅空间花植设计，将自然生态引入室内。", image: IMG.minsu, tags: ["花植", "自然", "生态", "绿色"], rating: 5 },
      { id: "soft-5", title: "艺境·艺术品配置", location: "上海黄浦", area: "500㎡", style: "当代艺术", budget: "艺术品费 ¥200万", savings: "节省 ¥65万", designer: "赵艺境", duration: "20天", description: "高端别墅艺术品配置方案，为空间注入文化底蕴。", image: IMG.villa, tags: ["艺术品", "当代", "收藏", "文化"], rating: 5 },
      { id: "soft-6", title: "织梦·窗帘布艺", location: "广州越秀", area: "350㎡", style: "欧式古典", budget: "布艺费 ¥25万", savings: "节省 ¥9万", designer: "林织梦", duration: "12天", description: "别墅窗帘布艺全案设计，打造优雅的空间帷幕。", image: IMG.soft, tags: ["窗帘", "布艺", "欧式", "定制"], rating: 5 },
    ],
  },
  {
    id: "ai-design", slug: "ai-design", title: "展厅设计", subtitle: "AI辅助 · 快速出图 · 方案预览",
    description: "结合最新AI技术，48小时内生成初步设计方案，让您在正式开工前就能看到理想空间效果。",
    heroImage: IMG.hero, priceRange: "¥2万-15万", avgSavings: "平均节省 ¥8万",
    stats: [{ value: "430+", label: "完成项目" }, { value: "¥344万", label: "累计节省" }, { value: "96%", label: "满意度" }, { value: "48h", label: "出图速度" }],
    projects: [
      { id: "ai-1", title: "AI·客厅空间重塑", location: "线上服务", area: "60㎡", style: "多风格可选", budget: "设计费 ¥2万", savings: "节省 ¥8万", designer: "AI + 设计师", duration: "48小时", description: "AI快速生成客厅设计方案，支持多种风格切换。", image: IMG.villa, tags: ["AI", "快速", "多风格", "客厅"], rating: 5 },
      { id: "ai-2", title: "AI·全屋风格定制", location: "线上服务", area: "120㎡", style: "个性化定制", budget: "设计费 ¥5万", savings: "节省 ¥15万", designer: "AI + 设计师", duration: "3天", description: "AI分析生活习惯和审美偏好，生成专属全屋方案。", image: IMG.soft, tags: ["AI", "全屋", "定制", "个性化"], rating: 5 },
      { id: "ai-3", title: "AI·商铺快速出图", location: "线上服务", area: "200㎡", style: "商业定制", budget: "设计费 ¥3万", savings: "节省 ¥12万", designer: "AI + 设计师", duration: "48小时", description: "为商铺快速生成多套设计方案，助商家快速决策。", image: IMG.commercial, tags: ["AI", "商铺", "快速", "多方案"], rating: 5 },
      { id: "ai-4", title: "AI·旧房改造预览", location: "线上服务", area: "90㎡", style: "焕新改造", budget: "设计费 ¥2.5万", savings: "节省 ¥10万", designer: "AI + 设计师", duration: "48小时", description: "上传旧房照片，AI智能分析并生成改造预览。", image: IMG.villa, tags: ["AI", "旧房", "改造", "预览"], rating: 5 },
      { id: "ai-5", title: "AI·民宿风格探索", location: "线上服务", area: "500㎡", style: "风格探索", budget: "设计费 ¥8万", savings: "节省 ¥20万", designer: "AI + 设计师", duration: "5天", description: "为民宿投资人提供AI风格探索，降低决策风险。", image: IMG.minsu, tags: ["AI", "民宿", "风格", "探索"], rating: 5 },
      { id: "ai-6", title: "AI·VR全景漫游", location: "线上服务", area: "不限", style: "沉浸体验", budget: "设计费 ¥6万", savings: "节省 ¥15万", designer: "AI + 设计师", duration: "7天", description: "基于AI方案制作VR全景漫游，身临其境感受空间。", image: IMG.hero, tags: ["AI", "VR", "全景", "沉浸"], rating: 5 },
    ],
  },
  {
    id: "architecture", slug: "architecture", title: "建筑设计", subtitle: "住宅建筑 · 商业建筑 · 公共建筑",
    description: "从建筑规划到外立面设计，为开发商和业主提供全流程建筑设计服务。共享顶级建筑设计师资源。",
    heroImage: IMG.hotel, priceRange: "¥80万-500万", avgSavings: "平均节省 ¥120万",
    stats: [{ value: "260+", label: "完成项目" }, { value: "¥3,120万", label: "累计节省" }, { value: "97%", label: "满意度" }, { value: "90天", label: "平均工期" }],
    projects: [
      { id: "arch-1", title: "云顶·山地别墅群", location: "浙江莫干山", area: "12,000㎡", style: "现代山地", budget: "设计费 ¥280万", savings: "节省 ¥180万", designer: "张建筑", duration: "120天", description: "莫干山高端别墅群，融合山地地形与现代建筑语言。", image: IMG.villa, tags: ["山地", "别墅群", "现代", "生态"], rating: 5 },
      { id: "arch-2", title: "星河·商业综合体", location: "深圳前海", area: "45,000㎡", style: "未来主义", budget: "设计费 ¥500万", savings: "节省 ¥320万", designer: "李未来", duration: "180天", description: "前海自贸区商业综合体，以未来主义打造城市地标。", image: IMG.hotel, tags: ["商业", "综合体", "未来", "地标"], rating: 5 },
      { id: "arch-3", title: "水岸·文化中心", location: "苏州金鸡湖", area: "8,500㎡", style: "新中式", budget: "设计费 ¥200万", savings: "节省 ¥130万", designer: "王文化", duration: "100天", description: "金鸡湖畔文化中心，将苏州园林意境融入公共建筑。", image: IMG.minsu, tags: ["文化", "公共", "新中式", "水景"], rating: 5 },
      { id: "arch-4", title: "云端·超高层住宅", location: "上海浦东", area: "28,000㎡", style: "国际现代", budget: "设计费 ¥450万", savings: "节省 ¥280万", designer: "赵高远", duration: "150天", description: "浦东核心区超高层住宅，打造城市天际线新高度。", image: IMG.ph, tags: ["超高层", "住宅", "国际", "天际线"], rating: 5 },
      { id: "arch-5", title: "竹境·度假酒店建筑", location: "云南西双版纳", area: "15,000㎡", style: "热带生态", budget: "设计费 ¥350万", savings: "节省 ¥220万", designer: "林热带", duration: "130天", description: "西双版纳热带雨林度假酒店，以竹构技术打造低碳生态。", image: IMG.minsu, tags: ["热带", "生态", "竹构", "度假"], rating: 5 },
      { id: "arch-6", title: "学府·教育综合体", location: "北京海淀", area: "20,000㎡", style: "学院派现代", budget: "设计费 ¥380万", savings: "节省 ¥240万", designer: "陈学院", duration: "140天", description: "海淀区国际学校，融合教育理念与建筑美学。", image: IMG.hotel, tags: ["教育", "学校", "现代", "人文"], rating: 5 },
    ],
  },
  {
    id: "garden", slug: "garden", title: "园林设计", subtitle: "私家花园 · 景观规划 · 庭院设计",
    description: "从私家庭院到大型景观规划，打造人与自然和谐共处的户外空间。专业园林团队让土地绽放生命力。",
    heroImage: IMG.minsu, priceRange: "¥15万-200万", avgSavings: "平均节省 ¥45万",
    stats: [{ value: "380+", label: "完成项目" }, { value: "¥1,710万", label: "累计节省" }, { value: "98%", label: "满意度" }, { value: "60天", label: "平均工期" }],
    projects: [
      { id: "garden-1", title: "枯山水·禅意庭院", location: "杭州西溪", area: "800㎡", style: "日式禅意", budget: "设计费 ¥45万", savings: "节省 ¥30万", designer: "松本和", duration: "45天", description: "西溪湿地旁的私家庭院，以枯山水营造禅意空间。", image: IMG.minsu, tags: ["禅意", "枯山水", "日式", "庭院"], rating: 5 },
      { id: "garden-2", title: "花境·英式花园", location: "上海松江", area: "1,200㎡", style: "英式自然", budget: "设计费 ¥65万", savings: "节省 ¥42万", designer: "花小姐", duration: "50天", description: "别墅区英式自然花园，四季花境轮换如画。", image: IMG.pr, tags: ["英式", "花园", "四季", "自然"], rating: 5 },
      { id: "garden-3", title: "山水间·中式园林", location: "苏州吴中", area: "2,500㎡", style: "苏式园林", budget: "设计费 ¥120万", savings: "节省 ¥78万", designer: "王园林", duration: "80天", description: "传承苏州园林精髓的私家园林，移步换景。", image: IMG.minsu, tags: ["苏式", "园林", "山水", "古典"], rating: 5 },
      { id: "garden-4", title: "绿洲·屋顶花园", location: "深圳南山", area: "500㎡", style: "现代生态", budget: "设计费 ¥28万", savings: "节省 ¥18万", designer: "刘绿洲", duration: "30天", description: "城市高层屋顶花园，将绿色生态引入都市天空。", image: IMG.pr, tags: ["屋顶", "生态", "城市", "空中"], rating: 5 },
      { id: "garden-5", title: "溪谷·度假村景观", location: "四川青城山", area: "50,000㎡", style: "自然野趣", budget: "设计费 ¥200万", savings: "节省 ¥130万", designer: "赵溪谷", duration: "100天", description: "青城山度假村整体景观规划，保留原始植被。", image: IMG.minsu, tags: ["度假村", "自然", "野趣", "山林"], rating: 5 },
      { id: "garden-6", title: "水韵·滨水景观", location: "武汉东湖", area: "8,000㎡", style: "滨水生态", budget: "设计费 ¥95万", savings: "节省 ¥60万", designer: "陈水韵", duration: "70天", description: "东湖滨水住宅区景观，最大化利用湖景资源。", image: IMG.pr, tags: ["滨水", "生态", "湖景", "社区"], rating: 5 },
    ],
  },
  {
    id: "restaurant", slug: "restaurant", title: "餐饮设计", subtitle: "高端餐厅 · 连锁品牌 · 咖啡茶饮",
    description: "专注餐饮空间设计，深度理解餐饮运营逻辑。从品牌定位到空间落地，打造高坪效就餐环境。",
    heroImage: IMG.commercial, priceRange: "¥10万-100万", avgSavings: "平均节省 ¥35万",
    stats: [{ value: "650+", label: "完成项目" }, { value: "¥2,275万", label: "累计节省" }, { value: "98%", label: "满意度" }, { value: "35天", label: "平均工期" }],
    projects: [
      { id: "rest-1", title: "炉·创意日料", location: "上海新天地", area: "380㎡", style: "日式侘寂", budget: "设计费 ¥55万", savings: "节省 ¥38万", designer: "田中设计", duration: "40天", description: "新天地高端日料，以侘寂美学打造沉浸式体验。", image: IMG.commercial, tags: ["日料", "侘寂", "高端", "打卡"], rating: 5 },
      { id: "rest-2", title: "火凤凰·川菜连锁", location: "全国连锁", area: "250㎡/店", style: "国潮川味", budget: "设计费 ¥30万/店", savings: "节省 ¥20万/店", designer: "赵国潮", duration: "25天", description: "川菜连锁全国统一形象，融合国潮与川蜀文化。", image: IMG.commercial, tags: ["连锁", "国潮", "川菜", "品牌"], rating: 5 },
      { id: "rest-3", title: "云端·空中餐厅", location: "广州塔", area: "600㎡", style: "未来科技", budget: "设计费 ¥85万", savings: "节省 ¥55万", designer: "林未来", duration: "50天", description: "广州塔高层空中餐厅，打造360度全景用餐体验。", image: IMG.hotel, tags: ["空中", "全景", "科技", "高端"], rating: 5 },
      { id: "rest-4", title: "茶颜·新式茶饮", location: "长沙五一广场", area: "120㎡", style: "新中式", budget: "设计费 ¥18万", savings: "节省 ¥12万", designer: "陈茶颜", duration: "20天", description: "新式茶饮旗舰店，融合国风美学与年轻潮流。", image: IMG.commercial, tags: ["茶饮", "新中式", "网红", "社交"], rating: 5 },
      { id: "rest-5", title: "牧场·西餐厅", location: "北京三里屯", area: "450㎡", style: "工业复古", budget: "设计费 ¥62万", savings: "节省 ¥40万", designer: "马工业", duration: "35天", description: "三里屯工业风西餐厅，裸露管道与暖色灯光交织。", image: IMG.commercial, tags: ["工业风", "西餐", "复古", "氛围"], rating: 5 },
      { id: "rest-6", title: "渔港·海鲜酒楼", location: "厦门环岛路", area: "800㎡", style: "海洋主题", budget: "设计费 ¥75万", savings: "节省 ¥48万", designer: "周海洋", duration: "45天", description: "环岛路海景海鲜酒楼，将渔港文化与现代餐饮结合。", image: IMG.hotel, tags: ["海鲜", "海洋", "主题", "海景"], rating: 5 },
    ],
  },
  {
    id: "lighting", slug: "lighting", title: "灯光设计", subtitle: "室内照明 · 景观亮化 · 商业灯光",
    description: "专业灯光设计团队，用光影塑造空间灵魂。从住宅氛围照明到商业空间灯光营销，恰到好处。",
    heroImage: IMG.soft, priceRange: "¥5万-80万", avgSavings: "平均节省 ¥18万",
    stats: [{ value: "420+", label: "完成项目" }, { value: "¥756万", label: "累计节省" }, { value: "99%", label: "满意度" }, { value: "20天", label: "平均工期" }],
    projects: [
      { id: "light-1", title: "星河·别墅全屋灯光", location: "上海松江", area: "600㎡", style: "分层照明", budget: "设计费 ¥35万", savings: "节省 ¥22万", designer: "光之设计", duration: "20天", description: "别墅全屋灯光系统，分层照明+智能场景控制。", image: IMG.soft, tags: ["别墅", "分层", "智能", "场景"], rating: 5 },
      { id: "light-2", title: "夜·商业街亮化", location: "成都宽窄巷子", area: "5,000㎡", style: "文化亮化", budget: "设计费 ¥80万", savings: "节省 ¥52万", designer: "赵夜景", duration: "35天", description: "宽窄巷子商业街夜景亮化，用灯光讲述成都故事。", image: IMG.hotel, tags: ["商业街", "亮化", "文化", "夜景"], rating: 5 },
      { id: "light-3", title: "光影·美术馆照明", location: "北京798", area: "2,000㎡", style: "艺术照明", budget: "设计费 ¥45万", savings: "节省 ¥28万", designer: "林光影", duration: "25天", description: "798美术馆专业照明，精准控制色温与照度。", image: IMG.villa, tags: ["美术馆", "艺术", "专业", "色温"], rating: 5 },
      { id: "light-4", title: "暖·餐厅氛围灯光", location: "杭州西湖", area: "350㎡", style: "氛围营造", budget: "设计费 ¥15万", savings: "节省 ¥9万", designer: "陈暖光", duration: "15天", description: "西湖畔高端餐厅灯光，用暖色营造浪漫氛围。", image: IMG.commercial, tags: ["餐厅", "氛围", "暖光", "浪漫"], rating: 5 },
      { id: "light-5", title: "璀璨·酒店大堂灯光", location: "广州天河", area: "1,500㎡", style: "奢华照明", budget: "设计费 ¥60万", savings: "节省 ¥38万", designer: "王璀璨", duration: "28天", description: "五星级酒店大堂灯光，水晶灯阵与间接照明结合。", image: IMG.hotel, tags: ["酒店", "大堂", "奢华", "水晶"], rating: 5 },
      { id: "light-6", title: "智·办公空间照明", location: "深圳科技园", area: "3,000㎡", style: "健康照明", budget: "设计费 ¥40万", savings: "节省 ¥25万", designer: "刘智光", duration: "22天", description: "科技企业总部办公照明，采用人因照明提升效率。", image: IMG.villa, tags: ["办公", "健康", "智能", "人因"], rating: 5 },
    ],
  },
  {
    id: "homestead", slug: "homestead", title: "自建房设计", subtitle: "农村别墅 · 自建房 · 乡村住宅",
    description: "农村自建房与别墅一站式设计，含效果图、施工图、报建图，让乡村住宅既体面又省心落地。",
    heroImage: IMG.villa, priceRange: "¥3万-30万", avgSavings: "平均节省 ¥12万",
    stats: [{ value: "960+", label: "完成项目" }, { value: "¥1,150万", label: "累计节省" }, { value: "97%", label: "满意度" }, { value: "25天", label: "平均工期" }],
    projects: [
      { id: "home-1", title: "云栖·新中式农村别墅", location: "浙江金华", area: "380㎡", style: "新中式", budget: "设计费 ¥18万", savings: "节省 ¥12万", designer: "陈乡建", duration: "28天", description: "白墙黛瓦的新中式农村别墅，兼顾体面与实用，深受返乡建房业主喜爱。", image: IMG.villa, tags: ["新中式", "农村别墅", "自建房", "乡村"], rating: 5 },
      { id: "home-2", title: "现代·极简自建房", location: "江苏南通", area: "320㎡", style: "现代极简", budget: "设计费 ¥15万", savings: "节省 ¥9万", designer: "林简", duration: "22天", description: "线条干净的现代极简自建房，大开窗引入庭院景致，造价可控。", image: IMG.villa, tags: ["现代", "极简", "自建房", "大开窗"], rating: 5 },
      { id: "home-3", title: "欧韵·乡村双拼别墅", location: "山东潍坊", area: "460㎡", style: "欧式", budget: "设计费 ¥22万", savings: "节省 ¥14万", designer: "王欧", duration: "30天", description: "两户双拼的欧式乡村别墅，坡屋顶与拱窗凸显地域气质。", image: IMG.villa, tags: ["欧式", "双拼", "乡村别墅", "坡屋顶"], rating: 5 },
      { id: "home-4", title: "田园·一层合院自建房", location: "四川成都", area: "260㎡", style: "田园合院", budget: "设计费 ¥12万", savings: "节省 ¥7万", designer: "黄院", duration: "20天", description: "适合养老的一层合院自建房，围合庭院安全便利，老人居住友好。", image: IMG.villa, tags: ["合院", "一层", "养老", "田园"], rating: 5 },
      { id: "home-5", title: "滨海·度假自建宅", location: "福建泉州", area: "350㎡", style: "滨海现代", budget: "设计费 ¥20万", savings: "节省 ¥13万", designer: "周海", duration: "26天", description: "面海的度假自建宅，露台与通透立面最大化海景视野。", image: IMG.villa, tags: ["滨海", "度假", "自建房", "露台"], rating: 5 },
      { id: "home-6", title: "民宿化·乡村自建房", location: "安徽黄山", area: "420㎡", style: "徽派新解", budget: "设计费 ¥24万", savings: "节省 ¥15万", designer: "胡徽", duration: "32天", description: "可自住可经营的民宿化自建房，马头墙意象现代演绎，兼顾接待与居住。", image: IMG.villa, tags: ["徽派", "民宿化", "自建房", "乡村"], rating: 5 },
    ],
  },
];

/* ===================== 工具 ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const LS_USER = "dd_user";
const LS_ADMIN = "dd_admin";
const getUser = () => { try { return JSON.parse(localStorage.getItem(LS_USER)); } catch { return null; } };
const getAdmin = () => localStorage.getItem(LS_ADMIN);

let toastTimer = null;
function toast(msg, isErr) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast" + (isErr ? " err" : "");
  t.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = "none"; }, 2800);
}

/* ===================== API ===================== */
async function api(path, opts = {}) {
  const { method = "GET", body, auth } = opts;
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["Authorization"] = "Bearer " + auth;
  try {
    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let json;
    try { json = await res.json(); } catch { json = { success: false, message: "服务器返回异常" }; }
    return { ok: res.ok && json.success, status: res.status, data: json.data || null, message: json.message || "" };
  } catch (e) {
    return { ok: false, status: 0, data: null, message: "网络错误：请确认服务已启动（node server.js）" };
  }
}

/* ===================== 模态框 ===================== */
function openModal(id) {
  $$(".modal").forEach((m) => { if (m.id !== id) m.style.display = "none"; });
  const el = document.getElementById(id);
  if (el) { el.style.display = "flex"; document.body.style.overflow = "hidden"; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = "none"; document.body.style.overflow = ""; }
}

document.addEventListener("click", (e) => {
  // 关闭：点遮罩或 ×
  if (e.target.closest("[data-close]")) {
    const m = e.target.closest(".modal");
    if (m) closeModal(m.id);
    return;
  }
  // 行动按钮
  const act = e.target.closest("[data-action]");
  if (!act) return;
  const a = act.dataset.action;
  if (a === "admin-login") openModal("adminModal");
  else if (a === "upload") { if (getAdmin()) openModal("uploadModal"); else openModal("adminModal"); }
  else if (a === "logout") {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_ADMIN);
    applyAuthUI();
    toast("已退出登录");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $$(".modal").forEach((m) => { if (m.style.display !== "none") closeModal(m.id); });
  }
});

/* ===================== 鉴权 UI 状态 ===================== */
function applyAuthUI() {
  const user = getUser();
  const admin = getAdmin();
  const show = (el, v) => { if (el) el.classList.toggle("hidden", !v); };
  $$('[data-action="admin-login"]').forEach((b) => show(b, !admin));
  show($("#btnUpload"), !!admin);
  show($("#btnLogout"), !!(user || admin));
  const pill = $("#userPill");
  show(pill, !!(user || admin));
  if (pill) pill.textContent = admin ? "管理员" : (user ? (user.name || "用户") : "");
}

/* ===================== 渲染：服务 / 案例 / 视频 ===================== */
function renderServices() {
  $("#servicesGrid").innerHTML = SERVICES.map((c, i) => `
    <a class="service-card" href="/works/${esc(c.slug)}" data-service="${c.slug}">
      <span class="service-tag">${String(i + 1).padStart(2, "0")}</span>
      <div class="service-img" style="${coverBg(IMG[c.slug] || ("images/" + c.slug + "-hero.svg"), c.title)}"></div>
      <div class="service-body">
        <h3>${esc(c.title)}</h3>
        <div class="sub">${esc(c.subtitle)}</div>
        <div class="service-meta"><span class="price">${esc(c.priceRange)}</span><span class="save">${esc(c.avgSavings)}</span></div>
      </div>
    </a>`).join("");
}

let worksFilter = "all";
function renderWorksFilter() {
  const cats = [{ slug: "all", title: "全部" }].concat(SERVICES.map((c) => ({ slug: c.slug, title: c.title })));
  $("#worksFilter").innerHTML = cats.map((c) =>
    `<button class="${c.slug === worksFilter ? "active" : ""}" data-filter="${c.slug}">${esc(c.title)}</button>`).join("");
}
function renderWorks() {
  let list = [];
  SERVICES.forEach((cat) => cat.projects.forEach((p) => list.push(Object.assign({}, p, { catTitle: cat.title, catSlug: cat.slug }))));
  if (worksFilter !== "all") list = list.filter((p) => p.catSlug === worksFilter);
  $("#worksGrid").innerHTML = list.map((p) => `
    <div class="work-card" data-case="${p.id}">
      <div class="work-img" style="${coverBg(p.image || ("images/" + p.id + ".svg"), p.catTitle)}">
        <div class="work-img-cap"><span class="wic-cat">${esc(p.catTitle)}</span><span class="wic-title">${esc(p.title)}</span></div>
      </div>
      <div class="work-body">
        <h4>${esc(p.title)}</h4>
        <div class="loc">${esc(p.location)} · ${esc(p.area)} · ${esc(p.style)}</div>
        <div class="work-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      </div>
    </div>`).join("");
}

function openService(slug) {
  const c = SERVICES.find((s) => s.slug === slug);
  if (!c) return;
  $("#serviceModalBody").innerHTML = `
    <div class="sm-head">
      <div class="sm-img" style="${coverBg(IMG[c.slug] || ("images/" + c.slug + "-hero.svg"), c.title)}"></div>
      <div><h3 style="margin:0">${esc(c.title)}</h3><p style="color:var(--ink-soft);margin:4px 0 0">${esc(c.subtitle)}</p></div>
    </div>
    <p>${esc(c.description)}</p>
    <div class="sm-stats">${c.stats.map((s) => `<div><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join("")}</div>
    <div class="service-meta" style="margin-top:14px"><span class="price">${esc(c.priceRange)}</span><span class="save">${esc(c.avgSavings)}</span></div>
    <h4 style="margin:20px 0 8px">代表案例（${c.projects.length}）</h4>
    <div class="sm-projects">${c.projects.map((p) => `
      <div class="sm-proj"><h5>${esc(p.title)}</h5><p>${esc(p.location)} · ${esc(p.style)} · ${esc(p.duration)}</p><p class="save">${esc(p.savings)}</p></div>`).join("")}</div>`;
  openModal("serviceModal");
}

function openCase(id) {
  let found = null;
  SERVICES.forEach((cat) => cat.projects.forEach((p) => { if (p.id === id) found = p; }));
  if (!found) return;
  const p = found;
  $("#caseModalBody").innerHTML = `
    <div class="sm-head">
      <div class="sm-img" style="${coverBg(p.image || ("images/" + p.id + ".svg"), p.catTitle)}"></div>
      <div><h3 style="margin:0">${esc(p.title)}</h3><p style="color:var(--ink-soft);margin:4px 0 0">${esc(p.location)} · ${esc(p.area)} · ${esc(p.style)}</p></div>
    </div>
    <p>${esc(p.description)}</p>
    <div class="sm-stats">
      <div><strong>${esc(p.budget)}</strong><span>项目预算</span></div>
      <div><strong>${esc(p.savings)}</strong><span>设计节省</span></div>
      <div><strong>${esc(p.designer)}</strong><span>主创设计师</span></div>
      <div><strong>${esc(p.duration)}</strong><span>项目工期</span></div>
    </div>
    <div class="work-tags" style="margin-top:14px">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>`;
  openModal("caseModal");
}

async function loadVideos() {
  const grid = $("#videosGrid");
  const { ok, data } = await api("/api/videos");
  const admin = getAdmin();
  if (!ok) { grid.innerHTML = '<p class="video-empty">视频加载失败，请确认服务已启动。</p>'; return; }
  const list = (data && data.videos) || [];
  if (list.length === 0) { grid.innerHTML = '<p class="video-empty">暂无视频，管理员登录后可上传。</p>'; return; }
  grid.innerHTML = list.map((v) => `
    <div class="video-card">
      ${admin ? `<button class="video-del" data-del="${esc(v.id)}" title="删除">×</button>` : ""}
      <div class="video-thumb" style="${v.cover ? `background-image:url('${esc(v.cover)}')` : ""}">▶</div>
      <div class="video-body">
        <h4>${esc(v.title)}</h4>
        <a class="btn btn-ghost btn-block" href="${esc(v.url)}" target="_blank" rel="noopener">观看视频</a>
      </div>
    </div>`).join("");
}

/* ===================== 表单事件 ===================== */
// 管理员登录
$("#adminForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const r = await api("/api/admin/login", { method: "POST", body: { username: f.username.value.trim(), password: f.password.value } });
  if (r.ok) {
    localStorage.setItem(LS_ADMIN, r.data.token);
    closeModal("adminModal");
    applyAuthUI();
    loadVideos();
    toast("管理员登录成功");
  } else {
    $("#adminHint").textContent = r.message;
    $("#adminHint").className = "form-hint err";
    toast(r.message, true);
  }
});

// 上传视频
$("#uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const admin = getAdmin();
  if (!admin) { toast("请先以管理员身份登录", true); openModal("adminModal"); return; }
  const r = await api("/api/videos", {
    method: "POST",
    auth: admin,
    body: { title: f.title.value.trim(), url: f.url.value.trim(), cover: f.cover.value.trim() },
  });
  if (r.ok) {
    closeModal("uploadModal");
    f.reset();
    loadVideos();
    toast("视频已添加");
  } else {
    $("#uploadHint").textContent = r.message;
    $("#uploadHint").className = "form-hint err";
    toast(r.message, true);
  }
});

// 删除视频（事件委托）
$("#videosGrid").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-del]");
  if (!btn) return;
  if (!confirm("确定删除该视频？")) return;
  const admin = getAdmin();
  const r = await api("/api/videos/" + btn.dataset.del, { method: "DELETE", auth: admin });
  if (r.ok) { loadVideos(); toast("已删除"); }
  else toast(r.message || "删除失败", true);
});

// 联系表单
$("#contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const hint = $("#contactHint");

  // 静态演示站点（GitHub Pages）没有后端，直接给友好提示，避免暴露技术性报错
  if (window.DD_STATIC_DEMO) {
    hint.textContent = "感谢您的咨询！演示站点暂未开启在线提交，请通过页面上的电话或微信联系我们。";
    hint.className = "form-hint ok";
    f.reset();
    toast("已收到您的需求");
    return;
  }

  const r = await api("/api/contact", { method: "POST", body: { name: f.name.value.trim(), phone: f.phone.value.trim(), message: f.message.value.trim() } });
  if (r.ok) {
    hint.textContent = r.message; hint.className = "form-hint ok";
    f.reset();
    toast("预约提交成功");
  } else {
    hint.textContent = r.message; hint.className = "form-hint err";
    toast(r.message, true);
  }
});

// 服务卡已改为 <a href="/works/:slug"> 原生跳转

// 案例卡点击 → 详情弹窗
$("#worksGrid").addEventListener("click", (e) => {
  const card = e.target.closest("[data-case]");
  if (card) openCase(card.dataset.case);
});

// 案例筛选
$("#worksFilter").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  worksFilter = btn.dataset.filter;
  renderWorksFilter();
  renderWorks();
});

// 移动端菜单
$("#navToggle").addEventListener("click", () => {
  $("#mobileMenu").classList.toggle("hidden");
});
$$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => $("#mobileMenu").classList.add("hidden")));

// 导航栏滚动阴影
window.addEventListener("scroll", () => {
  $("#navbar").style.boxShadow = window.scrollY > 10 ? "0 6px 24px rgba(40,30,15,.08)" : "none";
});

/* ===================== 启动 ===================== */
renderServices();
renderWorksFilter();
renderWorks();
loadVideos();
applyAuthUI();
