import {
  LEVEL_LENGTH, MIN_X, MAX_X, WIDTH, MOVER_RANGE, PLAYER_RADIUS, SLOT_COUNT, MAX_OBSTACLES, WORLDS, KINDS, BRUSHES,
  makeObstacle, xOffset, laserOn, isDeadly, isAnimated, rect, sweepRect, circleHits, randomLevel, sanitizeObstacle,
  shareCode, fromShareCode, toStartParam, fromStartParam, scrollSpeed, stepPlayerX, progressOf
} from './level.js';

// Ссылка на мини-приложение в Telegram, например 'https://t.me/YourBot/app'.
// Если задана, «Поделиться» отправляет ссылку, которая сразу открывает уровень у друга.
const APP_LINK = '';

const $ = id => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData ? window.Telegram.WebApp : null;
const DEBUG_GOD = new URLSearchParams(location.search).has('god');

// ───────────────────────── Хранилище (localStorage + Telegram CloudStorage) ─────────────────────────

const STORE_KEY = 'tunnel_miniapp_v1';
const ACHIEVEMENTS = [
  ['first_win', 'Первый финиш', 'Дойди до финиша'],
  ['half', 'На полпути', 'Пройди 50% случайного тоннеля'],
  ['world_0', 'Хозяин подвала', 'Победи в мире «Подвал»'],
  ['world_1', 'Ледяной король', 'Победи в мире «Лёд»'],
  ['world_2', 'Покоритель лавы', 'Победи в мире «Лава»'],
  ['builder', 'Строитель', 'Поставь 20 объектов в редакторе'],
  ['own_win', 'Мой тоннель', 'Пройди свой уровень'],
  ['sharer', 'Делюсь', 'Поделись уровнем']
];

const cleanLevel = l => ({ obstacles: ((l && Array.isArray(l.obstacles)) ? l.obstacles : []).slice(0, MAX_OBSTACLES).map(sanitizeObstacle).filter(Boolean) });
const packLevel = l => JSON.stringify(l.obstacles.map(o => [KINDS.indexOf(o.kind), Math.round(o.x), Math.round(o.y), Math.round(o.w), Math.round(o.h)]));
const unpackLevel = s => {
  const rows = JSON.parse(s);
  return cleanLevel({ obstacles: rows.map(r => ({ kind: KINDS[r[0]], x: r[1], y: r[2], w: r[3], h: r[4] })) });
};

