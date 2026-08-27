'use strict';

const { buildCharacterSvgGroup, buildDefenderSvgGroup } = require('./character');
const { CANVAS } = require('./duo');

const SCALE = 0.62;
const ATTACKER_ANCHOR = { x: 175, y: 260 };
const DEFENDER_ANCHOR = { x: 300, y: 260 };
const BOB_AMPLITUDE = 3;

function anchorTransform(anchor, bobY) {
  const tx = anchor.x - 250 * SCALE;
  const ty = anchor.y - 340 * SCALE + bobY;
  return `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${SCALE})`;
}

// The attacker blinks once per loop (still "alive"); the defender holds the
// dazed expression throughout — they're mid-stagger, not blinking calmly.
function buildDuoIdleFrame(attackerTraits, defenderTraits, frameIndex, totalFrames, backgroundColor, patternSvg) {
  const t = frameIndex / totalFrames;
  const bobY = BOB_AMPLITUDE * Math.sin(2 * Math.PI * t);
  const swayY = BOB_AMPLITUDE * 1.4 * Math.sin(2 * Math.PI * t + Math.PI * 0.3);

  const blinkCenter = 0.22;
  const blinkWindow = 0.045;
  const isBlinking = Math.abs(t - blinkCenter) < blinkWindow;
  const attacker = isBlinking ? { ...attackerTraits, eyes: 'happy' } : attackerTraits;

  const defenderGroup = buildDefenderSvgGroup(defenderTraits);
  const attackerGroup = buildCharacterSvgGroup(attacker);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
    <rect width="${CANVAS}" height="${CANVAS}" fill="${backgroundColor}"/>
    ${patternSvg || ''}
    <g transform="${anchorTransform(DEFENDER_ANCHOR, swayY)}">${defenderGroup}</g>
    <g transform="${anchorTransform(ATTACKER_ANCHOR, bobY)}">${attackerGroup}</g>
  </svg>`;
}

module.exports = { buildDuoIdleFrame, CANVAS };
