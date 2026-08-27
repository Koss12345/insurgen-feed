#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { buildCharacterSvgGroup } = require('./character');
const { buildFrameSvg, CANVAS } = require('./spin');
const { buildPattern } = require('./background');

async function main() {
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  // "Legend #7" archetype — same idea as before (red/black kit, no real
  // name/likeness), now in the chibi-vector style from the reference screenshot.
  const traits = {
    skin: '#f0b389',
    jersey: '#c8102e',
    shorts: '#161616',
    boots: '#f2f2f2',
    hair: 'spiky',
    hairColor: '#151515',
    eyes: 'determined',
    prop: 'ball',
    number: '7',
    armPose: 'celebrate',
  };

  const characterGroup = buildCharacterSvgGroup(traits);
  const backgroundColor = '#1c8a5e';
  const pattern = buildPattern('#ffffff');

  const FRAMES = 36;
  const gif = GIFEncoder();
  let firstFramePng = null;

  for (let i = 0; i < FRAMES; i++) {
    const angle = (360 / FRAMES) * i;
    const svg = buildFrameSvg(characterGroup, angle, backgroundColor, pattern);

    const { data, info } = await sharp(Buffer.from(svg))
      .png()
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, info.width, info.height, { palette, delay: 55 });

    if (i === 0) {
      firstFramePng = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
    }
  }

  gif.finish();
  fs.writeFileSync(path.join(outDir, 'chibi-legend-7.gif'), Buffer.from(gif.bytes()));
  fs.writeFileSync(path.join(outDir, 'chibi-legend-7-frame0.png'), firstFramePng);

  console.log('Wrote', path.join(outDir, 'chibi-legend-7.gif'));
  console.log('Wrote', path.join(outDir, 'chibi-legend-7-frame0.png'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
