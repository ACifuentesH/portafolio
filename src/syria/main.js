import { gsap } from "gsap";
import { TAPES } from "./data.js";
import { makeCover } from "./covers.js";

const $ = (id) => document.getElementById(id);
const shop = $("shop"), stage = $("stage"), heroType = $("heroType"), intro = $("intro");
const N = TAPES.length, AR = 0.64; // J-card front: width / height
const PHRASE = "أشرطة الموسيقى السورية";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// palettes lifted from the references: acid yellow poster, red/pink burst, blue/lime map, mustard + cyan snake
const PALETTES = [
  { bg: "#e2ee12", ink: "#0b0b0b", snake: "#0b0b0b", snakeInk: "#e2ee12" },
  { bg: "#e5352b", ink: "#111111", snake: "#f27bb8", snakeInk: "#111111" },
  { bg: "#2c5fcc", ink: "#d6e24a", snake: "#d6e24a", snakeInk: "#2c5fcc" },
  { bg: "#dfc64c", ink: "#141414", snake: "#52e5f0", snakeInk: "#ffffff" },
];
let pal = 0;
function setPalette(i) {
  pal = (i + PALETTES.length) % PALETTES.length; const p = PALETTES[pal], s = document.documentElement.style;
  s.setProperty("--bg", p.bg); s.setProperty("--ink", p.ink); s.setProperty("--snake", p.snake); s.setProperty("--snake-ink", p.snakeInk);
}

/* ---------- geometry ---------- */
let W = innerWidth, H = innerHeight, S, BH, BW;
function measure() {
  W = innerWidth; H = innerHeight; const mob = W < 760;
  S = mob ? { x: 16, y: 72, w: W - 32, h: H - 72 - 170 }
          : { x: W * 0.29, y: 84, w: W * 0.5, h: H - 84 - 44 };
  BH = S.h; BW = BH * AR;
}
const wrap = (d) => { d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; };

function layout(mode, cur) {
  const cx = S.x + S.w / 2, cy = S.y + S.h / 2, out = [];
  if (mode === "grid") {
    let best = { h: 0 }; const g = Math.max(6, S.w * 0.012);
    for (let c = 2; c <= 8; c++) { const r = Math.ceil(N / c);
      const h = Math.min((S.h - (r - 1) * g) / r, ((S.w - (c - 1) * g) / c) / AR); if (h > best.h) best = { c, r, h }; }
    const { c, r, h } = best, w = h * AR, x0 = cx - (c * w + (c - 1) * g) / 2 + w / 2, y0 = cy - (r * h + (r - 1) * g) / 2 + h / 2;
    for (let i = 0; i < N; i++) out.push({ x: x0 + (i % c) * (w + g), y: y0 + Math.floor(i / c) * (h + g), h, r: 0, o: 1, z: 1 });
  } else if (mode === "row" || mode === "column") {
    const row = mode === "row", h = S.h * (row ? 0.24 : 0.19), w = h * AR, g = h * 0.08;
    for (let i = 0; i < N; i++) { const d = wrap(i - cur);
      out.push({ x: row ? cx + d * (w + g) : cx, y: row ? cy : cy + d * (h + g), h, r: 0, o: 1, z: 10 - Math.abs(d) }); }
  } else if (mode === "single") {
    // a big messy pile in the empty left field: every card that flicks past stays underneath, slightly askew
    const mob = W < 760, h = S.h * (mob ? 0.62 : 0.66), px = mob ? cx : W * 0.37, py = S.y + S.h * (mob ? 0.5 : 0.42);
    for (let i = 0; i < N; i++) {
      const k = pile.indexOf(i), top = i === cur;
      out.push({ x: px + (top ? 0 : (((i * 37) % 9) - 4) * h * 0.03), y: py + (top ? 0 : (((i * 29) % 7) - 3) * h * 0.025), h,
        r: top ? -9 : -16 + ((i * 53) % 24), o: k >= 0 || top ? 1 : 0, z: top ? 60 : 10 + k });
    }
  } else { // hero
    for (let i = 0; i < N; i++) out.push({ x: cx, y: cy, h: S.h, r: 0, o: i === cur ? 1 : 0, z: i === cur ? 50 : 1 });
  }
  return out;
}

/* ---------- tiles ---------- */
const tiles = TAPES.map((t, i) => {
  const el = document.createElement("button"); el.className = "tile"; el.setAttribute("aria-label", `${t.en} — ${t.ar}`);
  el.addEventListener("click", () => { manual(); if (mode === "hero" && cur === i) go("grid"); else { cur = i; go("hero"); } });
  stage.appendChild(el); return el;
});
function sizeTiles() { tiles.forEach((el) => { el.style.width = BW + "px"; el.style.height = BH + "px"; }); }

