# DD 设计交易平台 —— 部署上线指南

> 面向百度收录的部署方案（ICP 备案 + 国内服务器 + 百度统计 + 百度搜索资源平台）。
> 本项目已合规：系统字体栈、百度统计、无任何 Google 资源（无 GA / Google Fonts）。

---

## 一、项目结构

```
dd-design-platform-web/
├── server.js            # 零依赖 Node 服务（Node ≥ 18），单端口，同源，无构建
├── public/              # 前端静态资源
│   ├── index.html       # 首页（响应式 SPA，客户端渲染服务/案例/视频）
│   ├── styles.css       # 响应式样式（已含 900px / 560px 断点、移动端菜单）
│   ├── app.js           # 前端逻辑（渲染、弹窗、表单、管理员、视频上传）
│   ├── images/*.png     # 11 张 AI 生成真实配图（已修复引用）
│   ├── article/*.html   # 4 篇原创 SEO 文章（服务端静态托管）
│   ├── data/categories.json  # 11 个分类的落地页数据
│   ├── robots.txt / sitemap.xml
├── categories.json      # 同 public/data/categories.json（服务端读取用）
├── gen-images.mjs       # 本地 SVG 占位图生成脚本（当前已改用真实 PNG，无需再跑）
└── DEPLOY.md
```

**路由（由 server.js 处理）**
- `/` 首页
- `/category/<slug>` 11 个分类 SEO 落地页（服务端渲染，百度可直接抓取正文）
- `/nongcun-bieshu-xiaoguotu` 农村别墅效果图专题页（服务端渲染）
- `/article/<slug>` 原创文章（静态 HTML）
- `/api/*` 联系表单、管理员登录、视频增删（JSON）

---

## 二、本地预览（验证用）

```bash
cd dd-design-platform-web
node server.js            # 默认 http://localhost:3000
# 自定义端口：
PORT=8080 node server.js
```

- 管理员默认账号：`admin` / `Dd@2026`（**上线前务必改**）
- 健康检查：`curl http://localhost:3000/api/health` → `{"success":true,...}`
- 视频 / 联系表单需要服务端，纯 `file://` 打开首页时这两块会提示“服务未启动”，属正常。

---

## 三、上线部署（必须用国内服务器 + ICP 备案）

⚠️ **阻断级前提（百度 SEO）**：百度只收录「已 ICP 备案 + 国内服务器」的站点；
海外 / 被墙主机（Vercel、Railway、GitHub Pages、Netlify 等）在国内访问慢甚至不可达，
且百度几乎不收录。**本项目若要被百度收录，必须放在中国大陆节点。**

### 方案 A（推荐）：国内云服务器 + Node + PM2 + Nginx 反代
适合有一定命令行基础，最稳、最可控。

1. **买服务器 + 备案**：阿里云 / 腾讯云 / 华为云 ECS（选「中国大陆」地域），按流程完成 ICP 备案（约 1–3 周）。
2. **装 Node ≥ 18**：用 nvm 或官网二进制，避免系统旧版。
3. **传代码**：
   ```bash
   scp -r . root@<服务器IP>:/var/www/dd-design/
   ```
4. **进程守护（PM2）**：
   ```bash
   npm i -g pm2
   cd /var/www/dd-design
   pm2 start server.js --name dd-web
   pm2 save && pm2 startup
   ```
5. **Nginx 反代 + HTTPS**：
   ```nginx
   server {
     listen 80;
     server_name www.dd-design.com dd-design.com;
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     }
   }
   ```
   配好后用 `certbot` 申请免费 HTTPS 证书，并 301 强制跳转 https。
6. **生产环境变量**（务必设置）：
   | 变量 | 说明 |
   |---|---|
   | `PORT` | 端口（默认 3000） |
   | `SITE_DOMAIN` | 如 `https://www.dd-design.com`，影响 canonical / sitemap / 结构化数据 |
   | `BAIDU_TONGJI_ID` | 百度统计「网站ID」（替换 `hm.baidu.com` 占位） |
   | `ADMIN_USER` / `ADMIN_PASS` | **改掉默认管理员密码！** |

   Linux 下用 `pm2 start server.js --name dd-web --env production` 或在 `/etc/environment` 导出。

### 方案 B（更简单）：宝塔面板
装宝塔 → 新建「Node 项目」选 `server.js` → 绑定域名 → 一键 SSL。
适合不熟悉命令行的同学，底层同样是 Nginx + PM2。

### 方案 C（轻量）：云厂商「轻量应用服务器」
腾讯云 / 阿里云轻量应用服务器 + Node 应用镜像，步骤同 A 的 4–6。

---

## 四、百度 SEO 上线清单（逐个核对）

- [ ] 域名已完成 **ICP 备案**（无备案百度不收录）
- [ ] 服务器在 **中国大陆**，国内访问延迟低
- [ ] 已配置 **HTTPS**（百度优先收录 https）
- [ ] 替换 `index.html` / 文章页里的 `YOUR_BAIDU_TONGJI_ID` 与 `YOUR_BAIDU_VERIFY_CODE`
      （百度统计 + 百度搜索资源平台验证）
- [ ] 在「百度搜索资源平台」提交 `sitemap.xml` 与首页 URL
- [ ] canonical / OG / 结构化数据已就位（代码已含 Organization / Service / Article / ImageGallery）
- [ ] `robots.txt` 允许抓取（`Allow: /`，已配置）
- [ ] 分类落地页 `/category/*` 与专题页 `/nongcun-bieshu-xiaoguotu` 可被直接抓取（服务端渲染 ✓）
- [ ] 上线后持续更新「设计干货」原创文章（百度飓风算法重原创，忌采集/堆词）

---

## 五、安全与维护

- **立即修改默认管理员密码**：用 `ADMIN_PASS` 环境变量覆盖，不要保留 `Dd@2026`。
- 预约线索写在 `data.json`（含手机号等隐私），注意：
  - 文件权限建议 `chmod 600`，属主为运行用户；
  - 定期导出到 CRM，避免在公网可访问路径下泄露。
- 视频上传需管理员登录（Bearer token，内存态，重启失效，符合演示场景）。
- 服务器防火墙只放 `80/443/22`，SSH 建议改非 22 端口 + 密钥登录。

---

## 六、回滚与验证

- **回滚**：上线前用 `git tag` 或压缩包保留上一版；异常时 `pm2 stop dd-web` 切回旧版。
- **上线验证**：
  - 浏览器控制台无报错；
  - 移动端（375px 宽）汉堡菜单可展开、分类页导航可换行；
  - 所有图片正常加载（无破图白块）；
  - 提交一次预约表单，确认 `data.json` 新增记录；
  - `curl http://localhost:3000/api/health` 返回 ok。
- **百度收录验证**：提交 sitemap 后，在百度搜索资源平台看「抓取诊断 / 索引量」。

---

## 七、本版相对原始代码的修复

1. **破图修复**：首页 Hero、4 张「设计干货」卡片、分类落地页 Hero、农村别墅效果图专题页、
   4 篇文章 Hero，原引用了不存在的 `.svg`（占位图脚本未执行），现已改用
   `public/images/*.png` 真实 AI 配图，并保留渐变兜底，绝不破图。
2. **案例弹窗缩略图**改用项目真实配图。
3. **无障碍 / 响应式增强**：增加键盘焦点可见样式（`:focus-visible`）、锚点滚动偏移
   （`scroll-padding-top`），移动端分类页导航由「隐藏」改为「可换行展示」。
