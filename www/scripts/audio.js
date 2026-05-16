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

export function playLine(id) {
  const a = elements.get(id);
  if (!a) return;
  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

export function playChant({ loop = false } = {}) {
  if (!chantEl) return;
  try {
    chantEl.loop = loop;
    chantEl.currentTime = 0;
    chantEl.play().catch(() => {});
  } catch {}
}

export function stopChant() {
  if (!chantEl) return;
  try { chantEl.pause(); chantEl.currentTime = 0; } catch {}
}
