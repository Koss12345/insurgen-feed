// Чистая логика игры: уровни, миры, коллизии, коды обмена. Без DOM — тестируется в Node.

export const LEVEL_LENGTH = 4000;
export const MIN_X = 45;
export const MAX_X = 345;
export const WIDTH = 390;
export const MOVER_RANGE = 50;
export const PLAYER_RADIUS = 13;
export const SLOT_COUNT = 5;
export const MAX_OBSTACLES = 300;

export const WORLDS = [
  { name: 'Подвал', floor: '#2b3045', wall: '#1a1721', edge: 'rgba(77,204,255,0.85)',
    baseSpeed: 200, gain: 30, spacing: [190, 260], icy: false },
  { name: 'Лёд', floor: '#729ebf', wall: '#2e4761', edge: 'rgba(217,247,255,0.9)',
    baseSpeed: 240, gain: 40, spacing: [150, 230], icy: true },
  { name: 'Лава', floor: '#4d1f1a', wall: '#1f0d0d', edge: 'rgba(255,115,26,0.9)',
    baseSpeed: 290, gain: 55, spacing: [120, 190], icy: false }
];

export const KINDS = ['block', 'spike', 'mover', 'laser', 'mud'];

export const BRUSHES = [
  { name: 'Ящик', kind: 'block', w: 40, h: 40 },
  { name: 'Стенка', kind: 'block', w: 120, h: 28 },
  { name: 'Большой', kind: 'block', w: 80, h: 80 },
  { name: 'Шипы', kind: 'spike', w: 80, h: 30 },
  { name: 'Пила', kind: 'mover', w: 44, h: 44 },
  { name: 'Лазер', kind: 'laser', w: 100, h: 14 },
  { name: 'Лужа', kind: 'mud', w: 100, h: 60 }
];

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function makeObstacle(x, y, w, h, kind = 'block') { return { x, y, w, h, kind }; }

export function xOffset(o, t) {
  return o.kind === 'mover' ? MOVER_RANGE * Math.sin(t * 1.8 + o.y * 0.01) : 0;
}

/** Лазер горит секунду, секунду отдыхает */
export function laserOn(o, t) { return (t + o.y * 0.013) % 2 < 1; }

/** Лужа не убивает, а замедляет; лазер убивает, только когда горит */
export function isDeadly(o, t) {
  if (o.kind === 'mud') return false;
  if (o.kind === 'laser') return laserOn(o, t);
  return true;
}

export const isAnimated = o => o.kind === 'mover' || o.kind === 'laser';

const INSET = { block: 0, spike: 0.2, mover: 0.12, laser: 0.1, mud: 0 };

/** Опасная зона в момент t (у шипов и пилы чуть меньше картинки). Y растёт вверх. */
export function rect(o, t) {
  const ix = o.w * INSET[o.kind], iy = o.h * INSET[o.kind];
  return {
    minX: o.x + xOffset(o, t) - o.w / 2 + ix, maxX: o.x + xOffset(o, t) + o.w / 2 - ix,
    minY: o.y - o.h / 2 + iy, maxY: o.y + o.h / 2 - iy
  };
}

/** Вся область объекта (для удаления в редакторе) */
export function sweepRect(o) {
  const pad = o.kind === 'mover' ? MOVER_RANGE : 0;
  return { minX: o.x - o.w / 2 - pad, maxX: o.x + o.w / 2 + pad, minY: o.y - o.h / 2, maxY: o.y + o.h / 2 };
}

/** Пересекается ли круг игрока с прямоугольником */
export function circleHits(px, py, r, rc) {
  const cx = clamp(px, rc.minX, rc.maxX), cy = clamp(py, rc.minY, rc.maxY);
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy < r * r;
}

