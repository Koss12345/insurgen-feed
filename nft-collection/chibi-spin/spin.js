'use strict';

const CANVAS = 500;
const CHAR_CENTER_X = 250;

// The classic "spinning card" trick: animate horizontal scale as cos(theta).
// The character is drawn once, front-facing; this makes it appear to rotate
// around a vertical axis. Scale is clamped away from 0 so it never vanishes
// to a zero-width flicker frame.
function frameTransform(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const rawScale = Math.cos(rad);
  const sign = rawScale < 0 ? -1 : 1;
  const scaleX = sign * Math.max(0.08, Math.abs(rawScale));
  const shadowScale = 0.55 + 0.45 * Math.abs(rawScale);
  return { scaleX, shadowScale };
}

function buildFrameSvg(characterGroup, angleDeg, backgroundColor, patternSvg) {
  const { scaleX } = frameTransform(angleDeg);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
    <rect width="${CANVAS}" height="${CANVAS}" fill="${backgroundColor}"/>
    ${patternSvg || ''}
    <g transform="translate(${CHAR_CENTER_X},0) scale(${scaleX.toFixed(4)},1) translate(${-CHAR_CENTER_X},0)">
      ${characterGroup}
    </g>
  </svg>`;
}

module.exports = { buildFrameSvg, CANVAS };
