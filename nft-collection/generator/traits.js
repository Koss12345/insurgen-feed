'use strict';

// Trait layer definitions for the generative collection.
// Each option has a relative `weight` — higher weight = more common (less rare).
// Colors are plain hex so the whole pipeline runs with zero external art assets.

const TRAITS = {
  Background: [
    { value: 'Slate', weight: 20, colors: ['#1f2933', '#111827'] },
    { value: 'Ocean', weight: 20, colors: ['#0f4c75', '#3282b8'] },
    { value: 'Sunset', weight: 18, colors: ['#f46b45', '#eea849'] },
    { value: 'Forest', weight: 18, colors: ['#134e13', '#3a7d44'] },
    { value: 'Violet', weight: 14, colors: ['#3a0ca3', '#7209b7'] },
    { value: 'Gold', weight: 10, colors: ['#8a6d00', '#e6b800'] },
  ],

  Shape: [
    { value: 'Circle', weight: 26 },
    { value: 'Square', weight: 22 },
    { value: 'Triangle', weight: 20 },
    { value: 'Hexagon', weight: 18 },
    { value: 'Star', weight: 14 },
  ],

  Pattern: [
    { value: 'Solid', weight: 34, fill: 'solid' },
    { value: 'Stripes', weight: 26, fill: 'stripes' },
    { value: 'Dots', weight: 24, fill: 'dots' },
    { value: 'Gradient', weight: 16, fill: 'gradient' },
  ],

  Eyes: [
    { value: 'Round', weight: 28 },
    { value: 'Sleepy', weight: 22 },
    { value: 'Wink', weight: 18 },
    { value: 'Star', weight: 16 },
    { value: 'Laser', weight: 10, glow: true },
    { value: 'Diamond', weight: 6, glow: true },
  ],

  Mouth: [
    { value: 'Smile', weight: 34 },
    { value: 'Flat', weight: 26 },
    { value: 'Open', weight: 22 },
    { value: 'Fangs', weight: 18 },
  ],

  Accessory: [
    { value: 'None', weight: 40 },
    { value: 'Cap', weight: 16 },
    { value: 'Glasses', weight: 14 },
    { value: 'Halo', weight: 12 },
    { value: 'Crown', weight: 8 },
    { value: 'Headphones', weight: 6 },
    { value: 'Golden Crown', weight: 4 },
  ],
};

const CATEGORY_ORDER = ['Background', 'Shape', 'Pattern', 'Eyes', 'Mouth', 'Accessory'];

// Cosmetic body-fill palettes (not exposed as a trait attribute, just visual variety).
const BODY_PALETTES = [
  ['#ff595e', '#ffca3a'],
  ['#8ac926', '#1982c4'],
  ['#6a4c93', '#ff924c'],
  ['#00b4d8', '#90e0ef'],
  ['#f15bb5', '#fee440'],
  ['#e63946', '#f1faee'],
  ['#2ec4b6', '#cbf3f0'],
  ['#ffb703', '#fb8500'],
];

module.exports = { TRAITS, CATEGORY_ORDER, BODY_PALETTES };
