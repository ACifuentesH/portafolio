// ASCII stage: renders scenes as character art on one canvas, and morphs one character picture into another.
// A scene is drawn as "ink" (white on black) into a tiny offscreen canvas, one pixel per character cell;
// each cell's ink picks a glyph from a density ramp. Real text is stamped on top as actual letters.

const RAMP = " .'`,-:;~=+*7Y/(9XEW#@";
const GLITCH = "*|%:#~[&>+.}=/@<^";
const smooth = x => (x = Math.min(1, Math.max(0, x)), x * x * (3 - 2 * x));

export class AsciiStage {
  constructor(canvas) {
    this.cv = canvas;
    this.cx = canvas.getContext("2d");
    this.ink = document.createElement("canvas");          // one pixel per cell
    this.ix = this.ink.getContext("2d", { willReadFrequently: true });
    this.hi = document.createElement("canvas");           // 4x supersampled scratch for smooth shapes
    this.hx = this.hi.getContext("2d");
    this.CW = 7; this.CH = 12;
    this.particles = null;
  }

  resize(W, H) {
    const D = Math.min(devicePixelRatio || 1, 2);
    this.W = W; this.H = H;
    this.cv.width = W * D; this.cv.height = H * D;
    this.cx.setTransform(D, 0, 0, D, 0, 0);
    this.cols = Math.ceil(W / this.CW); this.rows = Math.ceil(H / this.CH);
    this.ink.width = this.cols; this.ink.height = this.rows;
    this.hi.width = this.cols * 4; this.hi.height = this.rows * 4;
    this.silhouette = null; this.particles = null;
  }

