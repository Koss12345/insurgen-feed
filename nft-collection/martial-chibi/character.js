'use strict';

// Flat chibi-style footballer illustration: big round head, small body,
// smooth cubic-bezier silhouettes, thick outline, rich cel-shaded gradients
// (glossy vinyl-toy look). Drawn once as a front-facing SVG group — motion
// comes from idle.js (blink/bob/sparkle), not rotation.

const OUTLINE = '#1c130d';
const OUTLINE_W = 6.5;

// Chibi proportions: head dominates the silhouette, but not a full bobble-head.
// All head/hair/face art below is authored around this design-space center and
// radius, then uniformly scaled+repositioned onto the body by HEAD_TRANSFORM.
const HEAD_CX = 250;
const HEAD_CY = 142;
const HEAD_R = 108;

// Final on-body placement: smaller radius, sitting right on the collar.
const HEAD_FINAL_R = 68;
const HEAD_FINAL_CY = 170;
const HEAD_SCALE = HEAD_FINAL_R / HEAD_R;
const HEAD_TRANSFORM = `translate(${HEAD_CX},${HEAD_FINAL_CY}) scale(${HEAD_SCALE}) translate(${-HEAD_CX},${-HEAD_CY})`;
// Everything drawn inside HEAD_TRANSFORM (hair/eyes/mouth) is shrunk along with
// the head, so its stroke widths are pre-inflated by 1/HEAD_SCALE to still read
// as OUTLINE_W once scaled down — keeps line weight consistent head-to-body.
const HEAD_STROKE_W = OUTLINE_W / HEAD_SCALE;
const HEAD_STROKE_THIN = 6 / HEAD_SCALE;

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
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    }
    case 'afro':
      // Kept above the brow line (bottom edge ~138, eyes sit at ~156) so it frames
      // the head without covering the face — a full-radius circle here would.
      return `<clipPath id="hairClip"><circle cx="250" cy="58" r="80"/></clipPath>
        <circle cx="250" cy="58" r="80" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}"/>
        ${hairShine('hairClip')}`;
    case 'buzz': {
      const d = `M 152 95 C 150 28, 200 20, 250 20 C 300 20, 350 28, 348 95
        C 344 55, 300 50, 250 50 C 200 50, 156 55, 152 95 Z`;
      return `<clipPath id="hairClip"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    }
    case 'mohawk':
      return `<clipPath id="hairClip"><path d="M 220 95 Q 198 -18 250 -34 Q 302 -18 280 95 Z"/></clipPath>
        <path d="M 220 95 Q 198 -18 250 -34 Q 302 -18 280 95 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" stroke-linejoin="round"/>
        <path d="M 150 100 Q 148 68 170 68 Q 158 90 170 100 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" stroke-linejoin="round"/>
        <path d="M 350 100 Q 352 68 330 68 Q 342 90 330 100 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" stroke-linejoin="round"/>
        ${hairShine('hairClip')}`;
    case 'ponytail': {
      const d = `M 154 88 C 146 24, 200 18, 250 18 C 300 18, 354 24, 346 88
        C 340 50, 300 48, 250 48 C 200 48, 160 50, 154 88 Z`;
      return `<clipPath id="hairClip"><path d="${d}"/></clipPath>
        <path d="${d}" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" stroke-linejoin="round"/>
        <path d="M 340 62 Q 392 74 386 145 Q 378 108 334 90 Z" fill="url(#hairGrad)" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" stroke-linejoin="round"/>
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
  return `<path d="M ${cx - sign * 16} ${ey - 12 + tilt} q ${sign * 16} ${-6} ${sign * 32} ${-tilt}" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_THIN}" fill="none" stroke-linecap="round"/>`;
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
        <path d="M ${HEAD_CX - ex - 13} ${ey} q 13 -15 26 0" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" fill="none" stroke-linecap="round"/>
        <path d="M ${HEAD_CX + ex - 13} ${ey} q 13 -15 26 0" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" fill="none" stroke-linecap="round"/>`;
    case 'wink':
      return `${eyebrow(HEAD_CX - ex, ey, 1)}${eyebrow(HEAD_CX + ex, ey, 0)}
        ${pupil(HEAD_CX - ex, ey)}
        <path d="M ${HEAD_CX + ex - 13} ${ey} q 13 -13 26 0" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" fill="none" stroke-linecap="round"/>`;
    case 'shades': {
      const sw = 5 / HEAD_SCALE;
      return `<rect x="${HEAD_CX - ex - 21}" y="${ey - 15}" width="46" height="27" rx="11" fill="#141414" stroke="${OUTLINE}" stroke-width="${sw}"/>
        <rect x="${HEAD_CX + ex - 25}" y="${ey - 15}" width="46" height="27" rx="11" fill="#141414" stroke="${OUTLINE}" stroke-width="${sw}"/>
        <path d="M ${HEAD_CX - ex + 25} ${ey - 4} l ${ex * 2 - 50} 0" stroke="${OUTLINE}" stroke-width="${sw}"/>
        <path d="M ${HEAD_CX + ex + 25} ${ey - 9} l 19 -6" stroke="${OUTLINE}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M ${HEAD_CX - ex - 25} ${ey - 9} l -19 -6" stroke="${OUTLINE}" stroke-width="${sw}" stroke-linecap="round"/>
        <ellipse cx="${HEAD_CX - ex - 10}" cy="${ey - 8}" rx="8" ry="4" fill="#ffffff" opacity="0.35"/>
        <ellipse cx="${HEAD_CX + ex - 14}" cy="${ey - 8}" rx="8" ry="4" fill="#ffffff" opacity="0.35"/>`;
    }
    default:
      return `${eyebrow(HEAD_CX - ex, ey, 0)}${eyebrow(HEAD_CX + ex, ey, 0)}
        ${pupil(HEAD_CX - ex, ey)}${pupil(HEAD_CX + ex, ey)}`;
  }
}