const Store = (() => {
  let data = { ts: 0, sound: true, music: true, haptics: true, world: 0, slot: 0, best: {}, ach: {}, levels: Array(SLOT_COUNT).fill(null) };
  const META = ['ts', 'sound', 'music', 'haptics', 'world', 'slot', 'best', 'ach'];
  let timer = 0;

  function adopt(src, levels) {
    for (const k of META) if (src[k] !== undefined) data[k] = src[k];
    data.world = clamp(Math.floor(+data.world) || 0, 0, WORLDS.length - 1);
    data.slot = clamp(Math.floor(+data.slot) || 0, 0, SLOT_COUNT - 1);
    if (levels) data.levels = Array.from({ length: SLOT_COUNT }, (_, i) => (levels[i] ? cleanLevel(levels[i]) : null));
  }

  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (raw) adopt(raw, raw.levels || []);
  } catch { /* первый запуск или хранилище недоступно */ }

  function pushCloud() {
    if (!tg || !tg.CloudStorage || !tg.isVersionAtLeast('6.9')) return;
    const meta = {}; for (const k of META) meta[k] = data[k];
    tg.CloudStorage.setItem('meta', JSON.stringify(meta));
    data.levels.forEach((l, i) => {
      if (!l) return tg.CloudStorage.removeItem('l' + i);
      const packed = packLevel(l);
      if (packed.length <= 4000) tg.CloudStorage.setItem('l' + i, packed); // иначе остаётся только на устройстве
    });
  }

  function save() {
    data.ts = Date.now();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* приватный режим */ }
    clearTimeout(timer);
    timer = setTimeout(pushCloud, 1500);
  }

  /** Подтягивает данные из облака Telegram, если они новее локальных (новое устройство) */
  function pullCloud(done) {
    if (!tg || !tg.CloudStorage || !tg.isVersionAtLeast('6.9')) return;
    const keys = ['meta', ...Array.from({ length: SLOT_COUNT }, (_, i) => 'l' + i)];
    tg.CloudStorage.getItems(keys, (err, vals) => {
      if (err || !vals || !vals.meta) return;
      try {
        const meta = JSON.parse(vals.meta);
        if (!(meta.ts > data.ts)) return;
        const levels = Array.from({ length: SLOT_COUNT }, (_, i) => { try { return vals['l' + i] ? unpackLevel(vals['l' + i]) : null; } catch { return null; } });
        adopt(meta, levels);
        try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
        done();
      } catch { /* битые данные облака игнорируем */ }
    });
  }

  const bestKey = slot => (slot == null ? 'w' + data.world : 's' + slot);
  return {
    get: k => data[k],
    set(k, v) { data[k] = v; save(); },
    level: slot => data.levels[slot],
    setLevel(slot, l) { data.levels[slot] = l; save(); },
    best: slot => data.best[bestKey(slot)] || 0,
    bestWorld: w => data.best['w' + w] || 0,
    submit(progress, slot) {
      const k = bestKey(slot), isNew = progress > (data.best[k] || 0);
      if (isNew) { data.best[k] = progress; save(); }
      return isNew;
    },
    resetRecords() { data.best = {}; save(); },
    totalScore: () => WORLDS.reduce((s, _, w) => s + (data.best['w' + w] || 0) * (w + 1), 0),
    hasAch: id => !!data.ach[id],
    unlock(id) { if (data.ach[id]) return false; data.ach[id] = true; save(); return true; },
    pullCloud
  };
})();

// ───────────────────────── Telegram и отдача (вибро) ─────────────────────────

