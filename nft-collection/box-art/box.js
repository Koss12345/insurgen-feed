'use strict';

// Simple chibi-style treasure chest — same visual language as the footballer
// characters (thick outline, cel-shaded gradients) but a static object, not
// a character. Two states: closed (mystery box) and open (lid thrown back,
// used as a brief transition frame before the prize reveal).

const OUTLINE = '#1c130d';
const OUTLINE_W = 6.5;

function lighten(hex, amt) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (255 - c) * amt)));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function darken(hex, amt) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - amt))));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function grad3(id, base) {
  const light = lighten(base, 0.4);
  const dark = darken(base, 0.25);
  return `<radialGradient id="${id}" cx="34%" cy="26%" r="85%">
    <stop offset="0%" stop-color="${light}"/>
    <stop offset="48%" stop-color="${base}"/>
    <stop offset="100%" stop-color="${dark}"/>
  </radialGradient>`;
}

function buildBoxSvgGroup({ woodColor = '#8a5a2b', trimColor = '#f0c447', open = false, glow = 0 } = {}) {
  const defs = `
    ${grad3('woodGrad', woodColor)}
    ${grad3('woodLidGrad', lighten(woodColor, 0.08))}
    ${grad3('trimGrad', trimColor)}
  `;

  const lid = open
    ? `<path d="M 148 262 C 148 210 172 178 250 176 C 300 175 320 200 330 230 L 150 268 Z"
        fill="url(#woodLidGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"
        transform="rotate(-38 150 268)"/>`
    : `<path d="M 148 282 C 148 228 180 196 250 196 C 320 196 352 228 352 282 Z"
        fill="url(#woodLidGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <path d="M 168 240 C 190 216 220 208 250 208" stroke="${lighten(woodColor, 0.5)}" stroke-width="6" fill="none" opacity="0.4" stroke-linecap="round"/>`;

  const glowRays = glow > 0
    ? `<g opacity="${Math.min(1, glow).toFixed(2)}">
        ${[0, 45, 90, 135, 180, 225, 270, 315]
          .map((a) => `<line x1="250" y1="270" x2="${250 + Math.cos((a * Math.PI) / 180) * 170}" y2="${270 + Math.sin((a * Math.PI) / 180) * 170}" stroke="#fff6c8" stroke-width="10" stroke-linecap="round"/>`)
          .join('')}
        <circle cx="250" cy="270" r="60" fill="#fff6c8"/>
      </g>`
    : '';

  return `
    <defs>${defs}</defs>
    <ellipse cx="250" cy="410" rx="110" ry="20" fill="#00000030"/>
    ${glowRays}

    <!-- body -->
    <path d="M 150 282 L 150 380 C 150 392 160 400 172 400 L 328 400 C 340 400 350 392 350 380 L 350 282 Z"
      fill="url(#woodGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <rect x="150" y="325" width="200" height="22" fill="url(#trimGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W * 0.7}"/>
    <rect x="170" y="282" width="16" height="118" fill="url(#trimGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W * 0.6}"/>
    <rect x="314" y="282" width="16" height="118" fill="url(#trimGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W * 0.6}"/>

    ${!open ? lid : ''}

    <!-- lock -->
    ${!open ? `<rect x="228" y="310" width="44" height="40" rx="8" fill="url(#trimGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W * 0.7}"/>
      <circle cx="250" cy="326" r="7" fill="${darken(trimColor, 0.5)}"/>
      <rect x="247" y="330" width="6" height="12" fill="${darken(trimColor, 0.5)}"/>` : ''}

    ${open ? lid : ''}
    ${open ? `<ellipse cx="250" cy="278" rx="95" ry="18" fill="#000000" opacity="0.35"/>` : ''}
  `;
}

module.exports = { buildBoxSvgGroup, lighten, darken, grad3, OUTLINE, OUTLINE_W };
