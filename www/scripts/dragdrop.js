// Pointer Events drag controller for puzzle tiles.
// API: makeDragController({ onDropAttempt, onTap }) -> { attach(tileEl) }
//   onDropAttempt(tile, slot) MUST return 'correct' or 'wrong'.
//   onTap(tile) fires when pointer up with <8px movement and <250ms duration.

const TAP_THRESHOLD_PX = 8;
const TAP_THRESHOLD_MS = 250;

export function makeDragController({ onDropAttempt, onTap }) {
  let active = null; // { tile, pointerId, startX, startY, dx, dy, startTime, dragging }

  function attach(tile) {
    tile.addEventListener("pointerdown", onPointerDown);
  }

  function onPointerDown(e) {
    const tile = e.currentTarget;
    if (tile.classList.contains("placed")) return; // already in a slot
    if (active) return;
    tile.setPointerCapture(e.pointerId);

    active = {
      tile,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      startTime: Date.now(),
      dragging: false,
    };

    tile.addEventListener("pointermove", onPointerMove);
    tile.addEventListener("pointerup", onPointerUp);
    tile.addEventListener("pointercancel", onPointerCancel);
  }

  function beginDrag() {
    if (!active || active.dragging) return;
    active.dragging = true;
    active.tile.classList.add("dragging");
    // Lift the tile out of layout flow so it floats above siblings.
    const r = active.tile.getBoundingClientRect();
    active.tile.style.position = "fixed";
    active.tile.style.left = r.left + "px";
    active.tile.style.top = r.top + "px";
    active.tile.style.width = r.width + "px";
    active.tile.style.zIndex = "1000";
  }

  function onPointerMove(e) {
    if (!active || e.pointerId !== active.pointerId) return;
    active.dx = e.clientX - active.startX;
    active.dy = e.clientY - active.startY;

    if (!active.dragging) {
      if (Math.hypot(active.dx, active.dy) > TAP_THRESHOLD_PX) {
        beginDrag();
      } else {
        return;
      }
    }
    active.tile.style.transform = `translate(${active.dx}px, ${active.dy}px)`;
    updateDragOver(e.clientX, e.clientY);
  }

  function updateDragOver(x, y) {
    const el = document.elementFromPoint(x, y);
    const slot = el ? el.closest(".slot") : null;
    document.querySelectorAll(".slot.drag-over").forEach((s) => {
      if (s !== slot) s.classList.remove("drag-over");
    });
    if (slot && !slot.classList.contains("filled")) {
      slot.classList.add("drag-over");
    }
  }

  function clearDragOver() {
    document.querySelectorAll(".slot.drag-over").forEach((s) => s.classList.remove("drag-over"));
  }

  function onPointerUp(e) {
    if (!active || e.pointerId !== active.pointerId) return;
    const tile = active.tile;
    const dragged = active.dragging;
    const elapsed = Date.now() - active.startTime;
    const moved = Math.hypot(active.dx, active.dy);

    // Find slot under finger BEFORE we reset styles.
    let slot = null;
    if (dragged) {
      // tile has pointer-events: none while .dragging, so elementFromPoint
      // returns the slot beneath, not the tile.
      const el = document.elementFromPoint(e.clientX, e.clientY);
      slot = el ? el.closest(".slot") : null;
    }

    cleanup();
    clearDragOver();

    if (!dragged && moved < TAP_THRESHOLD_PX && elapsed < TAP_THRESHOLD_MS) {
      onTap && onTap(tile);
      return;
    }

    if (!dragged) return;

    // Always delegate to game.js. Slot may be null (dropped on empty area)
    // or a filled slot; game.js decides correct/wrong and owns feedback.
    onDropAttempt(tile, slot);
  }

  function onPointerCancel(e) {
    if (!active || e.pointerId !== active.pointerId) return;
    cleanup();
    clearDragOver();
  }

  function cleanup() {
    if (!active) return;
    const { tile } = active;
    tile.removeEventListener("pointermove", onPointerMove);
    tile.removeEventListener("pointerup", onPointerUp);
    tile.removeEventListener("pointercancel", onPointerCancel);
    tile.classList.remove("dragging");
    tile.style.position = "";
    tile.style.left = "";
    tile.style.top = "";
    tile.style.width = "";
    tile.style.zIndex = "";
    tile.style.transform = "";
    active = null;
  }

  return { attach };
}
