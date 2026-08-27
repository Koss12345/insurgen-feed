#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { buildIdleFrame } = require('./idle');
const { buildPattern } = require('./background');

async function main() {
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  const traits = {
    skin: '#f0b389',
    gi: '#f2f2f2',
    belt: '#1a1a1a', // black belt
    hair: 'spiky',
    hairColor: '#151515',
    eyes: 'determined',
    kick: true,
  };

  const backgroundColor = '#8c1f2e';
  const pattern = buildPattern('#ffffff');

  const FRAMES = 24;
  const gif = GIFEncoder();
  let firstFramePng = null;

  for (let i = 0; i < FRAMES; i++) {
    const svg = buildIdleFrame(traits, i, FRAMES, backgroundColor, pattern);
    const { data, info } = await sharp(Buffer.from(svg))
      .resize(420, 420)
      .png()
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const palette = quantize(data, 96);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, info.width, info.height, { palette, delay: 100 });

    if (i === 0) {
      firstFramePng = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
    }
  }

  gif.finish();
  fs.writeFileSync(path.join(outDir, 'martial-kick.gif'), Buffer.from(gif.bytes()));
  fs.writeFileSync(path.join(outDir, 'martial-kick-frame0.png'), firstFramePng);
  console.log('Wrote', path.join(outDir, 'martial-kick.gif'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
