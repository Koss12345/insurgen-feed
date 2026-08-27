'use strict';

const { buildCharacterSvgGroup } = require('./character');

const CANVAS = 500;
const BOB_AMPLITUDE = 4;

// A held strike (freeze-frame), not a full attack animation: a single blink
// partway through the loop plus a very subtle breathing bob — the impact
// burst itself is static art (part of character.js), not animated.
function buildIdleFrame(baseTraits, frameIndex, totalFrames, backgroundColor, patternSvg) {
  const t = frameIndex / totalFrames;

  const bobY = BOB_AMPLITUDE * Math.sin(2 * Math.PI * t);

  const blinkCenter = 0.22;
  const blinkWindow = 0.045;
  const isBlinking = Math.abs(t - blinkCenter) < blinkWindow;
  const traits = isBlinking ? { ...baseTraits, eyes: 'happy' } : baseTraits;

  const characterGroup = buildCharacterSvgGroup(traits);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
    <rect width="${CANVAS}" height="${CANVAS}" fill="${backgroundColor}"/>
    ${patternSvg || ''}
    <g transform="translate(0,${bobY.toFixed(2)})">
      ${characterGroup}
    </g>
  </svg>`;
}

module.exports = { buildIdleFrame, CANVAS };
