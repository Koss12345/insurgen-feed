'use strict';

const { boxVertices, BOX_FACES, vAdd, vSub, rotateXAroundPivot } = require('./geometry');

// Builds a low-poly "toy figurine" footballer in a kicking pose, entirely
// out of boxes — a stylized archetype (jersey number + colors), not a
// likeness of any real person.
//
// colors: { jersey, shorts, socks, skin, boots, hair, ball }
function buildFigure(colors) {
  const parts = [];

  function addBox(name, center, size, color, opts = {}) {
    let verts = boxVertices(center, size);
    if (opts.pivot && opts.rotateXDeg) {
      verts = verts.map((v) => rotateXAroundPivot(v, opts.pivot, opts.rotateXDeg));
    }
    const faces = Object.entries(BOX_FACES).map(([faceName, idx]) => ({
      name: `${name}:${faceName}`,
      verts: idx.map((i) => verts[i]),
      color,
      isNumberPlate: !!opts.numberPlateFace && faceName === opts.numberPlateFace,
    }));
    parts.push({ name, faces });
  }

  // Torso
  addBox('torso', [0, 5.2, 0], [2.0, 2.6, 1.1], colors.jersey, { numberPlateFace: 'front' });
  // Hips / shorts
  addBox('shorts', [0, 3.6, 0], [2.1, 1.0, 1.15], colors.shorts);
  // Head
  addBox('head', [0, 7.1, 0], [1.3, 1.3, 1.3], colors.skin);
  addBox('hair', [0, 7.75, -0.1], [1.32, 0.5, 1.15], colors.hair);

  // Left arm — relaxed at the side
  addBox('armLeftUpper', [-1.35, 5.0, 0], [0.65, 1.5, 0.65], colors.jersey, {
    pivot: [-1.35, 5.7, 0],
    rotateXDeg: -8,
  });
  addBox('armLeftLower', [-1.35, 3.5, 0.15], [0.6, 1.3, 0.6], colors.skin, {
    pivot: [-1.35, 4.2, 0],
    rotateXDeg: -8,
  });

  // Right arm — swung back for balance (mirrors the kicking leg)
  addBox('armRightUpper', [1.35, 5.0, 0], [0.65, 1.5, 0.65], colors.jersey, {
    pivot: [1.35, 5.7, 0],
    rotateXDeg: 35,
  });
  addBox('armRightLower', [1.35, 3.5, -0.15], [0.6, 1.3, 0.6], colors.skin, {
    pivot: [1.35, 4.2, 0],
    rotateXDeg: 35,
  });

  // Left leg — planted
  addBox('legLeftUpper', [-0.6, 2.6, 0], [0.9, 1.8, 0.9], colors.shorts, {
    pivot: [-0.6, 3.1, 0],
    rotateXDeg: -5,
  });
  addBox('legLeftLower', [-0.6, 0.9, 0.05], [0.8, 1.7, 0.8], colors.socks, {
    pivot: [-0.6, 1.6, 0],
    rotateXDeg: -5,
  });
  addBox('bootLeft', [-0.6, 0.25, 0.35], [0.85, 0.5, 1.3], colors.boots, {
    pivot: [-0.6, 1.6, 0],
    rotateXDeg: -5,
  });

  // Right leg — kicked forward toward the ball
  addBox('legRightUpper', [0.6, 2.7, 0.2], [0.9, 1.8, 0.9], colors.shorts, {
    pivot: [0.6, 3.2, 0],
    rotateXDeg: -40,
  });
  addBox('legRightLower', [0.6, 1.5, 1.1], [0.8, 1.7, 0.8], colors.socks, {
    pivot: [0.6, 2.35, 0.55],
    rotateXDeg: -55,
  });
  addBox('bootRight', [0.6, 0.75, 1.75], [0.85, 0.5, 1.3], colors.boots, {
    pivot: [0.6, 2.35, 0.55],
    rotateXDeg: -55,
  });

  // Ball, resting just ahead of the kicking foot
  addBox('ball', [0.75, 0.45, 2.35], [0.75, 0.75, 0.75], colors.ball);

  return parts;
}

module.exports = { buildFigure };