function haptic(kind) {
  if (!Store.get('haptics')) return;
  const hf = tg && tg.HapticFeedback;
  if (hf) {
    if (kind === 'success' || kind === 'error') hf.notificationOccurred(kind);
    else hf.impactOccurred('light');
  } else if (navigator.vibrate) navigator.vibrate(kind === 'error' ? 120 : 15);
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function ask(text, yes) {
  if (tg && tg.isVersionAtLeast('6.2')) tg.showConfirm(text, ok => ok && yes());
  else if (confirm(text)) yes();
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

function openShare(url, text) {
  const link = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
  if (tg) tg.openTelegramLink(link); else window.open(link, '_blank');
}

// ───────────────────────── Звук (WebAudio, всё синтезируется) ─────────────────────────

const Sound = (() => {
  let ctx = null, musicTimer = 0, step = 0;
  const scale = [220, 261.6, 293.7, 329.6, 392, 440];
  const pattern = [0, 2, 4, 2, 3, 2, 1, 2, 0, 2, 4, 5, 4, 3, 2, 1];

  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = 'square', vol = 0.12, slideTo = 0, delay = 0) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol) {
    const c = ensure(); if (!c) return;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; g.gain.value = vol;
    s.connect(g).connect(c.destination); s.start();
  }
  function tick() {
    const n = pattern[step % pattern.length];
    tone(scale[n], 0.22, 'triangle', 0.045);
    if (step % 4 === 0) tone(scale[n] / 2, 0.4, 'sine', 0.06);
    step++;
  }
  return {
    unlock: ensure,
    play(name) {
      if (!Store.get('sound')) return;
      if (name === 'start') tone(300, 0.15, 'square', 0.1, 700);
      else if (name === 'hit') { noise(0.35, 0.3); tone(180, 0.3, 'sawtooth', 0.15, 50); }
      else if (name === 'win') [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', 0.1, 0, i * 0.12));
      else if (name === 'place') tone(520, 0.06, 'square', 0.08, 700);
      else if (name === 'remove') tone(400, 0.08, 'square', 0.08, 200);
    },
    syncMusic() {
      const want = Store.get('music') && ctx && !document.hidden;
      if (want && !musicTimer) musicTimer = setInterval(tick, 240);
      if (!want && musicTimer) { clearInterval(musicTimer); musicTimer = 0; }
    }
  };
})();

// ───────────────────────── Отрисовка ─────────────────────────

const cv = $('cv'), ctx = cv.getContext('2d');
let H = 844, scale = 1;                   // логическая высота (ширина всегда 390) и масштаб
const world = () => WORLDS[Store.get('world')];

function layout() {
  const cw = window.innerWidth, ch = window.innerHeight;
  const aspect = clamp(ch / cw, 560 / WIDTH, 900 / WIDTH);
  const w = Math.min(cw, ch / aspect), h = w * aspect;
  const stage = $('stage'), dpr = Math.min(window.devicePixelRatio || 1, 3);
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  scale = w / WIDTH; H = h / scale;
  ctx.setTransform(cv.width / WIDTH, 0, 0, cv.width / WIDTH, 0, 0);
  document.documentElement.style.fontSize = '16px';
}

const sy = (wy, camY) => H / 2 - (wy - camY);   // мир → экран (Y мира растёт вверх)

function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function drawTunnel(camY, w) {
  const yTop = camY + H / 2 + 40, yBot = camY - H / 2 - 40;
  ctx.fillStyle = '#12121a'; ctx.fillRect(0, 0, WIDTH, H);
  ctx.fillStyle = w.floor; ctx.fillRect(MIN_X, 0, MAX_X - MIN_X, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let y = Math.floor(yBot / 60) * 60; y <= yTop; y += 60) { const s = sy(y, camY); ctx.moveTo(MIN_X, s); ctx.lineTo(MAX_X, s); }
  for (let x = MIN_X + 60; x < MAX_X; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  ctx.stroke();

  ctx.fillStyle = w.wall; ctx.fillRect(0, 0, MIN_X, H); ctx.fillRect(MAX_X, 0, WIDTH - MAX_X, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath();
  for (const [x0, x1] of [[0, MIN_X], [MAX_X, WIDTH]]) {
    for (let y = Math.floor(yBot / 30) * 30; y <= yTop; y += 30) {
      const s = sy(y, camY), shift = (Math.floor(y / 30) % 2 === 0) ? 0 : 15;
      ctx.moveTo(x0, s); ctx.lineTo(x1, s);
      for (let x = x0 + shift; x < x1; x += 30) if (x > x0) { ctx.moveTo(x, s); ctx.lineTo(x, s - 30); }
    }
  }
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = w.edge; ctx.lineWidth = 3; ctx.shadowColor = w.edge; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(MIN_X, 0); ctx.lineTo(MIN_X, H); ctx.moveTo(MAX_X, 0); ctx.lineTo(MAX_X, H); ctx.stroke();
  ctx.restore();

  // Финиш в шашечку
  if (yTop > LEVEL_LENGTH) {
    const cell = 20, cols = (MAX_X - MIN_X) / cell;
    for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#fff' : '#1a1a1a';
      ctx.fillRect(MIN_X + c * cell, sy(LEVEL_LENGTH + (r + 1) * cell, camY), cell, cell);
    }
    ctx.fillStyle = '#fff'; ctx.font = '900 28px "Avenir Next", system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ФИНИШ', WIDTH / 2, sy(LEVEL_LENGTH + 60, camY));
  }
}

function drawObstacle(o, camY, t) {
  const cx = o.x + xOffset(o, t), s = sy(o.y, camY);
  if (s < -150 || s > H + 150) return;
  ctx.save();
  ctx.translate(cx, s);
  switch (o.kind) {
    case 'block': {
      rr(ctx, -o.w / 2, -o.h / 2, o.w, o.h, 5);
      ctx.fillStyle = '#b87333'; ctx.fill(); ctx.strokeStyle = '#6b4019'; ctx.lineWidth = 3; ctx.stroke();
      const hw = o.w / 2 - 6, hh = o.h / 2 - 6;
      ctx.globalAlpha = 0.7; ctx.beginPath();
      ctx.moveTo(-hw, -hh); ctx.lineTo(hw, hh); ctx.moveTo(-hw, hh); ctx.lineTo(hw, -hh); ctx.stroke();
      break;
    }
    case 'spike': {
      const n = Math.max(1, Math.floor(o.w / 22)), tw = o.w / n;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x0 = -o.w / 2 + i * tw;
        ctx.moveTo(x0, o.h / 2); ctx.lineTo(x0 + tw / 2, -o.h / 2); ctx.lineTo(x0 + tw, o.h / 2); ctx.closePath();
      }
      ctx.fillStyle = '#d1dbeb'; ctx.fill(); ctx.strokeStyle = '#596680'; ctx.lineWidth = 2; ctx.stroke();
      break;
    }
    case 'mover': {
      const r = o.w / 2, teeth = 10;
      ctx.rotate(t * Math.PI * 2 / 0.6);
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const a = i * Math.PI / teeth, rad = i % 2 === 0 ? r : r * 0.72;
        i === 0 ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad) : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fillStyle = '#bfc7d9'; ctx.fill(); ctx.strokeStyle = '#e64d4d'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fillStyle = '#e64d4d'; ctx.fill();
      break;
    }
    case 'laser': {
      const on = laserOn(o, t);
      ctx.globalAlpha = on ? 1 : 0.12;
      ctx.fillStyle = '#ff3333'; ctx.shadowColor = '#ff3333'; ctx.shadowBlur = on ? 10 : 0;
      rr(ctx, -o.w / 2, -3, o.w, 6, 3); ctx.fill();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      for (const dx of [-o.w / 2, o.w / 2]) {
        ctx.beginPath(); ctx.arc(dx, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#737373'; ctx.fill(); ctx.strokeStyle = '#262626'; ctx.lineWidth = 2; ctx.stroke();
      }
      break;
    }
    case 'mud': {
      rr(ctx, -o.w / 2, -o.h / 2, o.w, o.h, Math.min(o.w, o.h) / 2.5);
      ctx.fillStyle = 'rgba(89,64,31,0.92)'; ctx.fill(); ctx.strokeStyle = '#382612'; ctx.lineWidth = 3; ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

function drawObstacles(level, camY, t) {
  const list = level.obstacles;
  for (const o of list) if (o.kind === 'mud') drawObstacle(o, camY, t);
  ctx.strokeStyle = 'rgba(230,77,77,0.35)'; ctx.lineWidth = 4; ctx.beginPath();
  for (const o of list) if (o.kind === 'mover') { const s = sy(o.y, camY); ctx.moveTo(o.x - MOVER_RANGE, s); ctx.lineTo(o.x + MOVER_RANGE, s); }
  ctx.stroke();
  for (const o of list) if (o.kind !== 'mud') drawObstacle(o, camY, t);
}

function drawPlayer(x, y, phase) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.ellipse(2, 4, 17, 11, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  const sw = Math.sin(phase);
  ctx.fillStyle = '#1f1f1f';
  for (const dx of [-7, 7]) { rr(ctx, dx - 4, -5.5 + 7 * sw * (dx < 0 ? 1 : -1), 8, 11, 3); ctx.fill(); }
  ctx.fillStyle = '#f2c79e';
  for (const dx of [-17, 17]) { ctx.beginPath(); ctx.arc(dx, -8 + 6 * sw * (dx < 0 ? -1 : 1), 5, 0, Math.PI * 2); ctx.fill(); }
  rr(ctx, -15, -15, 30, 14, 7); ctx.fillStyle = '#4d8cff'; ctx.fill(); ctx.strokeStyle = '#264db3'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -9, 8, 0, Math.PI * 2); ctx.fillStyle = '#40261a'; ctx.fill();
  ctx.restore();
}

// ───────────────────────── Игра ─────────────────────────

const game = { source: 'random', level: { obstacles: [] }, state: 'ready', camY: 0, px: 195, targetX: 195, t: 0, offset: 250, dead: 0 };

function startGame(source) {
  const w = world();
  if (source === 'custom') {
    const saved = Store.level(Store.get('slot'));
    if (!saved || !saved.obstacles.length) { toast('Слот пуст — сначала построй уровень'); openEditor(); return; }
    game.level = saved;
  } else game.level = randomLevel(w);
  game.source = source; game.state = 'ready'; game.t = 0;
  game.offset = H * 0.3;
  game.camY = 172 + game.offset; game.px = game.targetX = WIDTH / 2;
  $('msg').textContent = 'Тяни палец влево-вправо,\nчтобы обходить препятствия.\nТап — старт';
  $('pct').textContent = '0%';
  setMode('play');
}

function finishGame(won) {
  game.state = 'over';
  const py = game.camY - game.offset, progress = won ? 100 : progressOf(py);
  const slot = game.source === 'custom' ? Store.get('slot') : null;
  const isNew = Store.submit(progress, slot);
  const earned = [];
  if (won) earned.push('first_win', game.source === 'custom' ? 'own_win' : 'world_' + Store.get('world'));
  if (game.source === 'random' && progress >= 50) earned.push('half');
  announce(earned);
  Sound.play(won ? 'win' : 'hit'); haptic(won ? 'success' : 'error');
  game.result = { won, progress, isNew };

  $('msg').classList.add('hidden');
  $('overTitle').textContent = won ? 'Победа!' : 'Врезался! ' + progress + '%';
  $('overSub').textContent = (isNew ? '🎉 Новый рекорд! ' : '') + 'Рекорд: ' + Store.best(slot) + '%';
  $('ovEdit').classList.toggle('hidden', game.source !== 'custom');
  $('over').classList.remove('hidden');
}

function announce(ids) {
  for (const id of ids) if (Store.unlock(id)) toast('🏆 ' + ACHIEVEMENTS.find(a => a[0] === id)[1]);
}

function updateGame(dt) {
  if (game.state !== 'playing') return;
  game.t += dt;
  const w = world(), t = game.t;
  game.camY += dt * scrollSpeed(w, game.camY);
  const py = game.camY - game.offset;
  const inMud = game.level.obstacles.some(o => o.kind === 'mud' && circleHits(game.px, py, PLAYER_RADIUS, rect(o, 0)));
  game.px = stepPlayerX(game.px, game.targetX, dt, w, inMud);
  $('pct').textContent = progressOf(py) + '%';
  if (!DEBUG_GOD && game.level.obstacles.some(o => isDeadly(o, t) && circleHits(game.px, py, PLAYER_RADIUS, rect(o, t)))) finishGame(false);
  else if (py >= LEVEL_LENGTH) finishGame(true);
}

function drawGame(now) {
  const w = world();
  drawTunnel(game.camY, w);
  drawObstacles(game.level, game.camY, game.t);
  drawPlayer(game.px, sy(game.camY - game.offset, game.camY), game.state === 'playing' ? game.t * Math.PI * 2 / 0.6 : 0);
}

// ───────────────────────── Редактор ─────────────────────────

const editor = { level: { obstacles: [] }, brush: 0, camY: 0, drag: null };

function openEditor() {
  editor.level = Store.level(Store.get('slot')) || { obstacles: [] };
  editor.camY = H / 2;
  setMode('editor');
  refreshEditor();
}

function refreshEditor() {
  $('edBrush').textContent = 'Кисть: ' + BRUSHES[editor.brush].name;
  $('edSlot').textContent = 'Слот ' + (Store.get('slot') + 1) + ' из ' + SLOT_COUNT;
  $('edInfo').textContent = 'Слот ' + (Store.get('slot') + 1) + ' · объектов: ' + editor.level.obstacles.length + '/' + MAX_OBSTACLES;
}

function editorTap(x, wy) {
  const list = editor.level.obstacles;
  for (let i = list.length - 1; i >= 0; i--) {
    const r = sweepRect(list[i]);
    if (x >= r.minX && x <= r.maxX && wy >= r.minY && wy <= r.maxY) {
      list.splice(i, 1); Sound.play('remove'); haptic('light'); Store.setLevel(Store.get('slot'), editor.level); refreshEditor(); return;
    }
  }
  if (list.length >= MAX_OBSTACLES) { toast('Достигнут предел объектов'); return; }
  const b = BRUSHES[editor.brush], pad = b.w / 2 + (b.kind === 'mover' ? MOVER_RANGE : 0);
  list.push(makeObstacle(clamp(x, MIN_X + pad, MAX_X - pad), clamp(wy, 0, LEVEL_LENGTH), b.w, b.h, b.kind));
  Sound.play('place'); haptic('light');
  Store.setLevel(Store.get('slot'), editor.level);
  if (list.length >= 20) announce(['builder']);
  refreshEditor();
}

function drawEditor(now) {
  drawTunnel(editor.camY, world());
  // Метки расстояния на стенах
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'center';
  for (let y = Math.max(500, Math.floor((editor.camY - H / 2) / 500) * 500); y <= editor.camY + H / 2; y += 500) ctx.fillText(String(y), MIN_X / 2, sy(y, editor.camY) + 4);
  drawObstacles(editor.level, editor.camY, now);
}

// ───────────────────────── Экраны и интерфейс ─────────────────────────

let mode = 'menu';          // menu | play | editor
let bgCam = 0;
const SCREENS = ['menu', 'settings', 'ach', 'over'];

function showScreen(name) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== name);
}

