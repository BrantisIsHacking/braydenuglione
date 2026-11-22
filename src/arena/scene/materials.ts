import { Color, MeshStandardMaterial } from 'three';

// SEAM: Phase 3 swaps this single object (toon materials). Hex values mirror tokens.css.
export const materials = {
  floor: new MeshStandardMaterial({ color: '#0a0a0a', roughness: 1 }), // --ink
  court: new MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.9 }), // --line
  line: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 }), // --paper
  prop: new MeshStandardMaterial({ color: '#9a9a9a', roughness: 0.9 }), // --muted
  dark: new MeshStandardMaterial({ color: '#0a0a0a', roughness: 1 }),
  accent: new MeshStandardMaterial({
    color: '#cc0033', // --scarlet
    emissive: new Color('#cc0033'),
    emissiveIntensity: 0.6,
    roughness: 0.6,
  }),
  accentHot: new MeshStandardMaterial({
    color: '#cc0033',
    emissive: new Color('#cc0033'),
    emissiveIntensity: 1.8,
    roughness: 0.6,
  }),
};