  // draw(ctx) paints the scene in screen pixels on black: white = ink, red channel only = accent
  sample(draw, stamps) {
    const { hx, hi, ix, cols, rows, W, H } = this;
    hx.setTransform(1, 0, 0, 1, 0, 0); hx.fillStyle = "#000"; hx.fillRect(0, 0, hi.width, hi.height);
    hx.setTransform(hi.width / W, 0, 0, hi.height / H, 0, 0);
    draw(hx);
    ix.imageSmoothingEnabled = true; ix.imageSmoothingQuality = "high";
    ix.clearRect(0, 0, cols, rows); ix.drawImage(hi, 0, 0, cols, rows);
    const px = ix.getImageData(0, 0, cols, rows).data;
    const chars = new Array(cols * rows), red = new Uint8Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      const r = px[i * 4] / 255, g = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255;
      const v = Math.max(r, g, b);
      // light jitter so flat areas break into texture like hand-made ASCII
      const j = ((i * 2654435761) >>> 0) % 997 / 997 * .08 - .04;
      const k = v < .045 ? 0 : Math.min(RAMP.length - 1, Math.max(1, Math.round(Math.pow(Math.min(1, v + j), .85) * (RAMP.length - 1))));
      chars[i] = RAMP[k];
      red[i] = r > .45 && g < .25 ? 1 : 0;
    }
    for (const s of stamps || []) {               // real letters, written into the grid
      const r0 = Math.round(s.y / this.CH), c0 = Math.round(s.x / this.CW);
      if (r0 < 0 || r0 >= rows) continue;
      const text = s.upper ? s.text.toUpperCase() : s.text;
      for (let k = 0; k < text.length; k++) {
        const c = c0 + k; if (c < 0 || c >= cols || (s.maxX && c * this.CW > s.maxX) || (s.minX && c * this.CW < s.minX)) continue;
        if (text[k] === " " && !s.keepSpace) continue;
        chars[r0 * cols + c] = text[k]; red[r0 * cols + c] = s.red ? 1 : 0;
      }
    }
    return { chars, red };
  }

  paint(grid, look) {
    const { cx, cols, rows, CW, CH, W, H } = this;
    cx.fillStyle = look.bg; cx.fillRect(0, 0, W, H);
    cx.font = `500 ${CH - 1}px "IBM Plex Mono", ui-monospace, monospace`; cx.textBaseline = "top";
    for (const pass of [0, 1]) {
      cx.fillStyle = pass ? look.red : look.ink;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c, ch = grid.chars[i];
        if (ch === " " || grid.red[i] !== pass) continue;
        cx.fillText(ch, c * CW, r * CH);
      }
    }
  }

  // a fashion silhouette: wide-brim hat, cinched long coat, hand on hip, red bag; shaded from the left
  drawSilhouette(ctx) {
    const H = this.H, fh = H * .9, fw = fh * .5, ox = this.W * .5 - fw * .5, oy = H * .05;
    const P = (u, v) => [ox + u * fw, oy + v * fh];
    const path = pts => { ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }); ctx.closePath() };
    const curve = (start, segs) => { ctx.beginPath(); ctx.moveTo(...P(...start)); for (const s of segs) s.length === 6 ? ctx.bezierCurveTo(...P(s[0], s[1]), ...P(s[2], s[3]), ...P(s[4], s[5])) : ctx.lineTo(...P(s[0], s[1])); ctx.closePath() };
    const shade = ctx.createLinearGradient(ox, 0, ox + fw, 0);
    shade.addColorStop(0, "rgb(120,120,120)"); shade.addColorStop(.55, "rgb(230,230,230)"); shade.addColorStop(1, "rgb(170,170,170)");
    ctx.fillStyle = shade;
    // hat
    ctx.beginPath(); ctx.ellipse(...P(.5, .075), fw * .36, fh * .03, -.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(...P(.5, .05), fw * .15, fh * .045, 0, 0, Math.PI * 2); ctx.fill();
    // head + neck
    ctx.beginPath(); ctx.ellipse(...P(.5, .125), fw * .085, fh * .055, 0, 0, Math.PI * 2); ctx.fill();
    path([[.465, .16], [.535, .16], [.54, .2], [.46, .2]]); ctx.fill();
    // coat: broad shoulders, cinched waist, long flare
    curve([.29, .215], [[.4, .19, .6, .19, .71, .215], [.69, .42], [.68, .47, .74, .66, .79, .8], [.21, .8], [.26, .66, .32, .47, .31, .42]]); ctx.fill();
    // arm on the hip (leaves a triangle of air) and the hanging arm
    curve([.3, .23], [[.17, .28, .13, .37, .21, .43], [.33, .44], [.32, .4], [.255, .385], [.24, .33, .27, .285, .32, .27]]); ctx.fill();
    curve([.7, .23], [[.78, .29, .8, .41, .79, .51], [.745, .515], [.745, .42, .725, .32, .685, .275]]); ctx.fill();
    // legs and heels
    path([[.4, .79], [.445, .79], [.44, .955], [.405, .955]]); ctx.fill();
    path([[.535, .79], [.58, .79], [.61, .945], [.575, .955]]); ctx.fill();
    path([[.39, .955], [.455, .955], [.455, .975], [.38, .97]]); ctx.fill();
    path([[.565, .95], [.63, .945], [.635, .965], [.56, .972]]); ctx.fill();
    // tailoring: lapels, belt, seams drawn darker so they read as lines in the type
    ctx.strokeStyle = "rgba(0,0,0,.65)"; ctx.lineWidth = fh * .006;
    ctx.beginPath(); ctx.moveTo(...P(.44, .2)); ctx.lineTo(...P(.5, .35)); ctx.lineTo(...P(.56, .2)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...P(.31, .425)); ctx.lineTo(...P(.69, .425)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...P(.5, .35)); ctx.lineTo(...P(.5, .8)); ctx.stroke();
    // the red bag (the booking's red ends up here)
    ctx.fillStyle = "rgb(255,0,0)";
    ctx.beginPath(); ctx.roundRect(...P(.72, .5), fw * .13, fh * .085, fw * .02); ctx.fill();
    ctx.strokeStyle = "rgb(255,0,0)"; ctx.lineWidth = fh * .006;
    ctx.beginPath(); ctx.arc(...P(.785, .5), fw * .045, Math.PI, 0); ctx.stroke();
  }

  silhouetteGrid() {
    if (!this.silhouette) this.silhouette = this.sample(c => this.drawSilhouette(c), [
      { x: this.W * .5 - 210, y: this.H * .93, text: "NOW: FASHION", keepSpace: true }]);
    return this.silhouette;
  }

  // characters of grid A fly to the cells of grid B; m = 0..1
  morph(A, B, m, time, look) {
    const { cols, CW, CH } = this;
    if (!this.particles) {
      const pts = g => { const out = []; g.chars.forEach((ch, i) => { if (ch !== " ") out.push({ c: i % cols, r: (i / cols) | 0, ch, red: g.red[i] }) }); return out };
      const a = pts(A), b = pts(B);
      // red goes to red, the rest pairs by horizontal order so the flow reads as a sweep
      const pair = (from, to) => {
        from.sort((p, q) => p.c - q.c || p.r - q.r); to.sort((p, q) => p.c - q.c || p.r - q.r);
        const n = Math.max(from.length, to.length), out = [];
        for (let i = 0; i < n; i++) {
          const f = from[Math.floor(i * from.length / n)], t = to[Math.floor(i * to.length / n)];
          if (!f || !t) continue;
          out.push({ x0: f.c * CW, y0: f.r * CH, x1: t.c * CW, y1: t.r * CH, ch0: f.ch, ch1: t.ch, red0: f.red, red1: t.red,
                     d: (t.r / this.rows) * .35 + (((i * 2654435761) >>> 0) % 1000) / 1000 * .2 });
        }
        return out;
      };
      const aRed = a.filter(p => p.red), aInk = a.filter(p => !p.red);
      // no red left on screen? the bag borrows ink characters and turns red as they land
      this.particles = [...pair(aInk, b.filter(p => !p.red)), ...pair(aRed.length ? aRed : aInk.filter((_, i) => i % 3 === 0), b.filter(p => p.red))];
    }
    const { cx, W, H } = this;
    cx.fillStyle = look.bg; cx.fillRect(0, 0, W, H);
    cx.font = `500 ${CH - 1}px "IBM Plex Mono", ui-monospace, monospace`; cx.textBaseline = "top";
    const tick = Math.floor(time * 24);
    for (const pass of [0, 1]) {
      cx.fillStyle = pass ? look.red : look.ink;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i], t = smooth((m - p.d) / .45), red = t < .6 ? p.red0 : p.red1;
        if (red !== pass) continue;
        const x = p.x0 + (p.x1 - p.x0) * t, y = p.y0 + (p.y1 - p.y0) * t - Math.sin(Math.PI * t) * 40 * (p.d - .2);
        const ch = t <= 0 ? p.ch0 : t >= 1 ? p.ch1 : GLITCH[(i + tick) % GLITCH.length];
        cx.fillText(ch, x, y);
      }
    }
  }

  reset() { this.particles = null }
}
