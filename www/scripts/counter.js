// Public play counter via counterapi.dev (free, no signup).
// Counts each app open. Silent failure if API is unreachable.

const BASE = "https://api.counterapi.dev/v1/lodhakartik/my-first-navkar";

let bumpedThisSession = false;

function parseCount(data) {
  const n = Number(data && data.count);
  return Number.isFinite(n) ? n : null;
}

export async function bumpPlayCount() {
  if (bumpedThisSession) return readPlayCount();
  bumpedThisSession = true;
  try {
    const res = await fetch(`${BASE}/up`, { method: "GET", cache: "no-store" });
    if (!res.ok) return null;
    return parseCount(await res.json());
  } catch {
    return null;
  }
}

export async function readPlayCount() {
  try {
    const res = await fetch(`${BASE}/`, { method: "GET", cache: "no-store" });
    if (!res.ok) return null;
    return parseCount(await res.json());
  } catch {
    return null;
  }
}
