// Tour: a 3-step onboarding overlay. Auto-shows on first launch, replayable.

import { renderLotus, animateBloomTo } from "./lotus.js";

const $ = (id) => document.getElementById(id);

const STEPS = [
  {
    title: "Pick up a line",
    body: "Touch and hold a sacred line, then drag it across the screen.",
    stage: stageDrag,
  },
  {
    title: "Drop on the number",
    body: "Each line has its own place. Drop it on the slot with the matching number.",
    stage: stageDrop,
  },
  {
    title: "Bloom the lotus",
    body: "Finish a level to open a petal. Complete all eight levels to bloom the whole lotus!",
    stage: stageBloom,
  },
];

let index = 0;
let onDone = null;

export function showTour({ onComplete } = {}) {
  index = 0;
  onDone = onComplete;
  const overlay = $("tour-overlay");
  if (!overlay) return;
  overlay.hidden = false;
  overlay.setAttribute("aria-hidden", "false");
  renderDots();
  $("tour-next").addEventListener("click", onNext);
  $("tour-skip").addEventListener("click", finish);
  render();
}

function render() {
  const step = STEPS[index];
  $("tour-title").textContent = step.title;
  $("tour-body").textContent = step.body;
  const stage = $("tour-stage");
  stage.className = `tour-stage step-${index + 1}`;
  stage.innerHTML = "";
  step.stage(stage);
  updateDots();
  $("tour-next").textContent = index === STEPS.length - 1 ? "Let's play!" : "Next";
}

function renderDots() {
  const dots = $("tour-dots");
  dots.innerHTML = "";
  for (let i = 0; i < STEPS.length; i++) {
    const d = document.createElement("span");
    dots.appendChild(d);
  }
}

function updateDots() {
  const dots = $("tour-dots").children;
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle("active", i === index);
  }
}

function onNext() {
  if (index < STEPS.length - 1) {
    index++;
    render();
  } else {
    finish();
  }
}

function finish() {
  const overlay = $("tour-overlay");
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  $("tour-next").removeEventListener("click", onNext);
  $("tour-skip").removeEventListener("click", finish);
  if (typeof onDone === "function") onDone();
}

/* ---------- stage illustrations ---------- */

function stageDrag(stage) {
  const tile = makeTile("णमो अरिहंताणं", "Namo Arihantanam");
  const finger = document.createElement("div");
  finger.className = "tour-demo-finger";
  finger.textContent = "👆";
  stage.appendChild(tile);
  stage.appendChild(finger);
}

function stageDrop(stage) {
  const tile = makeTile("णमो सिद्धाणं", "Namo Siddhanam", 2);
  const slot = document.createElement("div");
  slot.className = "tour-demo-slot";
  const num = document.createElement("div");
  num.className = "num";
  num.textContent = "2";
  slot.appendChild(num);
  stage.appendChild(slot);
  stage.appendChild(tile);
}

function stageBloom(stage) {
  const host = document.createElement("div");
  host.className = "lotus-host";
  stage.appendChild(host);
  renderLotus(host, { linesLearned: 2 });
  // Re-bloom from a small state to full after a beat, looping.
  let learned = 2;
  const loop = () => {
    if (!document.body.contains(host)) return;
    learned = learned >= 9 ? 2 : 9;
    if (learned === 2) {
      renderLotus(host, { linesLearned: 2 });
      setTimeout(loop, 900);
    } else {
      animateBloomTo(host.firstElementChild, 9);
      setTimeout(loop, 2400);
    }
  };
  setTimeout(loop, 900);
}

function makeTile(devanagari, english, line = 1) {
  const tile = document.createElement("div");
  tile.className = "tour-demo-tile";
  tile.dataset.line = String(line);
  tile.textContent = devanagari;
  const lbl = document.createElement("div");
  lbl.className = "lbl";
  lbl.textContent = english;
  tile.appendChild(lbl);
  // Map to PP colors so it matches the real game.
  const palette = {
    1: ["#FFFFFF", "#3A1F0E", "#C8A14B"],
    2: ["#E53935", "#FFFFFF", "#8E1A18"],
  }[line] || ["#FFFFFF", "#3A1F0E", "#C8A14B"];
  tile.style.background = palette[0];
  tile.style.color = palette[1];
  tile.style.borderColor = palette[2];
  return tile;
}
