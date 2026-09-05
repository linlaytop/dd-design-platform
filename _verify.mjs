const get = (t) => fetch("http://localhost:3000" + t).then((r) => r.text());

(async () => {
  const js = await get("/app.js");
  const html = await get("/index.html");
  const css = await get("/styles.css");
  const checks = [
    ["app.js 含 openCase 函数", js.includes("function openCase")],
    ["app.js 含案例点击监听", js.includes("data-case") && js.includes("#worksGrid")],
    ["app.js 案例卡片带 data-case", js.includes('data-case="${p.id}"')],
    ["index.html 含 caseModal", html.includes('id="caseModal"') && html.includes("caseModalBody")],
    ["styles.css 案例卡可点击手型", css.includes("cursor: pointer")],
    ["styles.css 案例卡 hover 抬升", css.includes("translateY(-4px)")],
  ];
  checks.forEach(([n, ok]) => console.log((ok ? "PASS" : "FAIL") + " " + n));
  console.log("ALL_PASS:", checks.every((c) => c[1]));
})().catch((e) => { console.error("VERIFY_ERROR:", e.message); process.exit(1); });
