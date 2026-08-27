#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { buildFigure } = require('./figure');
const { renderFrameSvg, CANVAS, FEET_Y_PX } = require('./render');

async function main() {
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  // "Legend #7" archetype — red/black kit, evokes the CR7 style without
  // depicting a real likeness or using a real name (see README for why).
  const colors = {
    jersey: '#c8102e',
    shorts: '#1a1a1a',
    socks: '#c8102e',
    skin: '#caa06b',
    boots: '#f5f5f5',
    hair: '#2b2119',
    ball: '#ffffff',
  };
  const jerseyNumber = '7';

  const parts = buildFigure(colors);

  const FRAMES = 36;
  const gif = GIFEncoder();
  let firstFramePng = null;

  for (let i = 0; i < FRAMES; i++) {
    const angle = (360 / FRAMES) * i;
    const { body, numberOverlay } = renderFrameSvg(parts, angle, jerseyNumber);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
      <defs>
        <radialGradient id="bg" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stop-color="#2b3a55"/>
          <stop offset="100%" stop-color="#0c1220"/>
        </radialGradient>
      </defs>
      <rect width="${CANVAS}" height="${CANVAS}" fill="url(#bg)"/>
      <ellipse cx="${CANVAS / 2}" cy="${FEET_Y_PX + 6}" rx="110" ry="18" fill="#00000055"/>
      ${body}
      ${numberOverlay}
    </svg>`;

    const { data, info } = await sharp(Buffer.from(svg))
      .png()
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, info.width, info.height, { palette, delay: 60 });

    if (i === 0) {
      firstFramePng = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
    }
  }

  gif.finish();
  fs.writeFileSync(path.join(outDir, 'legend-7.gif'), Buffer.from(gif.bytes()));
  fs.writeFileSync(path.join(outDir, 'legend-7-frame0.png'), firstFramePng);

  console.log('Wrote', path.join(outDir, 'legend-7.gif'));
  console.log('Wrote', path.join(outDir, 'legend-7-frame0.png'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
