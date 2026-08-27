'use strict';

// Minimal 3D math + box-mesh helpers — no WebGL/three.js needed, just enough
// vector math to spin a low-poly figurine and rasterize it with a painter's
// algorithm (sort faces back-to-front, draw as flat-shaded 2D polygons).

function vAdd(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function vSub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function vScale(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
function vDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function vCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function vLength(a) { return Math.sqrt(vDot(a, a)); }
function vNormalize(a) {
  const l = vLength(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

function rotateX(p, deg) {
  const r = (deg * Math.PI) / 180;
  const [x, y, z] = p;
  return [x, y * Math.cos(r) - z * Math.sin(r), y * Math.sin(r) + z * Math.cos(r)];
}

function rotateY(p, deg) {
  const r = (deg * Math.PI) / 180;
  const [x, y, z] = p;
  return [x * Math.cos(r) + z * Math.sin(r), y, -x * Math.sin(r) + z * Math.cos(r)];
}

// Rotate point `p` around `axisDeg` (X-axis rotation) about a `pivot`.
function rotateXAroundPivot(p, pivot, deg) {
  return vAdd(rotateX(vSub(p, pivot), deg), pivot);
}

// Returns the 8 corner vertices of an axis-aligned box centered at `center`
// with full size [sx, sy, sz].
function boxVertices(center, size) {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size;
  const x0 = cx - sx / 2, x1 = cx + sx / 2;
  const y0 = cy - sy / 2, y1 = cy + sy / 2;
  const z0 = cz - sz / 2, z1 = cz + sz / 2;
  return [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], // 0-3
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], // 4-7
  ];
}

// Given 8 box vertices (see boxVertices order), returns the 6 faces as
// index quads in outward-CCW winding (verified against right-handed cross
// product so lighting/culling normals come out correct).
const BOX_FACES = {
  front: [0, 3, 2, 1], // z0, outward normal (0,0,-1)
  back: [4, 5, 6, 7], // z1, outward normal (0,0,1)
  left: [0, 4, 7, 3], // x0, outward normal (-1,0,0)
  right: [1, 2, 6, 5], // x1, outward normal (1,0,0)
  bottom: [0, 1, 5, 4], // y0, outward normal (0,-1,0)
  top: [3, 7, 6, 2], // y1, outward normal (0,1,0)
};

module.exports = {
  vAdd, vSub, vScale, vDot, vCross, vLength, vNormalize,
  rotateX, rotateY, rotateXAroundPivot,
  boxVertices, BOX_FACES,
};
