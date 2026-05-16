// HTMLAudioElement wrapper with iOS autoplay unlock.
// Audio is unlocked on the first user gesture (intro tap).

import { LINES, CHANT_FULL } from "./mantra.js";

const elements = new Map(); // id -> HTMLAudioElement
let chantEl = null;
let unlocked = false;

export function preloadAll() {
  const pool = document.getElementById("audio-pool");
  if (!pool) return;
  for (const line of LINES) {
    const a = new Audio(line.audio);
    a.preload = "auto";
    pool.appendChild(a);
    elements.set(line.id, a);
  }
  chantEl = new Audio(CHANT_FULL);
  chantEl.preload = "auto";
  pool.appendChild(chantEl);
}

// Call from within a user-gesture handler (intro tap).
export async function unlock() {
  if (unlocked) return;
  unlocked = true;
  const all = [...elements.values(), chantEl].filter(Boolean);
  for (const a of all) {
    try {
      a.muted = true;
      await a.play();
      a.pause();
      a.currentTime = 0;
      a.muted = false;
    } catch {
      // Some browsers reject silent play attempts; ignore.
    }
  }
}

function pauseEl(a) {
  if (!a || a.paused) return;
  try { a.pause(); a.currentTime = 0; } catch {}
}

export function stopAllLines() {
  for (const a of elements.values()) pauseEl(a);
}

export function stopAll() {
  stopAllLines();
  pauseEl(chantEl);
}

export function playLine(id) {
  const a = elements.get(id);
  if (!a) return;
  // Prevent overlap: stop any other line + the chant before starting.
  for (const [otherId, other] of elements) {
    if (otherId !== id) pauseEl(other);
  }
  pauseEl(chantEl);
  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

export function playChant({ loop = false } = {}) {
  if (!chantEl) return;
  // Prevent overlap with any tile-tap line audio still playing.
  stopAllLines();
  try {
    chantEl.loop = loop;
    chantEl.currentTime = 0;
    chantEl.play().catch(() => {});
  } catch {}
}

export function stopChant() {
  pauseEl(chantEl);
}
