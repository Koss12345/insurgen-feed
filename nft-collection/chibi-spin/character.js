'use strict';

// Flat chibi-style footballer illustration: big round head, small body,
// smooth cubic-bezier silhouettes, thick outline, rich cel-shaded gradients
// (glossy vinyl-toy look). Drawn once as a front-facing SVG group — motion
// comes from idle.js (blink/bob/sparkle), not rotation.

const OUTLINE = '#1c130d';
const OUTLINE_W = 6.5;

// Chibi proportions: a big head dominates the silhouette, body is compact.
const HEAD_CX = 250;
const HEAD_CY = 142;
const HEAD_R = 108;

function grad(id, light, base, dark) {
  // Three stops instead of two: a longer, smoother falloff reads as a
  // glossier material than a flat light-to-base blend.
  return `<radialGradient id="${id}" cx="34%" cy="26%" r="85%">
    <stop offset="0%" stop-color="${light}"/>
    <stop offset="48%" stop-color="${base}"/>
    <stop offset="100%" stop-color="${dark}"/>
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

function grad3(id, base) {
  return grad(id, lighten(base, 0.4), base, darken(base, 0.22));
}

function hairShine(clipId) {
  return `<g clip-path="url(#${clipId})">
    <ellipse cx="205" cy="40" rx="36" ry="17" fill="#ffffff" opacity="0.32" transform="rotate(-24 205 40)"/>
    <ellipse cx="278" cy="30" rx="16" ry="8" fill="#ffffff" opacity="0.22" transform="rotate(-16 278 30)"/>
  </g>`;
}

function hairPath(style) {
  switch (style) {
    case 'spiky': {
      const d = `M 150 88 Q 138 32 172 54 Q 176 12 202 50 Q 213 8 234 50
        Q 250 4 266 50 Q 287 8 298 50 Q 324 12 328 54 Q 362 32 350 88
        Q 342 52 250 52 Q 158 52 150 88 Z`;
      return `<clipPath id="hairClip"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    }
    case 'afro':
      return `<clipPath id="hairClip"><circle cx="250" cy="82" r="104"/></clipPath>
        <circle cx="250" cy="82" r="104" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>
        ${hairShine('hairClip')}`;
    case 'buzz': {
      const d = `M 152 95 C 150 28, 200 20, 250 20 C 300 20, 350 28, 348 95
        C 344 55, 300 50, 250 50 C 200 50, 156 55, 152 95 Z`;
      return `<clipPath id="hairClip"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    }
    case 'mohawk':
      return `<clipPath id="hairClip"><path d="M 220 95 Q 198 -18 250 -34 Q 302 -18 280 95 Z"/></clipPath>
        <path d="M 220 95 Q 198 -18 250 -34 Q 302 -18 280 95 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        <path d="M 150 100 Q 148 68 170 68 Q 158 90 170 100 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        <path d="M 350 100 Q 352 68 330 68 Q 342 90 330 100 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    case 'ponytail': {
      const d = `M 154 88 C 146 24, 200 18, 250 18 C 300 18, 354 24, 346 88
        C 340 50, 300 48, 250 48 C 200 48, 160 50, 154 88 Z`;
      return `<clipPath id="hairClip"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        <path d="M 340 62 Q 392 74 386 145 Q 378 108 334 90 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    }
    case 'bald':
    default:
      return '';
  }
}

function pupil(cx, cy) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="14" fill="${OUTLINE}"/>
    <circle cx="${cx - 3.8}" cy="${cy - 5.5}" r="3.4" fill="#ffffff"/>
    <circle cx="${cx + 4.4}" cy="${cy + 4.4}" r="1.5" fill="#ffffff" opacity="0.7"/>`;
}