function mouthPath() {
  const my = HEAD_CY + 48;
  return `<path d="M ${HEAD_CX - 18} ${my} q 18 15 36 0" stroke="${OUTLINE}" stroke-width="${HEAD_STROKE_W}" fill="none" stroke-linecap="round"/>`;
}

function blush() {
  const by = HEAD_CY + 32;
  return `<ellipse cx="${HEAD_CX - 58}" cy="${by}" rx="17" ry="10" fill="#ff8577" opacity="0.35"/>
    <ellipse cx="${HEAD_CX + 58}" cy="${by}" rx="17" ry="10" fill="#ff8577" opacity="0.35"/>`;
}

function contactShadow(pathD) {
  return `<path d="${pathD}" fill="#00000022" stroke="none"/>`;
}

// A real cleat, not a rounded blob: a toe box + tongue laces, a lighter
// midsole band, and a row of stud marks under the sole.
// Bare foot, wrapped at the ankle — martial artists strike barefoot.
function bareFoot(cx, topY, skinColor, mirror, angleDeg) {
  const m = mirror ? -1 : 1;
  return `<g transform="translate(${cx},${topY}) rotate(${angleDeg}) scale(${m},1)">
    <path d="M -14,-6 C -19,-2 -19,8 -12,13 L 20,13 C 26,10 26,0 18,-6
      C 12,-11 -6,-11 -14,-6 Z"
      fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <path d="M -15,-8 L -19,-14" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linecap="round"/>
    <path d="M -13,-12 L -16,-19" stroke="${OUTLINE}" stroke-width="${OUTLINE_W * 0.8}" stroke-linecap="round"/>
  </g>`;
}

// Comic-style impact burst + speed-line arcs, placed at the strike point.
function impactBurst(cx, cy, scale = 1) {
  const spikes = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const r = i % 2 === 0 ? 34 : 15;
    spikes.push(`${cx + Math.cos(a) * r * scale},${cy + Math.sin(a) * r * scale}`);
  }
  return `<polygon points="${spikes.join(' ')}" fill="#fff6c8" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round" opacity="0.95"/>
    <circle cx="${cx}" cy="${cy}" r="${10 * scale}" fill="#ffffff"/>`;
}

function speedLines(hipX, hipY, footX, footY) {
  const dx = footX - hipX;
  const dy = footY - hipY;
  const lines = [0.3, 0.55, 0.8].map((t) => {
    const x1 = hipX + dx * t - dy * 0.12;
    const y1 = hipY + dy * t + dx * 0.12;
    const x2 = x1 + dx * 0.16;
    const y2 = y1 + dy * 0.16;
    return `<path d="M ${x1},${y1} L ${x2},${y2}" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.55"/>`;
  });
  return lines.join('');
}