function setMode(m) {
  mode = m;
  const play = m === 'play', ed = m === 'editor';
  $('hud').classList.toggle('hidden', !play);
  $('msg').classList.toggle('hidden', !play);
  $('editorTop').classList.toggle('hidden', !ed);
  $('editorBar').classList.toggle('hidden', !ed);
  showScreen(m === 'menu' ? 'menu' : null);
  if (m === 'menu') refreshMenu();
  if (tg && tg.BackButton) (m === 'menu' ? tg.BackButton.hide() : tg.BackButton.show());
}

function goMenu() { setMode('menu'); }

function refreshMenu() {
  const w = world(), slot = Store.get('slot');
  $('worldName').textContent = w.name + (w.icy ? ' · скользко' : '');
  $('worldBest').textContent = 'Рекорд: ' + Store.best(null) + '%';
  const lv = Store.level(slot);
  $('slotName').textContent = 'Слот ' + (slot + 1) + ' из ' + SLOT_COUNT;
  $('slotBest').textContent = lv && lv.obstacles.length ? 'Объектов: ' + lv.obstacles.length + ' · рекорд ' + Store.best(slot) + '%' : 'Пусто';
}

function refreshSettings() {
  const on = v => (v ? 'вкл' : 'выкл');
  $('setSound').textContent = 'Звуки: ' + on(Store.get('sound'));
  $('setMusic').textContent = 'Музыка: ' + on(Store.get('music'));
  $('setHaptics').textContent = 'Вибрация: ' + on(Store.get('haptics'));
}

