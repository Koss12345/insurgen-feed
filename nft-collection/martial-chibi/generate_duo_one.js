#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { buildDuoIdleFrame } = require('./idle_duo');
const { buildPattern } = require('./background');

async function main() {
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  const attacker = {
    skin: '#f0b389',
    gi: '#f2f2f2',
    belt: '#1a1a1a',
    hair: 'spiky',
    hairColor: '#151515',
    eyes: 'determined',
    kick: true,
  };
  const defender = {
    skin: '#d99a67',
    gi: '#e8e8e8',
    belt: '#f2f2f2',
    hair: 'buzz',
    hairColor: '#3b2418',
  };

  const backgroundColor = '#8c1f2e';
  const pattern = buildPattern('#ffffff');

  const FRAMES = 24;
  const gif = GIFEncoder();

  for (let i = 0; i < FRAMES; i++) {
    const svg = buildDuoIdleFrame(attacker, defender, i, FRAMES, backgroundColor, pattern);
    const { data, info } = await sharp(Buffer.from(svg))
      .resize(420, 420)
      .png()
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const palette = quantize(data, 96);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, info.width, info.height, { palette, delay: 100 });
  }

  gif.finish();
  fs.writeFileSync(path.join(outDir, 'duo-kick.gif'), Buffer.from(gif.bytes()));
  console.log('Wrote', path.join(outDir, 'duo-kick.gif'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