let mode = "grid", cur = 0;
function place(m, { dur = 1.05, instant = false } = {}) {
  const L = layout(m, cur);
  tiles.forEach((el, i) => {
    const p = L[i], vars = { x: p.x - BW / 2, y: p.y - BH / 2, scale: p.h / BH, rotation: p.r, autoAlpha: p.o };
    el.style.zIndex = p.z;
    if (instant || reduce) gsap.set(el, { ...vars, overwrite: true });
    else gsap.to(el, { ...vars, duration: dur, ease: "expo.inOut", delay: Math.min(Math.abs(wrap(i - cur)), 8) * 0.018, overwrite: true });
  });
}

/* ---------- hero type + info ---------- */
const pad = (n) => String(n).padStart(2, "0");
function syncInfo() {
  const t = TAPES[cur];
  $("iNum").textContent = pad(cur + 1); $("iTot").textContent = pad(N);
  $("iEn").textContent = t.en; $("iAr").textContent = t.ar;
  $("iTxt").textContent = `${t.artist}. ${t.genre}${t.year ? ", " + t.year : ""}. Original Syrian cassette, scan SMA ${t.id} from the Syrian Cassette Archives. Side A / Side B, hiss included.`;
  $("iPrice").textContent = "$" + t.price;
  $("htAr").textContent = t.tag; $("htY").textContent = t.year ? "©" + t.year : "SMA " + t.id; $("htL").textContent = t.genre.toLowerCase();
}
function showHeroType(on) {
  const h = S.h, w = h * AR;
  Object.assign(heroType.style, { left: S.x + S.w / 2 - w / 2 + "px", top: S.y + "px", width: w + "px", height: h + "px" });
  gsap.to(heroType, { autoAlpha: on ? 1 : 0, duration: on ? 0.5 : 0.2, delay: on ? 0.7 : 0, overwrite: true });
}

/* ---------- modes ---------- */
let flick = null, pile = [];
function go(m, opts = {}) {
  if (m === "single" && mode !== "single") pile = [cur];
  if (flick) { flick.kill(); flick = null; }
  mode = m; syncInfo(); place(m, opts); showHeroType(m === "hero");
  document.querySelectorAll(".modes [data-m]").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
  if (m === "single" && !reduce) { // the changing-images shuffle: the top card flicks through the stack
    let k = 0; flick = gsap.delayedCall(0.75, function tick() {
      cur = (cur + 1) % N; pile.push(cur); syncInfo(); place("single", { instant: true });
      const el = tiles[cur], sc = gsap.getProperty(el, "scale");
      gsap.fromTo(el, { scale: sc * 1.14, autoAlpha: 0 }, { scale: sc, autoAlpha: 1, duration: 0.14, ease: "power2.out" });
      if (++k < 11) flick = gsap.delayedCall(0.07 + k * 0.012, tick);
    });
  }
}
function step(d) { manual(); cur = (cur + d + N) % N; go(mode === "grid" ? "hero" : mode, { dur: 0.7 }); }

/* ---------- autoplay: grid → row → shuffle → cover → column → grid ---------- */
const SEQ = [["grid", 2.6], ["row", 1.9], ["single", 2.1], ["hero", 2.9], ["column", 1.9]];
let auto = !reduce, seqI = 0, timer = null;
function runSeq() {
  timer?.kill(); if (!auto) return;
  const [m, t] = SEQ[seqI];
  if (m === "hero") setPalette(pal + 1);
  if (m === "grid" && seqI === 0 && mode !== "grid") cur = (cur + 1) % N;
  go(m); timer = gsap.delayedCall(t, () => { seqI = (seqI + 1) % SEQ.length; runSeq(); });
}
function manual() { if (!auto) return; auto = false; timer?.kill(); $("auto").classList.remove("on"); }
$("auto").addEventListener("click", () => { auto = !auto; $("auto").classList.toggle("on", auto);
  if (auto) { seqI = Math.max(0, SEQ.findIndex(([m]) => m === mode)); seqI = (seqI + 1) % SEQ.length; runSeq(); } else timer?.kill(); });
document.querySelectorAll(".modes [data-m]").forEach((b) => b.addEventListener("click", () => { manual(); if (b.dataset.m === "hero") setPalette(pal + 1); go(b.dataset.m); }));
$("prev").addEventListener("click", () => step(-1));
$("next").addEventListener("click", () => step(1));
addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
  else if (e.key >= "1" && e.key <= "5") { manual(); go(SEQ[+e.key - 1][0]); }
  else if (e.key === "Escape") { $("bag").hidden = true; }
});

/* ---------- bag ---------- */
const bag = [];
function renderBag() {
  $("bagN").textContent = bag.length;
  $("bagList").innerHTML = bag.map((i) => `<li><span>${TAPES[i].ar}</span><span>${TAPES[i].en} — $${TAPES[i].price}</span></li>`).join("") || "<li>Empty — add a tape</li>";
  $("bagTotal").textContent = "$" + bag.reduce((s, i) => s + TAPES[i].price, 0);
}
$("addBtn").addEventListener("click", () => { bag.push(cur); renderBag(); gsap.fromTo("#bagN", { scale: 1.6 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }); });
$("bagBtn").addEventListener("click", () => { $("bag").hidden = !$("bag").hidden; });
$("bagClose").addEventListener("click", () => { $("bag").hidden = true; });

