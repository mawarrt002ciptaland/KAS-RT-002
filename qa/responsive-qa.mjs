import puppeteer from "puppeteer";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const PORT = 4173;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  const f = path.join(DIST, p);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) {
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] ?? "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(path.join(DIST, "index.html")).pipe(res);
  }
});
await new Promise((r) => server.listen(PORT, r));

const VIEWPORTS = [[320, 568], [360, 800], [375, 812], [390, 844], [412, 915], [430, 932], [768, 1024], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]];
const VIEWS = ["dashboard", "pemasukan", "pengeluaran", "tagihan", "warga", "kegiatan", "kwitansi", "laporan", "trafik", "marketplace", "pengaduan", "pengumuman", "struktur", "whatsapp", "tautan", "pengaturan"];
const WARGA_TABS = ["home", "tagihan", "pengumuman", "aduan", "profil"];
const SHOT = process.argv.includes("--shots");
fs.mkdirSync("qa/shots", { recursive: true });

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on("request", (r) => (r.url().startsWith("http://localhost") ? r.continue() : r.abort()));
page.setDefaultNavigationTimeout(15000);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

async function measure() {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const vw = window.innerWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed" && r.left < 0) continue;
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}[r=${Math.round(r.right)}]`);
        if (offenders.length > 4) break;
      }
    }
    return { vw, docW: doc.scrollWidth, bodyW: document.body.scrollWidth, offenders };
  });
}

const failures = [];
let checks = 0;
for (const [w, h] of VIEWPORTS) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 1024 });
  for (const role of ["admin", "warga"]) {
    const targets = role === "admin" ? VIEWS : WARGA_TABS;
    for (const t of targets) {
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
      await page.evaluate((role, t) => {
        localStorage.setItem("rt002-ui", JSON.stringify({ state: { role, activeView: role === "admin" ? t : "dashboard", wargaTab: role === "warga" ? t : "home", theme: "light", installDismissed: true, readNotif: [], sidebarCollapsed: false }, version: 0 }));
      }, role, t);
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: "load" });
      await new Promise((r) => setTimeout(r, 450));
      const m = await measure();
      checks++;
      const ok = m.docW <= m.vw && m.bodyW <= m.vw && m.offenders.length === 0;
      if (!ok) failures.push({ w, h, role, t, ...m });
      if (SHOT && ([360, 768, 1440].includes(w))) await page.screenshot({ path: `qa/shots/${w}-${role}-${t}.png`, fullPage: false });
    }
  }
  console.log(`✓ ${w}x${h} checked`);
}

// Interaction checks at 360px: drawer, search, notif, quick actions, wizard modal
await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.setItem("rt002-ui", JSON.stringify({ state: { role: "admin", activeView: "pemasukan", theme: "light", installDismissed: true, readNotif: [] }, version: 0 })));
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "load" });
await new Promise((r) => setTimeout(r, 450));
const interactions = [];
async function tryOpen(label, selector, waitFor) {
  await page.click(selector);
  await new Promise((r) => setTimeout(r, 450));
  const visible = await page.$(waitFor);
  const m = await measure();
  interactions.push({ label, visible: !!visible, docW: m.docW, vw: m.vw, offenders: m.offenders });
  if (SHOT) await page.screenshot({ path: `qa/shots/360-interaction-${label}.png` });
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 350));
}
await tryOpen("drawer", 'button[aria-label="Buka menu"]', '[role="dialog"][aria-label="Menu navigasi"]');
await tryOpen("search", 'button[aria-label="Cari data"]', '[role="dialog"][aria-label="Pencarian"]');
await tryOpen("notif", 'button[aria-label^="Notifikasi"]', '[role="dialog"]');
await tryOpen("quick", 'button[aria-label="Aksi cepat"]', '[role="dialog"]');
// wizard
const btn = await page.$$('button');
for (const b of btn) { const txt = await page.evaluate((el) => el.textContent, b); if (txt && txt.includes("Catat Pemasukan")) { await b.click(); break; } }
await new Promise((r) => setTimeout(r, 500));
{
  const m = await measure();
  const dlg = await page.$('[role="dialog"]');
  interactions.push({ label: "wizard", visible: !!dlg, docW: m.docW, vw: m.vw, offenders: m.offenders });
  if (SHOT) await page.screenshot({ path: `qa/shots/360-interaction-wizard.png` });
}

console.log(`\nChecks: ${checks}, failures: ${failures.length}`);
for (const f of failures) console.log("✗", f.w, f.role, f.t, "docW", f.docW, "bodyW", f.bodyW, f.offenders.join(" | "));
console.log("\nInteractions:");
for (const i of interactions) console.log(i.visible && i.docW <= i.vw && i.offenders.length === 0 ? "✓" : "✗", i.label, i.visible ? "opened" : "NOT OPENED", `docW=${i.docW}/${i.vw}`, i.offenders.join(" | "));
console.log("\nPage errors:", errors.length ? errors.slice(0, 10) : "none");
await browser.close();
server.close();
process.exit(failures.length || interactions.some((i) => !i.visible) ? 1 : 0);
