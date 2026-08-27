'use strict';

const { buildCharacterSvgGroup, buildDefenderSvgGroup } = require('./character');

const CANVAS = 500;
const SCALE = 0.62;

// Both characters are full-size local drawings (same coordinate system as a
// solo portrait), just scaled down and anchored so the attacker's strike
// tip lands on the defender. Anchors are hip-ish reference points (250,340
// in local space) placed at fixed canvas positions — tuned empirically, not
// algebraically, same as every other pose in this collection.
const ATTACKER_ANCHOR = { x: 175, y: 260 };
const DEFENDER_ANCHOR = { x: 300, y: 260 };

function anchorTransform(anchor) {
  const tx = anchor.x - 250 * SCALE;
  const ty = anchor.y - 340 * SCALE;
  return `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${SCALE})`;
}

function buildDuoSvgGroup(attackerTraits, defenderTraits) {
  const attacker = buildCharacterSvgGroup(attackerTraits);
  const defender = buildDefenderSvgGroup(defenderTraits);

  return `
    <g transform="${anchorTransform(DEFENDER_ANCHOR)}">${defender}</g>
    <g transform="${anchorTransform(ATTACKER_ANCHOR)}">${attacker}</g>
  `;
}

module.exports = { buildDuoSvgGroup, CANVAS };