/* ---------- the snake: a ribbon shaped like a looping و with the title running along it ---------- */
const snakePath = $("snakePath"), snakeText = $("snakeText"), snakeBody = document.querySelector(".snake-body");
let snakeLen = 1, phraseLen = 1;
function catmull(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}
function buildSnake() {
  const u = (x, y) => [x * W, y * H];
  // stays on the right: loops like a و behind the covers and never crosses the info block
  const pts = W < 760
    ? [u(1.1, 0.12), u(0.7, 0.1), u(0.45, 0.2), u(0.55, 0.34), u(0.75, 0.26), u(0.62, 0.12), u(0.3, 0.2), u(0.2, 0.42), u(0.6, 0.5), u(1.1, 0.46)]
    : [u(1.05, 0.06), u(0.8, 0.08), u(0.64, 0.22), u(0.7, 0.4), u(0.84, 0.34), u(0.8, 0.17), u(0.62, 0.14), u(0.5, 0.32),
       u(0.5, 0.56), u(0.66, 0.7), u(0.82, 0.78), u(0.74, 0.96), u(0.6, 1.08)];
  snakePath.setAttribute("d", catmull(pts));
  const sw = Math.min(W, H) * 0.068, fs = sw * 0.42;
  snakeBody.setAttribute("stroke-width", sw);
  const t = snakeText.parentNode; t.setAttribute("font-size", fs); t.setAttribute("dy", fs * 0.34);
  snakeLen = snakePath.getTotalLength();
  snakeText.textContent = (PHRASE + " · ").repeat(2);
  phraseLen = snakeText.getComputedTextLength() / 2 || 1;
  snakeText.textContent = (PHRASE + " · ").repeat(Math.ceil(snakeLen / phraseLen) + 2);
}
let off = 0, last = performance.now();
function snakeLoop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!reduce) { off = (off + dt * 46) % phraseLen; snakeText.setAttribute("startOffset", (-phraseLen + off).toFixed(1)); }
  requestAnimationFrame(snakeLoop);
}

/* ---------- intro: the title assembles at random, letter by letter, then dissolves ---------- */
function playIntro() {
  intro.innerHTML = ""; const spans = [], rows = Math.max(8, Math.round(H / 64));
  for (let r = 0; r < rows; r++) {
    const line = document.createElement("div");
    for (const ch of PHRASE + "  " + PHRASE) { const s = document.createElement("span"); s.textContent = ch; line.appendChild(s); if (ch.trim()) spans.push(s); }
    intro.appendChild(line);
  }
  gsap.set(intro, { autoAlpha: 1 });
  if (reduce) { spans.forEach((s) => s.classList.add("on")); gsap.to(intro, { autoAlpha: 0, delay: 0.8, duration: 0.4 }); return; }
  const order = spans.map((s) => [Math.random(), s]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);
  const tl = gsap.timeline();
  order.forEach((s, k) => tl.call(() => s.classList.add("on"), null, (k / order.length) ** 0.8 * 1.7));
  order.sort(() => Math.random() - 0.5).forEach((s, k) => tl.call(() => s.classList.remove("on"), null, 2.3 + (k / order.length) * 0.8));
  tl.to(intro, { autoAlpha: 0, duration: 0.25 }, 3.15);
  return tl;
}
$("logo").addEventListener("click", () => playIntro());

document.querySelector(".spine").innerHTML = [..."SYRIAN TAPE ARCHIVE"].map((c) => `<i>${c === " " ? "&nbsp;" : c}</i>`).join("");

/* ---------- boot ---------- */
async function boot() {
  setPalette(0); measure(); sizeTiles(); renderBag(); syncInfo();
  playIntro();
  const fonts = ["400 40px Lalezar", "800 40px Archivo", "700 40px 'Reem Kufi'"].map((f) => document.fonts.load(f));
  await Promise.race([Promise.all(fonts), new Promise((r) => setTimeout(r, 2500))]);
  // real scans; preload so the first morphs never show empty cards
  await Promise.race([Promise.all(TAPES.map((t) => t.img && new Promise((r) => { const im = new Image(); im.onload = im.onerror = r; im.src = t.img; }))),
    new Promise((r) => setTimeout(r, 4000))]);
  TAPES.forEach((t, i) => { tiles[i].style.backgroundImage = `url(${t.img || makeCover(t, i)})`; });
  buildSnake(); requestAnimationFrame(snakeLoop);
  go("grid", { instant: true });
  gsap.from(tiles, { autoAlpha: 0, scale: 0.05, duration: 0.9, ease: "expo.out", stagger: 0.03, delay: 2.9 });
  if (auto) timer = gsap.delayedCall(3.4 + SEQ[0][1], () => { seqI = 1; runSeq(); });
}
let rz;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { measure(); sizeTiles(); buildSnake(); place(mode, { instant: true }); showHeroType(mode === "hero"); }, 120); });
boot();
