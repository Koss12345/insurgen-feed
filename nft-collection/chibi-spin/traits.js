'use strict';

// Trait definitions for the 100-piece chibi footballer collection.
// Each option carries a relative `weight` (higher = more common) and, where
// relevant, a `name` used verbatim as the metadata attribute value.

const TRAITS = {
  Background: [
    { name: 'Pitch Green', value: '#1c8a5e', weight: 22 },
    { name: 'Amber', value: '#c9821f', weight: 16 },
    { name: 'Cobalt Night', value: '#1c3d6e', weight: 16 },
    { name: 'Plum', value: '#5a2a6e', weight: 14 },
    { name: 'Crimson Dusk', value: '#8c1f2e', weight: 12 },
    { name: 'Slate', value: '#2b3038', weight: 12 },
    { name: 'Gold', value: '#a8791a', weight: 8 },
  ],

  Skin: [
    { name: 'Fair', value: '#f4c9a0', weight: 22 },
    { name: 'Light', value: '#f0b389', weight: 22 },
    { name: 'Tan', value: '#d99a67', weight: 20 },
    { name: 'Brown', value: '#a9673d', weight: 20 },
    { name: 'Deep', value: '#7a4527', weight: 16 },
  ],

  HairStyle: [
    { name: 'Spiky', value: 'spiky', weight: 24 },
    { name: 'Buzz Cut', value: 'buzz', weight: 20 },
    { name: 'Afro', value: 'afro', weight: 16 },
    { name: 'Mohawk', value: 'mohawk', weight: 14 },
    { name: 'Ponytail', value: 'ponytail', weight: 12 },
    { name: 'Bald', value: 'bald', weight: 14 },
  ],

  HairColor: [
    { name: 'Jet Black', value: '#171310', weight: 28 },
    { name: 'Dark Brown', value: '#3b2418', weight: 22 },
    { name: 'Chestnut', value: '#6b3a1f', weight: 16 },
    { name: 'Blonde', value: '#d8a942', weight: 14 },
    { name: 'Fiery Red', value: '#a83e2c', weight: 10 },
    { name: 'Platinum', value: '#d9d4c8', weight: 6 },
    { name: 'Electric Blue', value: '#2e6fd9', weight: 4 },
  ],

  Jersey: [
    { name: 'Crimson', value: '#c8102e', weight: 16 },
    { name: 'Cobalt', value: '#0f4c9c', weight: 16 },
    { name: 'Sunflower', value: '#f0b400', weight: 12 },
    { name: 'Forest', value: '#1f7a3d', weight: 12 },
    { name: 'Violet', value: '#6a2b9c', weight: 10 },
    { name: 'Tangerine', value: '#e0641f', weight: 10 },
    { name: 'Sky', value: '#2fa8d9', weight: 10 },
    { name: 'Charcoal', value: '#2b2b2f', weight: 8 },
    { name: 'Rose', value: '#e0568c', weight: 6 },
  ],

  Shorts: [
    { name: 'Black', value: '#141414', weight: 34 },
    { name: 'White', value: '#f2f2f2', weight: 26 },
    { name: 'Navy', value: '#1b2a4a', weight: 18 },
    { name: 'Crimson', value: '#8c1023', weight: 12 },
    { name: 'Gold', value: '#c9a227', weight: 10 },
  ],

  Boots: [
    { name: 'Blaze Orange', value: '#ff6a00', weight: 16 },
    { name: 'Volt Green', value: '#a6e000', weight: 14 },
    { name: 'Hot Pink', value: '#ff2f92', weight: 12 },
    { name: 'Electric Blue', value: '#1e6bff', weight: 14 },
    { name: 'Sunburst Yellow', value: '#ffd400', weight: 14 },
    { name: 'Classic Black', value: '#1a1a1a', weight: 14 },
    { name: 'Pure White', value: '#f5f5f5', weight: 12 },
    { name: 'Royal Purple', value: '#7a1fd9', weight: 4 },
  ],

  Expression: [
    { name: 'Focused', value: 'determined', weight: 32 },
    { name: 'Cheerful', value: 'happy', weight: 26 },
    { name: 'Confident Wink', value: 'wink', weight: 18 },
    { name: 'Cool Shades', value: 'shades', weight: 14 },
    { name: 'Calm', value: 'default', weight: 10 },
  ],

  Prop: [
    { name: 'Ball', value: 'ball', weight: 46 },
    { name: 'None', value: 'none', weight: 38 },
    { name: 'Trophy', value: 'trophy', weight: 16 },
  ],

  ArmPose: [
    { name: 'Celebrating', value: 'celebrate', weight: 40 },
    { name: 'Relaxed', value: 'relaxed', weight: 60 },
  ],
};

const CATEGORY_ORDER = ['Background', 'Skin', 'HairStyle', 'HairColor', 'Jersey', 'Shorts', 'Boots', 'Expression', 'Prop', 'ArmPose'];

module.exports = { TRAITS, CATEGORY_ORDER };