function refreshAchievements() {
  $('achList').innerHTML = ACHIEVEMENTS.map(([id, title, detail]) => {
    const done = Store.hasAch(id);
    return `<div class="ach${done ? ' done' : ''}"><b>${done ? '🏆' : '🔒'} ${title}</b><small>${detail}</small></div>`;
  }).join('');
  $('records').innerHTML = WORLDS.map((w, i) => `${w.name}: ${Store.bestWorld(i)}%`).join(' · ') + `<br>Всего очков: ${Store.totalScore()}`;
}

function cycle(key, dir, max) { Store.set(key, (Store.get(key) + dir + max) % max); refreshMenu(); haptic('light'); }

function importLevel(text, silent) {
  const level = fromShareCode(text);
  if (!level || !level.obstacles.length) { if (!silent) toast('Не похоже на код уровня'); return false; }
  const slot = Store.get('slot');
  const apply = () => { Store.setLevel(slot, level); editor.level = level; refreshEditor(); refreshMenu(); toast('Уровень загружен в слот ' + (slot + 1)); };
  const old = Store.level(slot);
  if (old && old.obstacles.length) ask('Заменить уровень в слоте ' + (slot + 1) + '?', apply); else apply();
  return true;
}

function shareLevel() {
  const level = editor.level;
  if (!level.obstacles.length) { toast('Сначала поставь хоть что-нибудь'); return; }
  const code = shareCode(level), param = toStartParam(code);
  announce(['sharer']);
  if (APP_LINK && param) { openShare(APP_LINK + '?startapp=' + param, 'Пройди мой тоннель!'); return; }
  copyText(code).then(ok => toast(ok ? 'Код скопирован — отправь его другу' : 'Отправь код другу'));
  openShare(APP_LINK || location.href.split('?')[0], code);
}