export function randomLevel(world = WORLDS[0]) {
  const obstacles = [];
  let y = 500;
  while (y < LEVEL_LENGTH - 200) {
    const roll = Math.floor(Math.random() * 100);
    const spot = w => rnd(MIN_X + w / 2, MAX_X - w / 2);
    if (roll < 10) {
      const w = rnd(80, 200);
      obstacles.push(makeObstacle(spot(w), y, w, 14, 'laser'));
    } else if (roll < 18) {
      const w = rnd(120, 300);
      obstacles.push(makeObstacle(spot(w), y, w, rnd(60, 100), 'mud'));
    } else if (roll < 32) {
      // Пила ездит в центре — по бокам всегда есть проход
      obstacles.push(makeObstacle(rnd(170, 220), y, 44, 44, 'mover'));
    } else if (roll < 45) {
      const w = rnd(50, 130);
      obstacles.push(makeObstacle(spot(w), y, w, rnd(28, 40), 'spike'));
    } else if (roll < 70) {
      const w = rnd(40, 140);
      obstacles.push(makeObstacle(spot(w), y, w, rnd(30, 60)));
    } else {
      // Два блока от стен, между ними всегда проход >= 100
      const h = rnd(30, 60), wl = rnd(40, 100), wr = rnd(40, 100);
      obstacles.push(makeObstacle(MIN_X + wl / 2, y, wl, h));
      obstacles.push(makeObstacle(MAX_X - wr / 2, y, wr, h));
    }
    y += rnd(world.spacing[0], world.spacing[1]);
  }
  return { obstacles };
}

/** Приводит значения (например, из чужого кода) к допустимым */
export function sanitizeObstacle(o) {
  if (!o || ![o.x, o.y, o.w, o.h].every(Number.isFinite)) return null;
  const kind = KINDS.includes(o.kind) ? o.kind : 'block';
  const w = clamp(o.w, 10, 200), h = clamp(o.h, 10, 200);
  const pad = w / 2 + (kind === 'mover' ? MOVER_RANGE : 0);
  if (pad >= (MAX_X - MIN_X) / 2) return null;
  return makeObstacle(clamp(o.x, MIN_X + pad, MAX_X - pad), clamp(o.y, 0, LEVEL_LENGTH), w, h, kind);
}

// MARK: — обмен уровнями. Формат TUNNEL1 совпадает с iOS-версией игры.

const TAG = 'TUNNEL1:';

const toB64 = s => btoa(unescape(encodeURIComponent(s)));
const fromB64 = s => decodeURIComponent(escape(atob(s)));

export function shareCode(level) { return TAG + toB64(JSON.stringify(level)); }

export function fromShareCode(text) {
  const t = String(text || '').replace(/\s+/g, '');
  if (!t.startsWith(TAG)) return null;
  try {
    const parsed = JSON.parse(fromB64(t.slice(TAG.length)));
    if (!parsed || !Array.isArray(parsed.obstacles)) return null;
    const obstacles = parsed.obstacles.slice(0, MAX_OBSTACLES).map(sanitizeObstacle).filter(Boolean);
    return { obstacles };
  } catch { return null; }
}

/** Код для параметра startapp (только A-Za-z0-9_-, до 512 символов), либо null */
export function toStartParam(code) {
  const p = 't1_' + code.slice(TAG.length).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return p.length <= 512 ? p : null;
}

export function fromStartParam(p) {
  if (!p || !p.startsWith('t1_')) return null;
  let b = p.slice(3).replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  return fromShareCode(TAG + b);
}

// MARK: — скорость и шаг игрока

export function scrollSpeed(world, camY) { return world.baseSpeed + world.gain * (camY / 1000); }

/** Новое положение игрока по X: палец тянет его к targetX; в луже медленнее, на льду скользит */
export function stepPlayerX(x, targetX, dt, world, inMud) {
  const step = (inMud ? 200 : 450) * dt;
  const dx = targetX - x;
  const move = world.icy ? dx * Math.min(1, dt * 4) : dx;
  return clamp(x + clamp(move, -step, step), MIN_X + PLAYER_RADIUS, MAX_X - PLAYER_RADIUS);
}

export const progressOf = y => clamp(Math.floor((y / LEVEL_LENGTH) * 100), 0, 100);
