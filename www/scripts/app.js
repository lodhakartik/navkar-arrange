// Bootstrap: load progress, route to first screen, wire global buttons.

import { startLevel } from "./game.js";
import { TOTAL_LEVELS } from "./levels.js";
import { getProgress, setProgress } from "./storage.js";
import * as audio from "./audio.js";
import { celebrate, bigCelebrate } from "./feedback.js";
import { renderLotus, animateBloomTo, linesLearnedFromCompleted } from "./lotus.js";
import { bumpPlayCount } from "./counter.js";

const $ = (id) => document.getElementById(id);
const setScreen = (name) => { document.body.dataset.screen = name; };

let progress = null;

async function boot() {
  audio.preloadAll();
  progress = await getProgress();

  $("btn-start").addEventListener("click", onStart);
  $("btn-home").addEventListener("click", () => { renderIntroLotus(); setScreen("intro"); });
  $("btn-levels").addEventListener("click", showLevelSelect);
  $("btn-levels-back").addEventListener("click", () => setScreen("puzzle"));
  $("btn-next").addEventListener("click", onNext);
  $("btn-replay").addEventListener("click", onReplay);

  // Dev convenience: ?bloom=N fakes "N lines learned" for the intro lotus.
  const bloomMatch = location.search.match(/[?&]bloom=(\d+)/);
  if (bloomMatch) {
    const lines = Math.max(0, Math.min(9, Number(bloomMatch[1])));
    const fakeCompleted = lines === 0 ? 0 : lines - 1;
    progress.completed = Array.from({ length: fakeCompleted }, (_, i) => i);
  }

  renderIntroLotus();
  setScreen("intro");
  hideNativeSplash();
  showPlayCount();

  // Dev convenience: ?go=N starts at level N (1-indexed). Harmless in prod.
  // Optional &fill=K pre-places the first K tiles correctly (for layout preview).
  const m = location.search.match(/[?&]go=(\d+)/);
  if (m) {
    const lvl = Math.max(1, Math.min(TOTAL_LEVELS, Number(m[1]))) - 1;
    progress.currentLevel = lvl;
    setScreen("puzzle");
    startLevel(lvl, { onComplete: onLevelComplete });
    const fillMatch = location.search.match(/[?&]fill=(\d+)/);
    if (fillMatch) {
      const k = Math.max(0, Number(fillMatch[1]));
      requestAnimationFrame(() => devFillSlots(k));
    }
  }
}

function devFillSlots(k) {
  // Move first k tiles from pool into their correct slot positions.
  const slots = document.querySelectorAll("#slots .slot");
  for (let i = 0; i < k && i < slots.length; i++) {
    const slot = slots[i];
    const pos = Number(slot.dataset.position);
    const tile = document.querySelector(`#pool .tile[data-line="${pos}"]`);
    if (tile) {
      slot.appendChild(tile);
      slot.classList.add("filled");
      tile.classList.add("placed");
    }
  }
}

function renderIntroLotus() {
  const completedCount = (progress.completed || []).length;
  const lines = linesLearnedFromCompleted(completedCount);
  renderLotus($("intro-lotus"), { linesLearned: lines });
  const caption = $("lotus-caption");
  if (caption) {
    if (lines === 0) caption.textContent = "Bloom the Lotus";
    else if (lines >= 9 || progress.masteredOnce) caption.textContent = "Fully Bloomed ✦";
    else caption.textContent = `${lines} of 9 petals open`;
  }
  const startBtn = $("btn-start");
  if (startBtn) {
    if (progress.masteredOnce) startBtn.textContent = "Play Again";
    else if (progress.currentLevel > 0) startBtn.textContent = "Continue";
    else startBtn.textContent = "Begin";
  }
}

async function showPlayCount() {
  const el = $("play-count");
  if (!el) return;
  const count = await bumpPlayCount();
  if (!count) return;
  el.textContent = `${count.toLocaleString()} children have played \u2728`;
}

function hideNativeSplash() {
  const ss = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen;
  if (ss && ss.hide) ss.hide().catch(() => {});
}

async function onStart() {
  await audio.unlock();
  // If they've already completed the mantra once, starting again means a
  // fresh re-bloom from L1 with the lotus deflated.
  if (progress.masteredOnce) fullReset();
  const idx = clampLevel(progress.currentLevel);
  setScreen("puzzle");
  startLevel(idx, { onComplete: onLevelComplete });
}

function fullReset() {
  progress.completed = [];
  progress.masteredOnce = false;
  progress.currentLevel = 0;
  setProgress(progress);
}

function clampLevel(i) {
  if (typeof i !== "number" || i < 0) return 0;
  if (i >= TOTAL_LEVELS) return 0; // wrap to start after mastery
  return i;
}

async function onLevelComplete(levelIndex) {
  // Update progress
  if (!progress.completed.includes(levelIndex)) {
    progress.completed.push(levelIndex);
  }
  const nextIndex = levelIndex + 1;
  const isFinal = nextIndex >= TOTAL_LEVELS;
  progress.currentLevel = isFinal ? 0 : nextIndex;
  if (isFinal) progress.masteredOnce = true;
  await setProgress(progress);

  // Lines learned before this level's completion (for "before" state):
  // completed count before this win = levelIndex (since L_levelIndex was just done now).
  const linesBefore = linesLearnedFromCompleted(levelIndex);
  const linesAfter  = linesLearnedFromCompleted(levelIndex + 1);

  if (isFinal) {
    // Render all petals closed so the final screen shows a full,
    // dramatic bloom of all 9 petals in order (1→9).
    renderLotus($("final-lotus"), { linesLearned: 0 });
    setScreen("final");
    setTimeout(() => animateBloomTo($("final-lotus").firstElementChild, 9), 300);
    bigCelebrate($("confetti-host-final"));
    // Give the just-placed line-9 audio a moment to breathe before the
    // full chant starts. playChant() itself stops any still-playing line.
    setTimeout(() => audio.playChant(), 900);
  } else {
    $("win-subtitle").textContent = `Level ${levelIndex + 1} complete!`;
    renderLotus($("win-lotus"), { linesLearned: linesBefore });
    setScreen("win");
    setTimeout(() => animateBloomTo($("win-lotus").firstElementChild, linesAfter), 250);
    celebrate($("confetti-host"));
  }
}

function onNext() {
  setScreen("puzzle");
  startLevel(progress.currentLevel, { onComplete: onLevelComplete });
}

function onReplay() {
  audio.stopAll();
  fullReset();
  setScreen("puzzle");
  startLevel(0, { onComplete: onLevelComplete });
}

function showLevelSelect() {
  const grid = $("level-grid");
  grid.innerHTML = "";
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const card = document.createElement("button");
    card.className = "level-card";
    card.textContent = `Level ${i + 1}`;
    const completed = progress.completed.includes(i);
    const unlocked = progress.masteredOnce || i <= progress.currentLevel || completed;
    if (!unlocked) card.classList.add("locked");
    if (completed) card.classList.add("completed");
    card.disabled = !unlocked;
    card.addEventListener("click", () => {
      setScreen("puzzle");
      startLevel(i, { onComplete: onLevelComplete });
    });
    grid.appendChild(card);
  }
  setScreen("levels");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
