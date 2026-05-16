// Level state machine. Builds DOM, wires drag controller, checks completion.

import { linesForLevel, shuffle, LEVELS, TOTAL_LEVELS } from "./levels.js";
import { makeDragController } from "./dragdrop.js";
import * as audio from "./audio.js";
import {
  impactLight, notifyWarning, flashSlotCorrect,
  popTile, shakeTile,
} from "./feedback.js";

let currentLevelIndex = 0;
let onLevelComplete = null;
let placedCount = 0;
let lineCount = 0;

const slotsEl = () => document.getElementById("slots");
const poolEl = () => document.getElementById("pool");

export function startLevel(levelIndex, { onComplete } = {}) {
  currentLevelIndex = levelIndex;
  onLevelComplete = onComplete;
  placedCount = 0;

  const lines = linesForLevel(levelIndex);
  lineCount = lines.length;

  document.getElementById("level-label").textContent =
    `Level ${levelIndex + 1} of ${TOTAL_LEVELS}`;

  // Build slots
  const slots = slotsEl();
  slots.innerHTML = "";
  for (let i = 0; i < lines.length; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.position = String(i + 1); // 1-indexed: matches line.id
    const num = document.createElement("div");
    num.className = "slot-number";
    num.textContent = String(i + 1);
    slot.appendChild(num);
    slots.appendChild(slot);
  }

  // Build shuffled tile pool
  const pool = poolEl();
  pool.innerHTML = "";
  const dragController = makeDragController({
    onDropAttempt: handleDropAttempt,
    onTap: handleTap,
  });
  const shuffled = shuffle(lines);
  for (const line of shuffled) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.line = String(line.id);

    const dev = document.createElement("div");
    dev.className = "tile-devanagari";
    dev.lang = "sa";
    dev.textContent = line.devanagari;

    const eng = document.createElement("div");
    eng.className = "tile-english";
    eng.textContent = line.english;

    tile.appendChild(dev);
    tile.appendChild(eng);
    pool.appendChild(tile);
    dragController.attach(tile);
  }
}

function handleTap(tile) {
  const id = Number(tile.dataset.line);
  popTile(tile);
  audio.playLine(id);
}

function handleDropAttempt(tile, slot) {
  if (!slot || slot.classList.contains("filled")) {
    shakeTile(tile);
    notifyWarning();
    return "wrong";
  }
  const lineId = Number(tile.dataset.line);
  const position = Number(slot.dataset.position);
  if (lineId !== position) {
    shakeTile(tile);
    notifyWarning();
    return "wrong";
  }

  // Correct: move tile into slot
  slot.appendChild(tile);
  slot.classList.add("filled");
  tile.classList.add("placed");
  flashSlotCorrect(slot);
  popTile(tile);
  impactLight();
  audio.playLine(lineId);
  // Keep the just-placed slot visible (and reveal the next empty slot).
  const nextEmpty = slot.parentElement.querySelector(".slot:not(.filled)");
  (nextEmpty || slot).scrollIntoView({ block: "nearest", behavior: "smooth" });

  placedCount++;
  if (placedCount >= lineCount) {
    setTimeout(() => onLevelComplete && onLevelComplete(currentLevelIndex), 700);
  }
  return "correct";
}

export function getCurrentLevelIndex() { return currentLevelIndex; }
