'use strict';

// A little twinkle burst near a point, faded in/out by `intensity` (0..1) —
// echoes the spray-can particle effect seen in the reference idle animation.
function sparkleOverlay(cx, cy, intensity, seedAngle) {
  if (intensity <= 0.02) return '';
  const particles = [0, 1, 2, 3].map((i) => {
    const angle = seedAngle + (i * Math.PI) / 2;
    const dist = 30 + i * 8;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist * 0.7;
    const r = 3 + (i % 2) * 2;
    return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="#ffffff" opacity="${(intensity * 0.9).toFixed(2)}"/>`;
  });
  return `<g>${particles.join('')}</g>`;
}

module.exports = { sparkleOverlay };
