import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../level.js';

test('случайный уровень укладывается в тоннель и всегда проходим', () => {
  for (const world of L.WORLDS) {
    for (let i = 0; i < 50; i++) {
      const { obstacles } = L.randomLevel(world);
      assert.ok(obstacles.length > 5);
      for (const o of obstacles) {
        assert.ok(o.x - o.w / 2 >= L.MIN_X - 0.001 && o.x + o.w / 2 <= L.MAX_X + 0.001);
        assert.ok(o.y >= 500 && o.y < L.LEVEL_LENGTH);
      }
      // Два блока у стен оставляют проход >= 100
      const byY = new Map();
      for (const o of obstacles) byY.set(o.y, [...(byY.get(o.y) || []), o]);
      for (const row of byY.values()) {
        if (row.length === 2) {
          const [a, b] = row.sort((p, q) => p.x - q.x);
          assert.ok((b.x - b.w / 2) - (a.x + a.w / 2) >= 100 - 0.001);
        }
      }
    }
  }
});

test('лазер горит секунду, лужа не опасна', () => {
  const laser = L.makeObstacle(200, 0, 100, 14, 'laser');
  assert.equal(L.isDeadly(laser, 0.5), true);
  assert.equal(L.isDeadly(laser, 1.5), false);
  assert.equal(L.isDeadly(L.makeObstacle(200, 0, 100, 60, 'mud'), 0), false);
});

test('пила ездит в пределах рельсы', () => {
  const m = L.makeObstacle(200, 700, 44, 44, 'mover');
  for (let t = 0; t < 10; t += 0.1) assert.ok(Math.abs(L.xOffset(m, t)) <= L.MOVER_RANGE + 1e-9);
  const s = L.sweepRect(m);
  assert.equal(s.maxX - s.minX, 44 + 2 * L.MOVER_RANGE);
});

test('круг пересекает прямоугольник только внутри радиуса', () => {
  const rc = { minX: 100, maxX: 200, minY: 100, maxY: 150 };
  assert.ok(L.circleHits(150, 160, 13, rc));
  assert.ok(!L.circleHits(150, 170, 13, rc));
  assert.ok(!L.circleHits(220, 125, 13, rc));
});

test('код обмена: туда-обратно', () => {
  const level = { obstacles: [L.makeObstacle(120, 600, 40, 40), L.makeObstacle(200, 900, 44, 44, 'mover')] };
  const back = L.fromShareCode(L.shareCode(level));
  assert.deepEqual(back, level);
  assert.deepEqual(L.fromShareCode('  ' + L.shareCode(level).replace(/(.{20})/g, '$1\n')), level);
});

test('код обмена из iOS-версии (без kind у старых блоков) читается', () => {
  const json = JSON.stringify({ obstacles: [{ x: 100, y: 500, w: 40, h: 40 }] });
  const lvl = L.fromShareCode('TUNNEL1:' + Buffer.from(json).toString('base64'));
  assert.equal(lvl.obstacles[0].kind, 'block');
});

test('мусор и враждебные значения отбрасываются или ограничиваются', () => {
  assert.equal(L.fromShareCode('hello'), null);
  assert.equal(L.fromShareCode('TUNNEL1:!!!'), null);
  const evil = { obstacles: [
    { x: 9999, y: -50, w: 5000, h: 1, kind: 'block' },
    { x: 'a', y: 1, w: 1, h: 1, kind: 'block' },
    { x: 200, y: 9999, w: 50, h: 50, kind: 'bomb' }
  ] };
  const lvl = L.fromShareCode('TUNNEL1:' + Buffer.from(JSON.stringify(evil)).toString('base64'));
  assert.equal(lvl.obstacles.length, 2); // объект с x: 'a' отброшен
  assert.equal(lvl.obstacles[0].y, 0);
  assert.equal(lvl.obstacles[0].w, 200);
  assert.equal(lvl.obstacles[1].kind, 'block'); // неизвестный вид -> ящик
  assert.equal(lvl.obstacles[1].y, L.LEVEL_LENGTH);
  const many = { obstacles: Array.from({ length: 1000 }, () => ({ x: 200, y: 10, w: 40, h: 40, kind: 'block' })) };
  assert.equal(L.fromShareCode('TUNNEL1:' + Buffer.from(JSON.stringify(many)).toString('base64')).obstacles.length, L.MAX_OBSTACLES);
});

test('startapp-параметр: туда-обратно и ограничение длины', () => {
  const level = { obstacles: [L.makeObstacle(120, 600, 40, 40)] };
  const p = L.toStartParam(L.shareCode(level));
  assert.match(p, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(L.fromStartParam(p), level);
  const big = { obstacles: Array.from({ length: 200 }, (_, i) => L.makeObstacle(200, i * 10, 40, 40)) };
  assert.equal(L.toStartParam(L.shareCode(big)), null);
  assert.equal(L.fromStartParam('zzz'), null);
});

test('движение: лёд скользит, лужа замедляет, стены держат', () => {
  const [basement, ice] = L.WORLDS;
  const dt = 1 / 60;
  assert.ok(L.stepPlayerX(200, 300, dt, basement, false) > L.stepPlayerX(200, 300, dt, ice, false));
  assert.ok(L.stepPlayerX(200, 300, dt, basement, true) < L.stepPlayerX(200, 300, dt, basement, false));
  assert.equal(L.stepPlayerX(200, 9999, 1, basement, false), L.MAX_X - L.PLAYER_RADIUS);
  assert.equal(L.stepPlayerX(200, -9999, 1, basement, false), L.MIN_X + L.PLAYER_RADIUS);
});

test('прогресс в процентах', () => {
  assert.equal(L.progressOf(-5), 0);
  assert.equal(L.progressOf(2000), 50);
  assert.equal(L.progressOf(99999), 100);
});
