// Haptics + visual feedback helpers.

import { burst } from "./confetti.js";

function getHaptics() {
  return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
}

export function impactLight() {
  const h = getHaptics();
  if (h && h.impact) h.impact({ style: "LIGHT" }).catch(() => {});
}
export function notifyWarning() {
  const h = getHaptics();
  if (h && h.notification) h.notification({ type: "WARNING" }).catch(() => {});
}
export function notifySuccess() {
  const h = getHaptics();
  if (h && h.notification) h.notification({ type: "SUCCESS" }).catch(() => {});
}

export function flashSlotCorrect(slot) {
  slot.classList.add("correct-flash");
  setTimeout(() => slot.classList.remove("correct-flash"), 600);
}

export function popTile(tile) {
  tile.classList.remove("pop");
  // force reflow so animation restarts
  void tile.offsetWidth;
  tile.classList.add("pop");
  setTimeout(() => tile.classList.remove("pop"), 260);
}

export function shakeTile(tile) {
  tile.classList.remove("shake");
  void tile.offsetWidth;
  tile.classList.add("shake");
  setTimeout(() => tile.classList.remove("shake"), 400);
}

export function celebrate(host) {
  burst(host, { count: 40, duration: 1400 });
  notifySuccess();
}

export function bigCelebrate(host) {
  burst(host, { count: 80, duration: 2200 });
  setTimeout(() => burst(host, { count: 60, duration: 2000 }), 600);
  notifySuccess();
}