function buildCharacterSvgGroup(traits) {
  const { skin, gi, belt, hair, hairColor, eyes, kick } = traits;

  const defs = `
    ${grad3('skinGrad', skin)}
    ${grad3('hairGrad', hairColor)}
    ${grad3('giGrad', gi)}
    ${grad3('giSleeveGrad', darken(gi, 0.08))}
    ${grad3('beltGrad', belt)}
  `;

  // Two strike variants: a high roundhouse kick (right leg) or a straight
  // punch (right arm), so the collection isn't just one repeated pose.
  const isKick = kick;

  const supportLeg = `<path d="M 216 340 C 208 366 202 392 200 418 L 226 418 C 230 392 232 366 232 340 Z"
      fill="url(#giGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>`;
  const supportFoot = bareFoot(213, 418, skin, false, 0);

  // The kicking leg is deliberately drawn wider than an arm sleeve (a leg,
  // not a fourth arm) and its tip is a fused rounded cap rather than a
  // separate foot shape — mid-strike, exact toe detail reads as clutter.
  const kickLeg = isKick
    ? `<path d="M 266 336 C 302 330 338 312 368 284 C 388 265 402 248 412 234
        C 426 240 432 258 421 273
        C 400 297 372 317 338 331 C 310 341 284 342 266 338 Z"
        fill="url(#giGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <ellipse cx="417" cy="253" rx="21" ry="17" fill="url(#giGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" transform="rotate(-40 417 253)"/>`
    : `<path d="M 278 340 C 272 366 270 392 272 418 L 298 418 C 300 392 302 366 296 340 Z"
        fill="url(#giGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>`;
  const kickFoot = isKick ? '' : bareFoot(285, 418, skin, true, 0);

  const frontArm = isKick
    ? `<path d="M 182 258 C 158 272 146 292 150 312 C 160 318 172 316 180 308 C 186 292 192 276 202 262 Z"
         fill="url(#giSleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="162" cy="310" r="17" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`
    : `<path d="M 195 250 C 230 244 270 242 310 246 L 388 258 C 396 262 396 272 388 276
         L 300 266 C 260 264 224 266 194 272 C 186 264 188 256 195 250 Z"
         fill="url(#giSleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="392" cy="264" r="19" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`;

  const backArm = isKick
    ? `<path d="M 318 258 C 340 250 358 254 368 268 C 362 278 350 282 340 278
         C 328 272 320 266 314 260 Z"
         fill="url(#giSleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="364" cy="270" r="17" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`
    : `<path d="M 308 252 C 328 256 340 268 336 286 C 328 294 316 292 310 284
         C 304 270 302 258 308 252 Z"
         fill="url(#giSleeveGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
       <circle cx="328" cy="288" r="16" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}"/>`;

  const impact = isKick ? impactBurst(417, 253, 0.85) : impactBurst(392, 264, 0.75);
  const trails = isKick ? speedLines(278, 340, 412, 234) : speedLines(240, 260, 388, 262);

  return `
    <defs>${defs}</defs>

    <ellipse cx="250" cy="432" rx="92" ry="17" fill="#00000030"/>

    ${backArm}
    ${!isKick ? kickLeg : ''}
    ${supportLeg}
    ${!isKick ? kickFoot : ''}
    ${supportFoot}
    ${isKick ? kickLeg : ''}
    ${isKick ? kickFoot : ''}
    ${contactShadow('M 203 342 Q 224 350 229 342 L 229 349 Q 224 357 203 349 Z')}

    <!-- gi top, cinched by the belt (rarity tier) -->
    <path d="M 190 258 C 176 288, 176 316, 194 340 L 306 340 C 324 316, 324 288, 310 258
      C 297 240, 270 230, 250 230 C 230 230, 203 240, 190 258 Z"
      fill="url(#giGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W}" stroke-linejoin="round"/>
    <path d="M 216 244 L 250 300 L 284 244" stroke="${darken(gi, 0.35)}" stroke-width="4" fill="none" opacity="0.5" stroke-linecap="round"/>
    <rect x="185" y="296" width="130" height="24" fill="url(#beltGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W * 0.75}"/>
    <path d="M 240 320 L 232 344 L 250 338 L 268 344 L 260 320 Z" fill="url(#beltGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W * 0.65}" stroke-linejoin="round"/>
    ${contactShadow('M 193 262 Q 250 280 307 262 L 304 272 Q 250 290 196 272 Z')}

    ${frontArm}
    ${trails}
    ${impact}

    <!-- neck -->
    <rect x="228" y="235" width="44" height="26" rx="10" fill="url(#skinGrad)"/>

    <!-- head (authored large, then scaled down onto the body as one unit) -->
    <g transform="${HEAD_TRANSFORM}">
      <circle cx="${HEAD_CX}" cy="${HEAD_CY}" r="${HEAD_R}" fill="url(#skinGrad)" stroke="${OUTLINE}" stroke-width="${OUTLINE_W / HEAD_SCALE}"/>
      <path d="M 165 ${HEAD_CY + 40} Q 250 ${HEAD_CY + 100} 335 ${HEAD_CY + 40} Q 305 ${HEAD_CY + 82} 250 ${HEAD_CY + 86} Q 195 ${HEAD_CY + 82} 165 ${HEAD_CY + 40} Z"
        fill="${darken(skin, 0.12)}" opacity="0.4"/>
      ${blush()}
      ${eyesPath(eyes)}
      ${mouthPath()}
      <ellipse cx="${HEAD_CX - 38}" cy="${HEAD_CY - 30}" rx="32" ry="21" fill="#ffffff" opacity="0.22"/>
      <ellipse cx="${HEAD_CX - 48}" cy="${HEAD_CY - 40}" rx="13" ry="10" fill="#ffffff" opacity="0.3"/>

      ${hairPath(hair)}
    </g>
  `;
}

module.exports = { buildCharacterSvgGroup, lighten, darken };
