#!/usr/bin/env node
'use strict';

/**
 * Generates the full 100-piece collection: one animated (blink + breathing
 * bob + prop sparkle) GIF per token plus TEP-64 metadata, collection.json,
 * and a rarity report.
 *
 * Usage: node generate_all.js [--count 100] [--seed 1337] [--out ./output/collection] [--base-uri https://.../]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const { TRAITS, CATEGORY_ORDER } = require('./traits');
const { buildIdleFrame } = require('./idle');
const { buildPattern } = require('./background');

const GIF_SIZE = 420;
const GIF_FRAMES = 24;
const GIF_COLORS = 96;
const GIF_DELAY_MS = 100;

function parseArgs(argv) {
  const args = { count: 100, seed: 1337, out: path.join(__dirname, 'output', 'collection'), baseUri: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--count') args.count = parseInt(argv[++i], 10);
    else if (a === '--seed') args.seed = parseInt(argv[++i], 10);
    else if (a === '--out') args.out = path.resolve(argv[++i]);
    else if (a === '--base-uri') args.baseUri = argv[++i];
  }
  return args;
}

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

async function renderGif(traits, backgroundColor) {
  const pattern = buildPattern('#ffffff');
  const gif = GIFEncoder();
  let firstFramePng = null;

  for (let i = 0; i < GIF_FRAMES; i++) {
    const svg = buildIdleFrame(traits, i, GIF_FRAMES, backgroundColor, pattern);
    const { data, info } = await sharp(Buffer.from(svg))
      .resize(GIF_SIZE, GIF_SIZE)
      .png()
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const palette = quantize(data, GIF_COLORS);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, info.width, info.height, { palette, delay: GIF_DELAY_MS });

    if (i === 0) {
      firstFramePng = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
    }
  }

  gif.finish();
  return { gifBuffer: Buffer.from(gif.bytes()), firstFramePng };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const imagesDir = path.join(args.out, 'images');
  const metadataDir = path.join(args.out, 'metadata');
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(metadataDir, { recursive: true });

  const rng = mulberry32(args.seed);
  const baseUri = args.baseUri ? args.baseUri.replace(/\/+$/, '') + '/' : '';
  const rarityCounts = {};
  for (const cat of CATEGORY_ORDER) rarityCounts[cat] = {};

  const startTime = Date.now();

  for (let id = 0; id < args.count; id++) {
    const combo = pickCombination(rng);
    const number = String(id + 1);

    const characterTraits = {
      skin: combo.Skin.value,
      hair: combo.HairStyle.value,
      hairColor: combo.HairColor.value,
      jersey: combo.Jersey.value,
      shorts: combo.Shorts.value,
      boots: combo.Boots.value,
      eyes: combo.Expression.value,
      prop: combo.Prop.value,
      armPose: combo.ArmPose.value,
      number,
    };

    const { gifBuffer, firstFramePng } = await renderGif(characterTraits, combo.Background.value);

    fs.writeFileSync(path.join(imagesDir, `${id}.gif`), gifBuffer);
    if (id === 0) {
      fs.writeFileSync(path.join(args.out, 'cover.png'), firstFramePng);
    }

    const attributes = CATEGORY_ORDER.map((cat) => ({
      trait_type: cat,
      value: combo[cat].name,
    }));
    attributes.push({ trait_type: 'Number', value: number });

    const metadata = {
      name: `Insurgen Ballers #${number}`,
      description: 'Insurgen Ballers — a procedurally generated collection of 100 unique chibi footballers on TON.',
      // --base-uri is expected to point directly at the uploaded *images* folder's
      // own IPFS root (i.e. you uploaded chibi-spin/output/collection/images as its
      // own folder), so no extra "images/" path segment here.
      image: baseUri ? `${baseUri}${id}.gif` : `./images/${id}.gif`,
      attributes,
    };
    fs.writeFileSync(path.join(metadataDir, `${id}.json`), JSON.stringify(metadata, null, 2));

    for (const cat of CATEGORY_ORDER) {
      const name = combo[cat].name;
      rarityCounts[cat][name] = (rarityCounts[cat][name] || 0) + 1;
    }

    if ((id + 1) % 10 === 0 || id === args.count - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${id + 1}/${args.count} done (${elapsed}s elapsed)`);
    }
  }

  // Uses token #0's actual (already-uploaded) image rather than a separate
  // cover.png, so the collection-level preview doesn't depend on a second file
  // that would need its own IPFS path bookkeeping.
  const collectionMetadata = {
    name: 'Insurgen Ballers',
    description: 'A procedurally generated collection of 100 unique chibi footballers, minted on TON.',
    image: baseUri ? `${baseUri}0.gif` : './images/0.gif',
    cover_image: baseUri ? `${baseUri}0.gif` : './images/0.gif',
    social_links: [],
  };
  // Written into metadataDir (not args.out) so that uploading the metadata/
  // folder as its own IPFS unit carries collection.json along with it —
  // COLLECTION_CONTENT_URI is <METADATA_CID>/collection.json.
  fs.writeFileSync(path.join(metadataDir, 'collection.json'), JSON.stringify(collectionMetadata, null, 2));

  const rarityReport = {};
  for (const cat of CATEGORY_ORDER) {
    rarityReport[cat] = Object.fromEntries(
      Object.entries(rarityCounts[cat])
        .sort((a, b) => a[1] - b[1])
        .map(([name, count]) => [name, `${count}/${args.count} (${((count / args.count) * 100).toFixed(1)}%)`])
    );
  }
  fs.writeFileSync(path.join(args.out, 'rarity_report.json'), JSON.stringify(rarityReport, null, 2));

  console.log(`\nGenerated ${args.count} tokens -> ${args.out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