function eyebrow(cx, ey, dir) {
  const tilt = dir ? 6 : 2;
  const sign = cx < HEAD_CX ? -1 : 1;
  return `<path d="M ${cx - sign * 16} ${ey - 12 + tilt} q ${sign * 16} ${-6} ${sign * 32} ${-tilt}" stroke="${OUTLINE}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
}

function eyesPath(style) {
  const ex = 34;
  const ey = HEAD_CY + 14;
  switch (style) {
    case 'determined':
      return `${eyebrow(HEAD_CX - ex, ey, 1)}${eyebrow(HEAD_CX + ex, ey, 1)}
        ${pupil(HEAD_CX - ex, ey)}${pupil(HEAD_CX + ex, ey)}`;
    case 'happy':
      return `${eyebrow(HEAD_CX - ex, ey, 0)}${eyebrow(HEAD_CX + ex, ey, 0)}
        <path d="M ${HEAD_CX - ex - 13} ${ey} q 13 -15 26 0" stroke="${OUTLINE}" stroke-width="6.5" fill="none" stroke-linecap="round"/>
        <path d="M ${HEAD_CX + ex - 13} ${ey} q 13 -15 26 0" stroke="${OUTLINE}" stroke-width="6.5" fill="none" stroke-linecap="round"/>`;
    case 'wink':
      return `${eyebrow(HEAD_CX - ex, ey, 1)}${eyebrow(HEAD_CX + ex, ey, 0)}
        ${pupil(HEAD_CX - ex, ey)}
        <path d="M ${HEAD_CX + ex - 13} ${ey} q 13 -13 26 0" stroke="${OUTLINE}" stroke-width="6.5" fill="none" stroke-linecap="round"/>`;
    case 'shades':
      return `<rect x="${HEAD_CX - ex - 21}" y="${ey - 15}" width="46" height="27" rx="11" fill="#141414" stroke="${OUTLINE}" stroke-width="5"/>
        <rect x="${HEAD_CX + ex - 25}" y="${ey - 15}" width="46" height="27" rx="11" fill="#141414" stroke="${OUTLINE}" stroke-width="5"/>
        <path d="M ${HEAD_CX - ex + 25} ${ey - 4} l ${ex * 2 - 50} 0" stroke="${OUTLINE}" stroke-width="5"/>
        <path d="M ${HEAD_CX + ex + 25} ${ey - 9} l 19 -6" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/>
        <path d="M ${HEAD_CX - ex - 25} ${ey - 9} l -19 -6" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="${HEAD_CX - ex - 10}" cy="${ey - 8}" rx="8" ry="4" fill="#ffffff" opacity="0.35"/>
        <ellipse cx="${HEAD_CX + ex - 14}" cy="${ey - 8}" rx="8" ry="4" fill="#ffffff" opacity="0.35"/>`;
    default:
      return `${eyebrow(HEAD_CX - ex, ey, 0)}${eyebrow(HEAD_CX + ex, ey, 0)}
        ${pupil(HEAD_CX - ex, ey)}${pupil(HEAD_CX + ex, ey)}`;
  }
}

function mouthPath() {
  const my = HEAD_CY + 48;
  return `<path d="M ${HEAD_CX - 18} ${my} q 18 15 36 0" stroke="${OUTLINE}" stroke-width="6.5" fill="none" stroke-linecap="round"/>`;
}

function blush() {
  const by = HEAD_CY + 32;
  return `<ellipse cx="${HEAD_CX - 58}" cy="${by}" rx="17" ry="10" fill="#ff8577" opacity="0.35"/>
    <ellipse cx="${HEAD_CX + 58}" cy="${by}" rx="17" ry="10" fill="#ff8577" opacity="0.35"/>`;
}

function contactShadow(pathD) {
  return `<path d="${pathD}" fill="#00000022" stroke="none"/>`;
}

function propPath(prop) {
  switch (prop) {
    case 'ball':
      return `<g transform="translate(368,318)">
        <circle r="33" fill="url(#ballGrad)" stroke="${OUTLINE}" stroke-width="5.5"/>
        <path d="M -13,-8 L 13,-8 L 19,13 L 0,25 L -19,13 Z" fill="${OUTLINE}" opacity="0.85"/>
        <ellipse cx="-11" cy="-13" rx="10" ry="6" fill="#ffffff" opacity="0.55"/>
      </g>`;
    case 'trophy':
      return `<g transform="translate(370,290)">
        <path d="M -21,-29 C -30,-25 -30,-6 -18,4 L 18,4 C 30,-6 30,-25 21,-29 Z" fill="url(#trophyGrad)" stroke="${OUTLINE}" stroke-width="5.5" stroke-linejoin="round"/>
        <rect x="-8" y="4" width="16" height="15" fill="url(#trophyGrad)" stroke="${OUTLINE}" stroke-width="5.5"/>
        <rect x="-23" y="19" width="46" height="10" rx="4" fill="url(#trophyGrad)" stroke="${OUTLINE}" stroke-width="5.5"/>
        <ellipse cx="-10" cy="-16" rx="7" ry="10" fill="#ffffff" opacity="0.4"/>
      </g>`;
    default:
      return '';
  }
}

function buildCharacterSvgGroup(traits) {
  const { skin, jersey, shorts, boots, hair, hairColor, eyes, prop, number, armPose } = traits;

  const defs = `
    ${grad3('skinGrad', skin)}
    ${grad3('hairGrad', hairColor)}
    ${grad3('jerseyGrad', jersey)}
    ${grad3('jerseySleeveGrad', darken(jersey, 0.08))}
    ${grad3('shortsGrad', shorts)}
    ${grad3('bootsGrad', boots)}
    ${grad3('ballGrad', '#e8e8e8')}
    ${grad3('trophyGrad', '#d4af37')}
  `;

  const raisedArm = armPose === 'celebrate';

  const backArm = raisedArm
    ? `<path d="M 316 255 C 348 232, 376 195, 394 148 C 380 148, 364 168, 350 190 C 335 214, 320 236, 304 258 Z"
         fill="url(#jerseySleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="392" cy="143" r="19" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`
    : `<path d="M 318 252 C 348 272, 356 300, 350 328 C 336 334, 322 330, 312 322 C 308 296, 300 272, 288 256 Z"
         fill="url(#jerseySleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="338" cy="326" r="18" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`;

  const frontArm = `<path d="M 182 252 C 150 272, 140 300, 146 328 C 160 334, 174 330, 184 322 C 190 296, 198 272, 210 256 Z"
       fill="url(#jerseySleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
     <circle cx="160" cy="326" r="18" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`;

  return `
    <defs>${defs}</defs>

    <ellipse cx="250" cy="432" rx="92" ry="17" fill="#00000030"/>

    ${backArm}

    <!-- legs -->
    <path d="M 213 366 C 210 382, 206 396, 202 408 L 225 408 C 227 396, 229 382, 231 366 Z"
      fill="url(#bootsGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <path d="M 269 366 C 271 382, 274 396, 278 408 L 301 408 C 297 396, 293 382, 291 366 Z"
      fill="url(#bootsGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <path d="M 196 404 C 194 416, 202 424, 214 424 L 233 424 C 238 418, 234 410, 227 404 Z"
      fill="#161616" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <path d="M 267 404 C 262 416, 270 424, 282 424 L 300 424 C 306 418, 302 410, 296 404 Z"
      fill="#161616" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <ellipse cx="223" cy="422" rx="16" ry="4" fill="${lighten(boots, 0.5)}" opacity="0.8"/>
    <ellipse cx="291" cy="422" rx="16" ry="4" fill="${lighten(boots, 0.5)}" opacity="0.8"/>
    ${contactShadow('M 205 368 Q 222 376 229 368 L 229 375 Q 222 383 205 375 Z')}
    ${contactShadow('M 271 368 Q 278 376 295 368 L 295 375 Q 278 383 271 375 Z')}

    <!-- shorts -->
    <path d="M 197 330 C 193 344, 197 358, 208 368 L 292 368 C 303 358, 307 344, 303 330 C 285 322, 215 322, 197 330 Z"
      fill="url(#shortsGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    ${contactShadow('M 200 335 Q 250 348 300 335 L 300 342 Q 250 355 200 342 Z')}

    <!-- torso / jersey -->
    <path d="M 190 258 C 176 288, 176 316, 194 340 L 306 340 C 324 316, 324 288, 310 258
      C 297 240, 270 230, 250 230 C 230 230, 203 240, 190 258 Z"
      fill="url(#jerseyGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <text x="250" y="300" font-family="Arial, sans-serif" font-weight="900" font-size="50" fill="#ffffff" text-anchor="middle" stroke="${darken(jersey, 0.4)}" stroke-width="1.5">${number}</text>
    ${contactShadow('M 193 262 Q 250 280 307 262 L 304 272 Q 250 290 196 272 Z')}

    ${frontArm}

    <!-- neck -->
    <rect x="228" y="235" width="44" height="26" fill="url(#skinGrad)"/>

    <!-- head -->
    <circle cx="${HEAD_CX}" cy="${HEAD_CY}" r="${HEAD_R}" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>
    <path d="M 165 ${HEAD_CY + 40} Q 250 ${HEAD_CY + 100} 335 ${HEAD_CY + 40} Q 305 ${HEAD_CY + 82} 250 ${HEAD_CY + 86} Q 195 ${HEAD_CY + 82} 165 ${HEAD_CY + 40} Z"
      fill="${darken(skin, 0.12)}" opacity="0.4"/>
    ${blush()}
    ${eyesPath(eyes)}
    ${mouthPath()}
    <ellipse cx="${HEAD_CX - 38}" cy="${HEAD_CY - 30}" rx="32" ry="21" fill="#ffffff" opacity="0.22"/>
    <ellipse cx="${HEAD_CX - 48}" cy="${HEAD_CY - 40}" rx="13" ry="10" fill="#ffffff" opacity="0.3"/>

    ${hairPath(hair)}

    ${propPath(prop)}
  `;
}

module.exports = { buildCharacterSvgGroup, lighten, darken };
