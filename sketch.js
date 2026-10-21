// Background sketch: a quiet network of connected nodes. The nodes drift on a
// Perlin flow field; nearby pairs draw thin links that fade with distance.
// Soft gold accent, dark navy background. Hover attracts the nearest nodes.
// Reduced-motion users get a static pattern (no draw loop).

const CFG = {
  bgTop:    "#0b1020",
  bgBottom: "#060915",
  node:     "#ffc857",
  link:     "#ffc857",
  density:  0.000085,      // nodes per pixel of canvas
  linkDist: 150,           // px
  speed:    0.35,          // base drift speed
  noiseScl: 0.0019,        // flow-field frequency
  mouseR:   260,           // mouse attraction radius
  mouseF:   0.065,         // mouse attraction strength
};

let nodes = [];
let w = 0, h = 0;
let reduceMotion = false;

function setup() {
  const c = createCanvas(windowWidth, windowHeight);
  c.parent(document.body);
  // Reuse the <canvas id="bg"> element so our CSS positioning applies.
  const existing = document.getElementById("bg");
  if (existing) {
    existing.replaceWith(c.canvas);
    c.canvas.id = "bg";
  }
  w = width; h = height;
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  seed();
  if (reduceMotion) { drawFrame(); noLoop(); }
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
}

function seed() {
  nodes = [];
  const n = Math.max(40, Math.min(140, Math.floor(w * h * CFG.density)));
  for (let i = 0; i < n; i++) {
    nodes.push({
      x: random(w), y: random(h),
      vx: 0, vy: 0,
      phase: random(TWO_PI),
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  w = width; h = height;
  seed();
  if (reduceMotion) drawFrame();
}

function draw() { drawFrame(); }

function drawFrame() {
  // Gradient background by stacking two translucent rects — p5 has no gradient primitive.
  background(CFG.bgBottom);
  noStroke();
  for (let i = 0; i < h; i += 2) {
    const t = i / h;
    const col = lerpColor(color(CFG.bgTop), color(CFG.bgBottom), t);
    fill(col);
    rect(0, i, w, 2);
  }

  const t = frameCount * 0.0025;
  const mx = mouseX, my = mouseY;
  const haveMouse = mx >= 0 && my >= 0 && mx <= w && my <= h;

  // --- update ---
  for (const p of nodes) {
    const a = noise(p.x * CFG.noiseScl, p.y * CFG.noiseScl, t) * TWO_PI * 2;
    p.vx += Math.cos(a) * CFG.speed * 0.05;
    p.vy += Math.sin(a) * CFG.speed * 0.05;
    if (haveMouse) {
      const dx = mx - p.x, dy = my - p.y;
      const d = Math.hypot(dx, dy);
      if (d < CFG.mouseR && d > 1) {
        const k = (1 - d / CFG.mouseR) * CFG.mouseF;
        p.vx += (dx / d) * k;
        p.vy += (dy / d) * k;
      }
    }
    p.vx *= 0.94; p.vy *= 0.94;
    p.x += p.vx; p.y += p.vy;
    // wrap
    if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
    if (p.y < -5) p.y = h + 5; else if (p.y > h + 5) p.y = -5;
  }

  // --- links ---
  const link = color(CFG.link);
  strokeWeight(1);
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      const r2 = CFG.linkDist * CFG.linkDist;
      if (d2 < r2) {
        const alpha = (1 - d2 / r2) * 120;
        link.setAlpha(alpha);
        stroke(link);
        line(a.x, a.y, b.x, b.y);
      }
    }
  }

  // --- nodes ---
  const dot = color(CFG.node);
  noStroke();
  for (const p of nodes) {
    const pulse = 0.75 + Math.sin(frameCount * 0.03 + p.phase) * 0.25;
    dot.setAlpha(200);
    fill(dot);
    circle(p.x, p.y, 2.4 * pulse);
    // halo
    dot.setAlpha(40);
    fill(dot);
    circle(p.x, p.y, 7 * pulse);
  }
}
