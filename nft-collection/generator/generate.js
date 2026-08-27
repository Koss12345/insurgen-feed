#!/usr/bin/env node
'use strict';

/**
 * Generates a full NFT collection: unique trait combinations, PNG images
 * (rendered from procedural SVG, no external art assets required), and
 * TEP-64 compliant metadata JSON for each token plus the collection.
 *
 * Usage:
 *   node generate.js [--count 100] [--seed 42] [--out ./output] [--base-uri https://.../]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { TRAITS, CATEGORY_ORDER, BODY_PALETTES } = require('./traits');
const { buildSvg } = require('./svg');

function parseArgs(argv) {
  const args = { count: 100, seed: 1337, out: path.join(__dirname, 'output'), baseUri: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--count') args.count = parseInt(argv[++i], 10);
    else if (a === '--seed') args.seed = parseInt(argv[++i], 10);
    else if (a === '--out') args.out = path.resolve(argv[++i]);
    else if (a === '--base-uri') args.baseUri = argv[++i];
  }
  return args;
}

// Deterministic PRNG (mulberry32) so a given --seed always reproduces the same collection.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick(rng, options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = rng() * total;
  for (const opt of options) {
    r -= opt.weight;
    if (r <= 0) return opt;
  }
  return options[options.length - 1];
}

function pickCombination(rng) {
  const picked = {};
  for (const category of CATEGORY_ORDER) {
    picked[category] = weightedPick(rng, TRAITS[category]);
  }
  return picked;
}

function comboKey(combo) {
  return CATEGORY_ORDER.map((c) => combo[c].value).join('|');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const imagesDir = path.join(args.out, 'images');
  const metadataDir = path.join(args.out, 'metadata');
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(metadataDir, { recursive: true });

  const rng = mulberry32(args.seed);
  const seen = new Set();
  const tokens = [];

  // Reject duplicate trait combinations so all N NFTs are visually unique.
  let guard = 0;
  while (tokens.length < args.count) {
    guard++;
    if (guard > args.count * 500) {
      throw new Error('Trait space exhausted before reaching requested count — widen the trait lists.');
    }
    const combo = pickCombination(rng);
    const key = comboKey(combo);
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(combo);
  }

  const baseUri = args.baseUri ? args.baseUri.replace(/\/+$/, '') + '/' : '';
  const rarityCounts = {};
  for (const cat of CATEGORY_ORDER) rarityCounts[cat] = {};

  for (let i = 0; i < tokens.length; i++) {
    const combo = tokens[i];
    const id = i; // 0-indexed token id, matches TON NFT item index convention
    const paletteIndex = Math.floor(rng() * BODY_PALETTES.length);
    const shapeWithColors = { ...combo.Shape, bodyColors: BODY_PALETTES[paletteIndex] };

    const svg = buildSvg({
      background: combo.Background,
      shape: shapeWithColors,
      pattern: combo.Pattern,
      eyes: combo.Eyes,
      mouth: combo.Mouth,
      accessory: combo.Accessory,
    });

    const pngPath = path.join(imagesDir, `${id}.png`);
    await sharp(Buffer.from(svg)).png().toFile(pngPath);

    const attributes = CATEGORY_ORDER.map((cat) => ({
      trait_type: cat,
      value: combo[cat].value,
    }));

    const metadata = {
      name: `Insurgen Bots #${id}`,
      description: 'Insurgen Bots — a procedurally generated collection of 100 unique on-chain characters on TON.',
      image: baseUri ? `${baseUri}images/${id}.png` : `./images/${id}.png`,
      attributes,
    };

    fs.writeFileSync(path.join(metadataDir, `${id}.json`), JSON.stringify(metadata, null, 2));

    for (const cat of CATEGORY_ORDER) {
      const v = combo[cat].value;
      rarityCounts[cat][v] = (rarityCounts[cat][v] || 0) + 1;
    }
  }

  const collectionMetadata = {
    name: 'Insurgen Bots',
    description: 'A procedurally generated collection of 100 unique characters, minted on TON.',
    image: baseUri ? `${baseUri}cover.png` : './cover.png',
    cover_image: baseUri ? `${baseUri}cover.png` : './cover.png',
    social_links: [],
  };
  fs.writeFileSync(path.join(args.out, 'collection.json'), JSON.stringify(collectionMetadata, null, 2));

  // Cover image reuses token #0's artwork so the collection page has a preview immediately.
  fs.copyFileSync(path.join(imagesDir, '0.png'), path.join(args.out, 'cover.png'));

  const rarityReport = {};
  for (const cat of CATEGORY_ORDER) {
    rarityReport[cat] = Object.fromEntries(
      Object.entries(rarityCounts[cat])
        .sort((a, b) => a[1] - b[1])
        .map(([value, count]) => [value, `${count}/${tokens.length} (${((count / tokens.length) * 100).toFixed(1)}%)`])
    );
  }
  fs.writeFileSync(path.join(args.out, 'rarity_report.json'), JSON.stringify(rarityReport, null, 2));

  console.log(`Generated ${tokens.length} NFTs -> ${args.out}`);
  console.log(`  images:   ${imagesDir}`);
  console.log(`  metadata: ${metadataDir}`);
  console.log(`  collection.json, cover.png, rarity_report.json written to ${args.out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
