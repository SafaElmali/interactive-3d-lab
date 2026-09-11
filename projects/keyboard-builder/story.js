import { create } from './scene.js';
import {
  rig,
  pose,
  sample,
  smooth,
  mix,
  colorAt,
} from '../../shared/choreography.js';
export const story = {
  theme: 'keys',
  colors: ['#d2ed64', '#161b19', '#6545ac', '#d2ed64'],
  inks: ['#20271b', '#d7ed91', '#f1e9ff', '#20271b'],
  chapters: [
    {
      title: 'GOOD TYPE.',
      label: 'Key / Form',
      text: 'Small pieces. Endless possibilities.',
    },
    {
      title: '<span>EVERY</span><span>LAYER.</span>',
      label: 'Beneath the surface',
      text: 'A rhythm of switches, circuits, and carefully placed keys.',
    },
    {
      title: 'LET LOOSE.',
      label: 'A moment of disorder',
      text: 'Even the most orderly things need a little freedom.',
      layout: 'hero',
    },
    {
      title: 'ALL IN PLACE.',
      label: 'Back together',
      text: 'Every piece finds its way home.',
    },
  ],
};
export async function createStory() {
  const model = await create({ preview: true });
  const root = rig(model, 5.7);
  const {
    base,
    board,
    caps,
    keyGroups,
    shell,
    keyMaterial,
    accent,
    dark,
    underglow,
  } = model.parts;
  const homes = keyGroups.map((key) => key.position.clone());
  return {
    root,
    update(p, t, ctx) {
      pose(
        root,
        sample(
          [
            { x: 0.5, y: -0.45, rx: 1.1, ry: -0.18, rz: -0.17, s: 1.05 },
            { x: 2.0, y: -0.55, rx: 0.65, ry: 0.4, rz: -0.17, s: 0.8 },
            { x: 0.3, y: -0.6, rx: 0.95, ry: 2.2, rz: 0.25, s: 0.85 },
            { x: 0.5, y: -0.35, rx: 1.15, ry: Math.PI * 2, rz: 0.12, s: 1.05 },
          ],
          p,
        ),
        ctx,
      );
      const apart = smooth(0.12, 0.33, p) * (1 - smooth(0.72, 0.96, p));
      const scatter = smooth(0.38, 0.65, p) * (1 - smooth(0.7, 0.94, p));
      base.position.y = -0.35 * apart;
      board.position.y = 0.7 * apart;
      caps.position.y = 1.3 * apart;
      keyGroups.forEach((key, i) => {
        const home = homes[i];
        const wave = Math.sin(home.x * 1.4 + home.z * 2 - p * 24);
        key.position.set(
          home.x * (1 + scatter * 0.45),
          home.y + apart * (wave * 0.23 + scatter * (i % 4) * 0.16),
          home.z * (1 + scatter * 0.9),
        );
        key.rotation.set(
          scatter * Math.sin(i * 2.1) * 0.9,
          scatter * Math.cos(i * 1.3) * 0.7,
          scatter * wave * 0.5,
        );
        if (p < 0.13)
          key.position.y += Math.max(0, Math.sin(p * 45 - home.x * 1.1)) * 0.12;
      });
      colorAt(['#a7af91', '#424947', '#bda3eb', '#a7af91'], p, shell.color);
      colorAt(
        ['#f0f1dd', '#8e9691', '#e8d7ff', '#f0f1dd'],
        p,
        keyMaterial.color,
      );
      colorAt(['#5a762c', '#cce967', '#ffb5dc', '#5a762c'], p, accent.color);
      dark.color.copy(accent.color).multiplyScalar(0.5);
      underglow.color.copy(accent.color);
      underglow.emissive.copy(accent.color);
      underglow.emissiveIntensity = mix(0.5, 2, apart) + Math.sin(t) * 0.1;
    },
  };
}