function bind() {
  const on = (id, fn) => $(id).addEventListener('click', e => { Sound.unlock(); Sound.syncMusic(); fn(e); });
  on('worldPrev', () => cycle('world', -1, WORLDS.length)); on('worldNext', () => cycle('world', 1, WORLDS.length));
  on('slotPrev', () => cycle('slot', -1, SLOT_COUNT)); on('slotNext', () => cycle('slot', 1, SLOT_COUNT));
  on('btnPlay', () => startGame('random'));
  on('btnCustom', () => startGame('custom'));
  on('btnEditor', openEditor);
  on('btnAch', () => { refreshAchievements(); showScreen('ach'); });
  on('btnSettings', () => { refreshSettings(); showScreen('settings'); });
  for (const b of document.querySelectorAll('.back')) b.addEventListener('click', goMenu);

  const toggle = (id, key) => on(id, () => { Store.set(key, !Store.get(key)); refreshSettings(); Sound.syncMusic(); });
  toggle('setSound', 'sound'); toggle('setMusic', 'music'); toggle('setHaptics', 'haptics');
  on('setReset', () => ask('Сбросить все рекорды?', () => { Store.resetRecords(); toast('Рекорды сброшены'); }));

  on('ovRetry', () => { $('over').classList.add('hidden'); startGame(game.source); });
  on('ovEdit', () => { $('over').classList.add('hidden'); openEditor(); });
  on('ovShare', () => {
    const r = game.result, name = game.source === 'custom' ? 'своём тоннеле' : 'тоннеле «' + world().name + '»';
    openShare(APP_LINK || location.href.split('?')[0], (r.won ? 'Дошёл до финиша в ' : 'Прошёл ' + r.progress + '% в ') + name + '. Сможешь лучше?');
  });

  on('edBrush', () => { editor.brush = (editor.brush + 1) % BRUSHES.length; refreshEditor(); });
  on('edSlot', () => { Store.set('slot', (Store.get('slot') + 1) % SLOT_COUNT); editor.level = Store.level(Store.get('slot')) || { obstacles: [] }; refreshEditor(); });
  on('edClear', () => ask('Очистить слот ' + (Store.get('slot') + 1) + '?', () => { editor.level = { obstacles: [] }; Store.setLevel(Store.get('slot'), editor.level); refreshEditor(); }));
  on('edImport', () => { $('importText').value = ''; $('modal').classList.remove('hidden'); });
  on('edShare', shareLevel);
  on('edPlay', () => { if (!editor.level.obstacles.length) { toast('Сначала поставь препятствия'); return; } Store.setLevel(Store.get('slot'), editor.level); startGame('custom'); });
  on('impCancel', () => $('modal').classList.add('hidden'));
  on('impPaste', async () => { try { $('importText').value = await navigator.clipboard.readText(); } catch { toast('Вставь код вручную в поле'); } });
  on('impOk', () => { if (importLevel($('importText').value)) $('modal').classList.add('hidden'); });

  if (tg && tg.BackButton) tg.BackButton.onClick(() => { if (!$('modal').classList.contains('hidden')) $('modal').classList.add('hidden'); else goMenu(); });
}

