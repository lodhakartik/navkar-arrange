// Tiny CSS-particle confetti burst. No canvas, no dependencies.

const COLORS = ["#FFB347", "#7EC8E3", "#A8E6CF", "#FFAAA5", "#D4A5FF", "#FFD966"];

export function burst(host, { count = 40, duration = 1500 } = {}) {
  if (!host) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const w = host.clientWidth || 320;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "confetti-particle";
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 80 + Math.random() * 160;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist + 40; // bias downward
    const rot = Math.random() * 720 - 360;
    p.style.cssText = `
      position: absolute;
      left: 50%;
      top: 40%;
      width: 10px;
      height: 14px;
      background: ${COLORS[i % COLORS.length]};
      border-radius: 2px;
      transform: translate(-50%, -50%);
      animation: confetti-fly ${duration}ms ease-out forwards;
      --dx: ${dx}px;
      --dy: ${dy}px;
      --rot: ${rot}deg;
    `;
    host.appendChild(p);
    setTimeout(() => p.remove(), duration + 100);
  }
}

// Inject keyframes once (avoids cluttering CSS).
if (!document.getElementById("confetti-keyframes")) {
  const style = document.createElement("style");
  style.id = "confetti-keyframes";
  style.textContent = `
    @keyframes confetti-fly {
      to {
        transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot));
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
