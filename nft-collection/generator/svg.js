'use strict';

// Pure-SVG building blocks for the generative art. No external art assets —
// everything is drawn from primitives so the pipeline runs with zero setup.

const CANVAS = 500;
const CX = CANVAS / 2;
const CY = 230; // face center is slightly above the vertical middle

function defsForPattern(id, patternValue, colors) {
  const [c1, c2] = colors;
  if (patternValue === 'gradient') {
    return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>`;
  }
  if (patternValue === 'stripes') {
    return `<pattern id="${id}" width="24" height="24" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="${c1}"/>
      <rect width="12" height="24" fill="${c2}"/>
    </pattern>`;
  }
  if (patternValue === 'dots') {
    return `<pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse">
      <rect width="26" height="26" fill="${c1}"/>
      <circle cx="13" cy="13" r="5" fill="${c2}"/>
    </pattern>`;
  }
  // solid
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </linearGradient>`;
}

function backgroundRect(colors) {
  const [c1, c2] = colors;
  return `<defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="${CANVAS}" height="${CANVAS}" fill="url(#bg)"/>`;
}

function shapeBody(shape, fillRef, size = 200) {
  const r = size / 2;
  switch (shape) {
    case 'Circle':
      return `<circle cx="${CX}" cy="${CY}" r="${r}" fill="${fillRef}" stroke="#00000022" stroke-width="4"/>`;
    case 'Square':
      return `<rect x="${CX - r}" y="${CY - r}" width="${size}" height="${size}" rx="24" fill="${fillRef}" stroke="#00000022" stroke-width="4"/>`;
    case 'Triangle': {
      const h = size * 0.95;
      const p1 = `${CX},${CY - h / 2}`;
      const p2 = `${CX - size / 2},${CY + h / 2}`;
      const p3 = `${CX + size / 2},${CY + h / 2}`;
      return `<polygon points="${p1} ${p2} ${p3}" fill="${fillRef}" stroke="#00000022" stroke-width="4" stroke-linejoin="round"/>`;
    }
    case 'Hexagon': {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        pts.push(`${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${fillRef}" stroke="#00000022" stroke-width="4" stroke-linejoin="round"/>`;
    }
    case 'Star': {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.5;
        pts.push(`${CX + rad * Math.cos(angle)},${CY + rad * Math.sin(angle)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${fillRef}" stroke="#00000022" stroke-width="4" stroke-linejoin="round"/>`;
    }
    default:
      return `<circle cx="${CX}" cy="${CY}" r="${r}" fill="${fillRef}"/>`;
  }
}

function eyesSvg(style, glow) {
  const ex = 40; // horizontal offset from center
  const ey = CY - 20;
  const glowFilter = glow ? `filter="url(#glow)"` : '';
  const glowDef = glow
    ? `<filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
         <feGaussianBlur stdDeviation="4" result="blur"/>
         <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
       </filter>`
    : '';
  let eyeShape;
  switch (style) {
    case 'Round':
      eyeShape = `<circle cx="${CX - ex}" cy="${ey}" r="14" fill="#101418"/><circle cx="${CX + ex}" cy="${ey}" r="14" fill="#101418"/>`;
      break;
    case 'Sleepy':
      eyeShape = `<rect x="${CX - ex - 14}" y="${ey - 3}" width="28" height="7" rx="3.5" fill="#101418"/><rect x="${CX + ex - 14}" y="${ey - 3}" width="28" height="7" rx="3.5" fill="#101418"/>`;
      break;
    case 'Wink':
      eyeShape = `<circle cx="${CX - ex}" cy="${ey}" r="14" fill="#101418"/><path d="M ${CX + ex - 15} ${ey} q 15 12 30 0" stroke="#101418" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      break;
    case 'Star':
      eyeShape = starEyes(CX - ex, ey) + starEyes(CX + ex, ey);
      break;
    case 'Laser':
      eyeShape = `<circle cx="${CX - ex}" cy="${ey}" r="12" fill="#ff2d55"/><circle cx="${CX + ex}" cy="${ey}" r="12" fill="#ff2d55"/>`;
      break;
    case 'Diamond':
      eyeShape = diamondEyes(CX - ex, ey) + diamondEyes(CX + ex, ey);
      break;
    default:
      eyeShape = `<circle cx="${CX - ex}" cy="${ey}" r="14" fill="#101418"/><circle cx="${CX + ex}" cy="${ey}" r="14" fill="#101418"/>`;
  }
  return `${glowDef}<g ${glowFilter}>${eyeShape}</g>`;
}

function starEyes(x, y) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? 11 : 5;
    pts.push(`${x + rad * Math.cos(angle)},${y + rad * Math.sin(angle)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="#101418"/>`;
}

function diamondEyes(x, y) {
  return `<polygon points="${x},${y - 13} ${x + 10},${y} ${x},${y + 13} ${x - 10},${y}" fill="#8ee9ff" stroke="#101418" stroke-width="1.5"/>`;
}

function mouthSvg(style) {
  const my = CY + 55;
  switch (style) {
    case 'Smile':
      return `<path d="M ${CX - 30} ${my} q 30 26 60 0" stroke="#101418" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    case 'Flat':
      return `<rect x="${CX - 26}" y="${my}" width="52" height="7" rx="3.5" fill="#101418"/>`;
    case 'Open':
      return `<ellipse cx="${CX}" cy="${my + 8}" rx="20" ry="16" fill="#101418"/>`;
    case 'Fangs':
      return `<path d="M ${CX - 28} ${my} q 28 22 56 0" stroke="#101418" stroke-width="7" fill="none" stroke-linecap="round"/>
        <polygon points="${CX - 14},${my + 4} ${CX - 8},${my + 4} ${CX - 11},${my + 16}" fill="#ffffff"/>
        <polygon points="${CX + 8},${my + 4} ${CX + 14},${my + 4} ${CX + 11},${my + 16}" fill="#ffffff"/>`;
    default:
      return `<path d="M ${CX - 30} ${my} q 30 26 60 0" stroke="#101418" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  }
}

function accessorySvg(name) {
  const topY = CY - 100;
  switch (name) {
    case 'None':
      return '';
    case 'Cap':
      return `<path d="M ${CX - 90} ${topY + 10} a 90 60 0 0 1 180 0 z" fill="#d64545"/>
        <rect x="${CX - 15}" y="${topY - 8}" width="30" height="16" rx="6" fill="#d64545"/>`;
    case 'Glasses':
      return `<g stroke="#101418" stroke-width="5" fill="#ffffff33">
        <circle cx="${CX - 40}" cy="${CY - 20}" r="26"/>
        <circle cx="${CX + 40}" cy="${CY - 20}" r="26"/>
        <line x1="${CX - 14}" y1="${CY - 20}" x2="${CX + 14}" y2="${CY - 20}"/>
      </g>`;
    case 'Halo':
      return `<ellipse cx="${CX}" cy="${topY - 10}" rx="45" ry="12" fill="none" stroke="#ffe066" stroke-width="6"/>`;
    case 'Crown':
      return `<polygon points="${CX - 55},${topY + 20} ${CX - 55},${topY - 20} ${CX - 25},${topY + 5} ${CX},${topY - 30} ${CX + 25},${topY + 5} ${CX + 55},${topY - 20} ${CX + 55},${topY + 20}" fill="#f4c430" stroke="#8a6d00" stroke-width="3"/>`;
    case 'Headphones':
      return `<path d="M ${CX - 95} ${CY - 10} a 95 95 0 0 1 190 0" stroke="#2b2d42" stroke-width="10" fill="none"/>
        <rect x="${CX - 105}" y="${CY - 25}" width="24" height="46" rx="10" fill="#2b2d42"/>
        <rect x="${CX + 81}" y="${CY - 25}" width="24" height="46" rx="10" fill="#2b2d42"/>`;
    case 'Golden Crown':
      return `<polygon points="${CX - 55},${topY + 20} ${CX - 55},${topY - 20} ${CX - 25},${topY + 5} ${CX},${topY - 30} ${CX + 25},${topY + 5} ${CX + 55},${topY - 20} ${CX + 55},${topY + 20}" fill="url(#goldGrad)" stroke="#8a6d00" stroke-width="3"/>
        <circle cx="${CX}" cy="${topY - 30}" r="7" fill="#ff2d55"/>
        <defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fff3b0"/><stop offset="100%" stop-color="#e6b800"/>
        </linearGradient></defs>`;
    default:
      return '';
  }
}

function buildSvg({ background, shape, pattern, eyes, mouth, accessory }) {
  const patternId = 'shapeFill';
  const defs = defsForPattern(patternId, pattern.fill, shape.bodyColors);
  const body = shapeBody(shape.value, `url(#${patternId})`, 210);
  const eyesEl = eyesSvg(eyes.value, !!eyes.glow);
  const mouthEl = mouthSvg(mouth.value);
  const accessoryEl = accessorySvg(accessory.value);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
  ${backgroundRect(background.colors)}
  <defs>${defs}</defs>
  ${body}
  ${eyesEl}
  ${mouthEl}
  ${accessoryEl}
</svg>`;
}

module.exports = { buildSvg, CANVAS };