// ───────────────────────── Ввод ─────────────────────────

function worldX(e) { return (e.clientX - cv.getBoundingClientRect().left) / scale; }
function worldY(e, camY) { return camY + H / 2 - (e.clientY - cv.getBoundingClientRect().top) / scale; }

cv.addEventListener('pointerdown', e => {
  Sound.unlock(); Sound.syncMusic();
  cv.setPointerCapture(e.pointerId);
  if (mode === 'play') {
    if (game.state === 'ready') { game.state = 'playing'; $('msg').textContent = ''; Sound.play('start'); }
    game.targetX = worldX(e);
  } else if (mode === 'editor') {
    editor.drag = { id: e.pointerId, lastY: e.clientY, moved: 0 };
  }
});
cv.addEventListener('pointermove', e => {
  if (mode === 'play' && game.state === 'playing' && e.buttons !== 0) game.targetX = worldX(e);
  if (mode === 'editor' && editor.drag && editor.drag.id === e.pointerId) {
    const dy = (editor.drag.lastY - e.clientY) / scale;
    editor.drag.moved += Math.abs(dy); editor.drag.lastY = e.clientY;
    editor.camY = clamp(editor.camY + dy, H / 2 - 60, LEVEL_LENGTH + 200);
  }
});
cv.addEventListener('pointerup', e => {
  if (mode === 'editor' && editor.drag && editor.drag.id === e.pointerId) {
    if (editor.drag.moved < 8) editorTap(worldX(e), worldY(e, editor.camY));
    editor.drag = null;
  }
});
cv.addEventListener('pointercancel', () => { editor.drag = null; });

