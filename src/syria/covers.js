// Generated J-cards in the spirit of 80s/90s Syrian bootleg cassettes: loud flat colour, a halftone singer,
// a big Arabic title, a "STEREO" box and a catalogue number, then print wear on top.
const W = 640, H = 1000;
const INKS = [
  ["#d7261e", "#f4d21f", "#111"], ["#0f6b3a", "#f2ead2", "#d7261e"], ["#1b3fa6", "#f6d64a", "#fff"],
  ["#e8508f", "#151515", "#f6e7a8"], ["#f0e6cc", "#c21f1f", "#13306e"], ["#141414", "#e5c13a", "#e23a2a"],
  ["#f4a21b", "#2a1a5e", "#fff"], ["#2b8a8a", "#f7efe0", "#1a1a1a"],
];
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

function portrait(g, cx, cy, r, ink, rnd) {
  // halftone silhouette: head + shoulders made of dots
  const off = document.createElement("canvas"); off.width = W; off.height = H; const o = off.getContext("2d");
  const grd = o.createRadialGradient(cx - r * .25, cy - r * .35, r * .1, cx, cy, r * 1.2);
  grd.addColorStop(0, "#fff"); grd.addColorStop(1, "#000");
  o.fillStyle = "#000"; o.fillRect(0, 0, W, H);
  o.fillStyle = grd;
  o.beginPath(); o.ellipse(cx, cy - r * .2, r * .52, r * .66, rnd() * .2 - .1, 0, Math.PI * 2); o.fill();
  o.beginPath(); o.ellipse(cx, cy + r * 1.05, r * 1.15, r * .62, 0, Math.PI, 0); o.fill();
  // moustache / hair hints
  o.fillStyle = "rgba(0,0,0,.55)"; o.fillRect(cx - r * .22, cy + r * .12, r * .44, r * .07);
  o.beginPath(); o.ellipse(cx, cy - r * .7, r * .5, r * .22, 0, Math.PI, 0); o.fill();
  const d = o.getImageData(0, 0, W, H).data, step = 9;
  g.fillStyle = ink;
  for (let y = cy - r * 1.6; y < cy + r * 1.7; y += step) for (let x = cx - r * 1.4; x < cx + r * 1.4; x += step) {
    const i = ((y | 0) * W + (x | 0)) * 4; const v = d[i] / 255;
    if (v > .02) { g.beginPath(); g.arc(x, y, step * .55 * Math.sqrt(v), 0, Math.PI * 2); g.fill(); }
  }
}

function wear(g, rnd) {
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 34; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  g.globalCompositeOperation = "multiply";
  const v = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75);
  v.addColorStop(0, "rgba(255,255,255,0)"); v.addColorStop(1, "rgba(120,90,50,.35)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, H * (.3 + rnd() * .4)); g.lineTo(W, H * (.3 + rnd() * .4)); g.stroke();
}

export function makeCover(t, i) {
  const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  const rnd = rng(i + 7), [bg, fg, ac] = INKS[i % INKS.length], style = i % 3;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.textAlign = "center"; g.direction = "rtl";
  if (style === 0) {
    g.fillStyle = fg; g.fillRect(0, 0, W, 120);
    g.fillStyle = bg; g.font = "700 34px 'Archivo', sans-serif"; g.direction = "ltr"; g.fillText("STEREO  ·  " + t.len, W / 2, 75);
    portrait(g, W / 2, 430, 190, fg, rnd);
    g.direction = "rtl"; g.fillStyle = ac; g.font = "150px 'Lalezar', serif"; g.fillText(t.ar, W / 2, 820);
    g.fillStyle = fg; g.font = "44px 'Lalezar', serif"; g.fillText(t.city, W / 2, 900);
  } else if (style === 1) {
    for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? fg : ac; g.fillRect(0, 140 + k * 34, W, 17); }
    g.fillStyle = bg; g.beginPath(); g.arc(W / 2, 300, 190, 0, Math.PI * 2); g.fill();
    portrait(g, W / 2, 300, 150, fg, rnd);
    g.fillStyle = fg; g.font = "170px 'Lalezar', serif"; g.fillText(t.ar, W / 2, 720);
    g.fillStyle = ac; g.fillRect(60, 770, W - 120, 8);
    g.direction = "ltr"; g.font = "800 40px 'Archivo', sans-serif"; g.fillText(t.en.toUpperCase(), W / 2, 850);
    g.font = "500 26px 'Archivo', sans-serif"; g.fillText("SH-" + (1000 + i * 37) + "  ·  " + t.year, W / 2, 920);
  } else {
    g.fillStyle = fg; g.font = "260px 'Lalezar', serif"; g.save(); g.translate(W * .78, H * .5); g.rotate(-Math.PI / 2);
    g.fillText(t.ar, 0, 70); g.restore();
    portrait(g, W * .34, 520, 170, ac, rnd);
    g.fillStyle = ac; g.fillRect(0, H - 110, W, 110);
    g.fillStyle = bg; g.direction = "ltr"; g.textAlign = "left"; g.font = "800 36px 'Archivo', sans-serif";
    g.fillText(t.genre + " · " + t.cityEn.toUpperCase(), 36, H - 46);
    g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(36, 40, 170, 64);
    g.fillStyle = fg; g.font = "700 30px 'Archivo', sans-serif"; g.fillText("STEREO", 58, 84);
  }
  wear(g, rnd);
  return c.toDataURL("image/jpeg", .86);
}
