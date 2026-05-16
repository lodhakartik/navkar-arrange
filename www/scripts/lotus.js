// 9-petal lotus mapped to the 9 Navkar Mantra lines.
// 5 outer (large) petals in Panch Parmeshthi colors:
//   line 1=white Arihant, 2=red Siddha, 3=yellow Acharya, 4=green Upadhyay, 5=neel-black Sadhu
// 4 back (smaller) white petals = chuliya lines 6-9.
// Petal corresponding to line L opens when the child has learned L lines.
// Levels-completed → lines-learned: 0→0, 1→2, 2→3, 3→4, ..., 8→9.

const NS = "http://www.w3.org/2000/svg";

// Vertical teardrop pointing UP from center (110, 110).
// Rotated by --rot for each petal.
const OUTER_PETAL = "M 110 110 C 84 88 84 46 110 22 C 136 46 136 88 110 110 Z";
// Back petals are SHORTER than outer (so they sit inside the outer ring)
// but WIDER (so they peek out between adjacent outer petals).
const BACK_PETAL  = "M 110 110 C 86 92 86 58 110 40 C 134 58 134 92 110 110 Z";

// 5 outer petals (one per Panch Parmeshthi)
// angle 0 = pointing UP (12 o'clock), then 72° clockwise each
const OUTER = [
  { line: 1, rot: 0,   fill: "#FFFFFF", stroke: "#C8A14B", strokeWidth: 1.8 }, // Arihant - white
  { line: 2, rot: 72,  fill: "#E53935", stroke: "#8E1A18", strokeWidth: 1.5 }, // Siddha - red
  { line: 3, rot: 144, fill: "#FFC107", stroke: "#B27500", strokeWidth: 1.5 }, // Acharya - yellow
  { line: 4, rot: 216, fill: "#43A047", stroke: "#1B5E20", strokeWidth: 1.5 }, // Upadhyay - green
  { line: 5, rot: 288, fill: "#283593", stroke: "#0D1454", strokeWidth: 1.5 }, // Sadhu - neel black
];

// 4 back petals (chuliya) — between the outer petals, in cream-white with gold edge
const BACK = [
  { line: 6, rot: 36,  fill: "#FFF8E1", stroke: "#B8973C", strokeWidth: 1.5 },
  { line: 7, rot: 108, fill: "#FFF8E1", stroke: "#B8973C", strokeWidth: 1.5 },
  { line: 8, rot: 180, fill: "#FFF8E1", stroke: "#B8973C", strokeWidth: 1.5 },
  { line: 9, rot: 252, fill: "#FFF8E1", stroke: "#B8973C", strokeWidth: 1.5 },
];

export function linesLearnedFromCompleted(completedCount) {
  // After 0 levels: 0 lines learned (no petals).
  // After 1 level (L1 done): lines 1 + 2 learned (2 petals: white Arihant + red Siddha).
  // After N levels: N + 1 lines learned (L1 introduces line 2 atop the implicit line 1).
  return completedCount === 0 ? 0 : completedCount + 1;
}

export function renderLotus(host, { linesLearned = 0 } = {}) {
  if (!host) return null;
  host.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "lotus";

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 220 220");
  svg.setAttribute("aria-hidden", "true");

  // Back petals first (render order = z-order: back appears behind outer)
  for (const p of BACK) {
    svg.appendChild(makePetal(p, "back", linesLearned >= p.line));
  }
  for (const p of OUTER) {
    svg.appendChild(makePetal(p, "outer", linesLearned >= p.line));
  }

  // Center
  svg.appendChild(makeCenter());

  wrap.appendChild(svg);
  host.appendChild(wrap);
  if (linesLearned >= 9) wrap.classList.add("full");
  return wrap;
}

function makePetal({ line, rot, fill, stroke, strokeWidth }, kind, open) {
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", kind === "outer" ? OUTER_PETAL : BACK_PETAL);
  path.setAttribute("fill", fill);
  path.setAttribute("stroke", stroke);
  path.setAttribute("stroke-width", String(strokeWidth));
  path.setAttribute("stroke-linejoin", "round");
  path.classList.add("petal", "petal-" + kind);
  path.dataset.line = String(line);
  path.style.setProperty("--rot", rot + "deg");
  if (open) path.classList.add("open");
  return path;
}

function makeCenter() {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "center");

  const outerC = document.createElementNS(NS, "circle");
  outerC.setAttribute("cx", "110");
  outerC.setAttribute("cy", "110");
  outerC.setAttribute("r", "20");
  outerC.setAttribute("fill", "#F4C84A");
  outerC.setAttribute("stroke", "#8C6A1F");
  outerC.setAttribute("stroke-width", "1.6");
  g.appendChild(outerC);

  // gold seed dots in a ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cx = 110 + Math.cos(a) * 10;
    const cy = 110 + Math.sin(a) * 10;
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", String(cx.toFixed(2)));
    dot.setAttribute("cy", String(cy.toFixed(2)));
    dot.setAttribute("r", "1.8");
    dot.setAttribute("fill", "#8C6A1F");
    g.appendChild(dot);
  }
  const inner = document.createElementNS(NS, "circle");
  inner.setAttribute("cx", "110");
  inner.setAttribute("cy", "110");
  inner.setAttribute("r", "4.5");
  inner.setAttribute("fill", "#7A1D1D");
  g.appendChild(inner);

  return g;
}

// Animate any newly-blooming petals (those that should be open per `linesLearned`
// but currently aren't). Petals bloom in line-number order (1→9) for a
// meaningful progression. Returns the count of petals that animated.
export function animateBloomTo(wrap, linesLearned) {
  if (!wrap) return 0;
  const toBloom = Array.from(wrap.querySelectorAll(".petal"))
    .filter((p) => {
      const line = Number(p.dataset.line);
      return line <= linesLearned && !p.classList.contains("open");
    })
    .sort((a, b) => Number(a.dataset.line) - Number(b.dataset.line));
  toBloom.forEach((p, i) => {
    setTimeout(() => p.classList.add("open"), 200 + i * 260);
  });
  if (linesLearned >= 9) {
    setTimeout(() => wrap.classList.add("full"), 200 + toBloom.length * 260 + 500);
  }
  return toBloom.length;
}
