'use strict';

// Flat chibi-style footballer illustration: big round head, small body,
// thick outline, cel-shaded gradients (like a glossy vinyl toy). Drawn once
// as a front-facing SVG group — the "3D spin" comes from animating this
// group's horizontal scale (see spin.js), the same trick used for
// spinning-card/coin effects.

const OUTLINE = '#1c130d';
const OUTLINE_W = 7;

function grad(id, light, base) {
  return `<radialGradient id="${id}" cx="35%" cy="28%" r="80%">
    <stop offset="0%" stop-color="${light}"/>
    <stop offset="100%" stop-color="${base}"/>
  </radialGradient>`;
}

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

// A soft diagonal gloss streak, clipped to whatever hair shape is currently
// drawn, so hair reads as glossy strands rather than a flat cutout.
function hairShine(clipId) {
  return `<g clip-path="url(#${clipId})">
    <ellipse cx="200" cy="45" rx="34" ry="16" fill="#ffffff" opacity="0.3" transform="rotate(-24 200 45)"/>
    <ellipse cx="270" cy="35" rx="16" ry="8" fill="#ffffff" opacity="0.22" transform="rotate(-18 270 35)"/>
  </g>`;
}

function hairPath(style) {
  switch (style) {
    case 'spiky': {
      const d = `M 155 95 Q 145 40 175 60 Q 180 20 205 55 Q 215 15 235 55
        Q 250 10 265 55 Q 285 15 295 55 Q 320 20 325 60 Q 355 40 345 95
        Q 340 60 250 60 Q 160 60 155 95 Z`;
      return `<clipPath id="hairClip"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    }
    case 'afro':
      return `<clipPath id="hairClip"><circle cx="250" cy="90" r="98"/></clipPath>
        <circle cx="250" cy="90" r="98" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>
        ${hairShine('hairClip')}`;
    case 'buzz': {
      const d = `M 158 100 Q 155 30 250 28 Q 345 30 342 100 Q 340 60 250 58 Q 160 60 158 100 Z`;
      return `<clipPath id="hairClip"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    }
    case 'mohawk':
      return `<clipPath id="hairClip"><path d="M 225 100 Q 205 -10 250 -25 Q 295 -10 275 100 Z"/></clipPath>
        <path d="M 225 100 Q 205 -10 250 -25 Q 295 -10 275 100 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        <path d="M 158 105 Q 156 75 175 75 Q 165 95 175 105 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        <path d="M 342 105 Q 344 75 325 75 Q 335 95 325 105 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    case 'ponytail': {
      const d = `M 160 95 Q 152 35 250 32 Q 348 35 340 95 Q 335 58 250 56 Q 165 58 160 95 Z`;
      return `<clipPath id="hairClip"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        <path d="M 335 70 Q 380 80 375 140 Q 370 110 330 95 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    }
    case 'bald':
    default:
      return '';
  }
}

// A glossy pupil with a catchlight — the single biggest lever for making a
// flat vector face read as "alive" rather than a sticker.
function pupil(cx, cy) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="10" ry="13" fill="${OUTLINE}"/>
    <circle cx="${cx - 3.5}" cy="${cy - 5}" r="3.2" fill="#ffffff"/>
    <circle cx="${cx + 4}" cy="${cy + 4}" r="1.4" fill="#ffffff" opacity="0.7"/>`;
}

function eyebrow(cx, ey, dir) {
  // dir: 1 = angled for a determined/focused look, 0 = neutral-relaxed.
  const tilt = dir ? 6 : 2;
  const sign = cx < 250 ? -1 : 1;
  return `<path d="M ${cx - sign * 16} ${ey - 10 + tilt} q ${sign * 16} ${-6} ${sign * 32} ${-tilt}" stroke="${OUTLINE}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
}

