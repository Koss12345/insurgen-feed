'use strict';

const { buildCharacterSvgGroup } = require('./character');
const { sparkleOverlay } = require('./sparkle');

const CANVAS = 500;
const BOB_AMPLITUDE = 5;

// One idle loop cycle: a single natural blink partway through, a soft
// vertical breathing bob throughout, and a sparkle burst near the held prop
// timed to a second point in the loop — matching the reference's blink +
// spray-particle idle animation rather than any actual rotation.
function buildIdleFrame(baseTraits, frameIndex, totalFrames, backgroundColor, patternSvg) {
  const t = frameIndex / totalFrames;

  const bobY = BOB_AMPLITUDE * Math.sin(2 * Math.PI * t);

  const blinkCenter = 0.22;
  const blinkWindow = 0.045;
  const isBlinking = Math.abs(t - blinkCenter) < blinkWindow;
  const traits = isBlinking ? { ...baseTraits, eyes: 'happy' } : baseTraits;

  const sparkleCenter = 0.65;
  const sparkleWindow = 0.12;
  const sparkleDelta = Math.abs(t - sparkleCenter);
  const sparkleIntensity = sparkleDelta < sparkleWindow ? 1 - sparkleDelta / sparkleWindow : 0;
  const sparkle = baseTraits.prop === 'ball' ? sparkleOverlay(370, 330, sparkleIntensity, t * 10) : '';

  const characterGroup = buildCharacterSvgGroup(traits);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
    <rect width="${CANVAS}" height="${CANVAS}" fill="${backgroundColor}"/>
    ${patternSvg || ''}
    <g transform="translate(0,${bobY.toFixed(2)})">
      ${characterGroup}
      ${sparkle}
    </g>
  </svg>`;
}

module.exports = { buildIdleFrame, CANVAS };