// ───────────────────────── Главный цикл ─────────────────────────

let last = 0;
function frame(ts) {
  const now = ts / 1000, dt = Math.min(now - last, 0.05);
  last = now;
  if (mode === 'play') { updateGame(dt); drawGame(now); }
  else if (mode === 'editor') drawEditor(now);
  else {
    bgCam = (bgCam + dt * 120) % 3000;
    drawTunnel(bgCam + H / 2, world());
  }
  requestAnimationFrame(frame);
}

// ───────────────────────── Запуск ─────────────────────────

if (tg) {
  tg.ready(); tg.expand();
  if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();   // иначе свайп вниз закрывает приложение посреди игры
  if (tg.setHeaderColor) tg.setHeaderColor('#12121a');
  if (tg.setBackgroundColor) tg.setBackgroundColor('#12121a');
  tg.onEvent('viewportChanged', layout);
}
window.addEventListener('resize', layout);
document.addEventListener('visibilitychange', Sound.syncMusic);
document.addEventListener('contextmenu', e => e.preventDefault());
layout();
bind();
refreshMenu();
Store.pullCloud(refreshMenu);

// Уровень по ссылке (startapp=t1_...)
const startParam = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
const shared = fromStartParam(startParam);
if (shared && shared.obstacles.length) setTimeout(() => importLevel(shareCode(shared), true), 300);

requestAnimationFrame(frame);

// Для автотестов
window.__tunnel = { game, editor, Store, startGame, openEditor };