function eyesPath(style) {
  const ex = 32;
  const ey = 155;
  switch (style) {
    case 'determined':
      return `${eyebrow(250 - ex, ey, 1)}${eyebrow(250 + ex, ey, 1)}
        ${pupil(250 - ex, ey)}${pupil(250 + ex, ey)}`;
    case 'happy':
      return `${eyebrow(250 - ex, ey, 0)}${eyebrow(250 + ex, ey, 0)}
        <path d="M ${250 - ex - 12} ${ey} q 12 -14 24 0" stroke="${OUTLINE}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M ${250 + ex - 12} ${ey} q 12 -14 24 0" stroke="${OUTLINE}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 'wink':
      return `${eyebrow(250 - ex, ey, 1)}${eyebrow(250 + ex, ey, 0)}
        ${pupil(250 - ex, ey)}
        <path d="M ${250 + ex - 12} ${ey} q 12 -12 24 0" stroke="${OUTLINE}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 'shades':
      return `<rect x="${250 - ex - 20}" y="${ey - 14}" width="44" height="26" rx="10" fill="#141414" stroke="${OUTLINE}" stroke-width="5"/>
        <rect x="${250 + ex - 24}" y="${ey - 14}" width="44" height="26" rx="10" fill="#141414" stroke="${OUTLINE}" stroke-width="5"/>
        <path d="M ${250 - ex + 24} ${ey - 4} l ${ex * 2 - 48} 0" stroke="${OUTLINE}" stroke-width="5"/>
        <path d="M ${250 + ex + 24} ${ey - 8} l 18 -6" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/>
        <path d="M ${250 - ex - 24} ${ey - 8} l -18 -6" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="${250 - ex - 10}" cy="${ey - 8}" rx="8" ry="4" fill="#ffffff" opacity="0.35"/>
        <ellipse cx="${250 + ex - 14}" cy="${ey - 8}" rx="8" ry="4" fill="#ffffff" opacity="0.35"/>`;
    default:
      return `${eyebrow(250 - ex, ey, 0)}${eyebrow(250 + ex, ey, 0)}
        ${pupil(250 - ex, ey)}${pupil(250 + ex, ey)}`;
  }
}

