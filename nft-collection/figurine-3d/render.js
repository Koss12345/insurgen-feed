'use strict';

const { rotateY, vSub, vCross, vNormalize, vDot } = require('./geometry');

const CANVAS = 500;
const CAM_DIST = 12; // camera sits at z = -CAM_DIST looking toward +z
const BASE_SCALE = 47.5; // pixels per world unit at z = 0 (chosen so the ~8-unit-tall figure fills the frame)
const FEET_Y_PX = CANVAS * 0.88; // where world y=0 (feet) lands on screen
const LIGHT_DIR = vNormalize([-0.5, 0.8, -1]); // fixed in camera space, so shading shifts as the model spins
const AMBIENT = 0.45;

function project(p) {
  const [x, y, z] = p;
  const zc = z + CAM_DIST;
  const scale = BASE_SCALE * (CAM_DIST / zc);
  return [CANVAS / 2 + x * scale, FEET_Y_PX - y * scale];
}

function shadeColor(hex, brightness) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * brightness)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// Renders one frame of the figure rotated by `angleDeg` around Y, returns SVG markup.
function renderFrameSvg(parts, angleDeg, jerseyNumber) {
  const drawFaces = [];

  for (const part of parts) {
    for (const face of part.faces) {
      const rotated = face.verts.map((v) => rotateY(v, angleDeg));
      const e1 = vSub(rotated[1], rotated[0]);
      const e2 = vSub(rotated[2], rotated[0]);
      const normal = vNormalize(vCross(e1, e2));
      // Camera sits at world z = -CAM_DIST; a face is visible when its normal points back toward the camera.
      const centroid = rotated.reduce((acc, v) => [acc[0] + v[0] / 4, acc[1] + v[1] / 4, acc[2] + v[2] / 4], [0, 0, 0]);
      const viewDir = vNormalize([-centroid[0], -centroid[1], -CAM_DIST - centroid[2]]);
      const facing = vDot(normal, viewDir);
      if (facing <= 0.001) continue; // backface cull

      const avgZ = (rotated[0][2] + rotated[1][2] + rotated[2][2] + rotated[3][2]) / 4;
      const brightness = AMBIENT + (1 - AMBIENT) * Math.max(0, vDot(normal, LIGHT_DIR));
      const projected = rotated.map(project);

      drawFaces.push({
        avgZ,
        points: projected.map((p) => p.join(',')).join(' '),
        fill: shadeColor(face.color, brightness),
        isNumberPlate: face.isNumberPlate,
        jerseyNumber,
        plateCenter: projected.reduce((acc, p) => [acc[0] + p[0] / 4, acc[1] + p[1] / 4], [0, 0]),
        plateWidth: Math.hypot(projected[1][0] - projected[0][0], projected[1][1] - projected[0][1]),
      });
    }
  }

  drawFaces.sort((a, b) => b.avgZ - a.avgZ); // farthest first, nearest drawn last (on top)

  let body = '';
  let numberOverlay = '';
  for (const f of drawFaces) {
    body += `<polygon points="${f.points}" fill="${f.fill}" stroke="${f.fill}" stroke-width="0.5"/>`;
    if (f.isNumberPlate) {
      const fontSize = Math.max(10, f.plateWidth * 0.42);
      numberOverlay = `<text x="${f.plateCenter[0]}" y="${f.plateCenter[1] + fontSize * 0.35}" font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" stroke="#00000055" stroke-width="1">${f.jerseyNumber}</text>`;
    }
  }

  return { body, numberOverlay };
}

module.exports = { renderFrameSvg, CANVAS, FEET_Y_PX };
