import { LINES } from "./mantra.js";

export const LEVELS = [
  { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 },
  { n: 6 }, { n: 7 }, { n: 8 }, { n: 9 },
];

export const TOTAL_LEVELS = LEVELS.length;

export function linesForLevel(levelIndex) {
  return LINES.slice(0, LEVELS[levelIndex].n);
}

export function shuffle(arr) {
  const a = arr.slice();
  if (a.length <= 1) return a;
  let attempts = 0;
  do {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    attempts++;
  } while (attempts < 5 && a.every((x, i) => x.id === arr[i].id));
  return a;
}