function mouthPath() {
  return `<path d="M 232 190 q 18 14 36 0" stroke="${OUTLINE}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
}

function blush() {
  return `<ellipse cx="196" cy="178" rx="16" ry="9" fill="#ff8577" opacity="0.35"/>
    <ellipse cx="304" cy="178" rx="16" ry="9" fill="#ff8577" opacity="0.35"/>`;
}

// Soft contact shadows where parts meet — the trick that stops a stack of
// flat shapes from reading as a stack of flat shapes.
function contactShadow(pathD) {
  return `<path d="${pathD}" fill="#00000022" stroke="none"/>`;
}

function propPath(prop, jersey) {
  switch (prop) {
    case 'ball':
      return `<g transform="translate(370,330)">
        <circle r="34" fill="url(#ballGrad)" stroke="${OUTLINE}" stroke-width="6"/>
        <path d="M -14,-8 L 14,-8 L 20,14 L 0,26 L -20,14 Z" fill="${OUTLINE}" opacity="0.85"/>
      </g>`;
    case 'trophy':
      return `<g transform="translate(372,300)">
        <path d="M -22,-30 L 22,-30 L 16,10 L -16,10 Z" fill="url(#trophyGrad)" stroke="${OUTLINE}" stroke-width="6" stroke-linejoin="round"/>
        <rect x="-8" y="10" width="16" height="16" fill="url(#trophyGrad)" stroke="${OUTLINE}" stroke-width="6"/>
        <rect x="-24" y="26" width="48" height="10" rx="4" fill="url(#trophyGrad)" stroke="${OUTLINE}" stroke-width="6"/>
        <path d="M -22,-24 q -22,4 -10,26" fill="none" stroke="${OUTLINE}" stroke-width="6"/>
        <path d="M 22,-24 q 22,4 10,26" fill="none" stroke="${OUTLINE}" stroke-width="6"/>
      </g>`;
    case 'armband':
      return '';
    default:
      return '';
  }
}

function buildCharacterSvgGroup(traits) {
  const { skin, jersey, shorts, boots, hair, hairColor, eyes, prop, number, armPose } = traits;

  const defs = `
    ${grad('skinGrad', lighten(skin, 0.35), skin)}
    ${grad('hairGrad', lighten(hairColor, 0.3), hairColor)}
    ${grad('jerseyGrad', lighten(jersey, 0.35), jersey)}
    ${grad('jerseySleeveGrad', lighten(jersey, 0.15), darken(jersey, 0.15))}
    ${grad('shortsGrad', lighten(shorts, 0.3), shorts)}
    ${grad('bootsGrad', lighten(boots, 0.3), boots)}
    ${grad('ballGrad', '#ffffff', '#d8d8d8')}
    ${grad('trophyGrad', lighten('#d4af37', 0.4), '#d4af37')}
  `;

  const raisedArm = armPose === 'celebrate';

  const backArm = raisedArm
    ? `<path d="M 335 250 Q 400 190 385 140 Q 372 150 365 190 Q 340 225 320 260 Z" fill="url(#jerseySleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="382" cy="138" r="18" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`
    : `<path d="M 330 250 Q 365 280 358 330 Q 340 335 325 330 Q 318 285 305 258 Z" fill="url(#jerseySleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="345" cy="332" r="17" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`;

  const frontArm = `<path d="M 170 250 Q 132 285 140 330 Q 158 336 175 330 Q 182 285 195 258 Z" fill="url(#jerseySleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="152" cy="332" r="17" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`;

  return `
    <defs>${defs}</defs>

    <ellipse cx="250" cy="452" rx="95" ry="18" fill="#00000030"/>

    ${backArm}

    <!-- legs -->
    <path d="M 205 372 Q 200 410 195 438 L 225 438 Q 228 405 232 372 Z" fill="url(#bootsGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <path d="M 268 372 Q 272 410 278 438 L 308 438 Q 302 405 296 372 Z" fill="url(#bootsGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <path d="M 190 434 Q 188 452 200 456 L 236 456 Q 240 448 232 434 Z" fill="#141414" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <path d="M 274 434 Q 270 452 282 456 L 314 456 Q 316 448 300 434 Z" fill="#141414" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    ${contactShadow('M 197 374 Q 218 384 230 374 L 230 382 Q 218 392 197 382 Z')}
    ${contactShadow('M 270 374 Q 282 384 294 374 L 294 382 Q 282 392 270 382 Z')}

    <!-- shorts -->
    <path d="M 190 322 Q 188 360 200 378 L 300 378 Q 312 360 310 322 Z" fill="url(#shortsGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    ${contactShadow('M 193 328 Q 250 342 307 328 L 307 336 Q 250 350 193 336 Z')}

    <!-- torso / jersey -->
    <path d="M 178 232 Q 172 285 190 330 L 310 330 Q 328 285 322 232 Q 300 210 250 208 Q 200 210 178 232 Z"
      fill="url(#jerseyGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <text x="250" y="292" font-family="Arial, sans-serif" font-weight="900" font-size="52" fill="#ffffff" text-anchor="middle" stroke="${darken(jersey, 0.4)}" stroke-width="1.5">${number}</text>
    ${contactShadow('M 181 236 Q 250 254 319 236 L 316 246 Q 250 264 184 246 Z')}

    ${frontArm}

    <!-- neck -->
    <rect x="228" y="205" width="44" height="26" fill="url(#skinGrad)"/>
    ${contactShadow('M 228 222 L 272 222 L 272 231 Q 250 236 228 231 Z')}

    <!-- head -->
    <circle cx="250" cy="150" r="98" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>
    <path d="M 175 190 Q 250 250 325 190 Q 300 232 250 236 Q 200 232 175 190 Z" fill="${darken(skin, 0.12)}" opacity="0.4"/>
    ${blush()}
    ${eyesPath(eyes)}
    ${mouthPath()}
    <ellipse cx="215" cy="118" rx="30" ry="20" fill="#ffffff" opacity="0.22"/>
    <ellipse cx="205" cy="108" rx="12" ry="9" fill="#ffffff" opacity="0.3"/>

    ${hairPath(hair)}

    ${propPath(prop, jersey)}
  `;
}

module.exports = { buildCharacterSvgGroup, lighten, darken };
