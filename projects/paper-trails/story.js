import { create, foldAtProgress } from './scene.js';
import { pose, sample, smooth, mix } from '../../shared/choreography.js';

export const story = {
  theme: 'paper',
  colors: ['#d6ecf1', '#e8e9dc', '#bfdeeb', '#aecfe5'],
  inks: ['#253f4d', '#303d3c', '#213e52', '#233e55'],
  chapters: [
    {
      title: '<span>PAPER</span><span><em>TRAILS.</em></span>',
      label: 'A square of possibility',
      text: 'No scissors. No glue. Just a little imagination, waiting for its first fold.',
    },
    {
      title: '<span>MAKE</span><span>A LITTLE</span><span>SPACE.</span>',
      label: 'Mountain meets valley',
      text: 'A crease remembers. Four corners rise, and something flat begins to find its form.',
    },
    {
      title: '<span>ALMOST</span><span>ALIVE.</span>',
      label: 'The shape of a thought',
      text: 'A neck. A beak. Two impossible wings. The smallest gestures change everything.',
      layout: 'right',
    },
    {
      title: '<span>LET IT</span><span><em>FLY.</em></span>',
      label: 'Good things take flight',
      text: 'One square becomes a bird. One small idea becomes a sky full of possibilities.',
    },
  ],
};

const destinations = [
  [-3.1, 1.5, -0.8, 0.38, -0.22],
  [2.5, 2.0, -1.5, 0.34, 0.24],
  [-1.4, 3.4, -2.4, 0.3, -0.1],
  [4.2, 3.3, -3.4, 0.28, 0.36],
  [-4.4, 3.3, -3.3, 0.25, -0.4],
  [1.1, 4.7, -5.0, 0.25, 0.15],
  [-0.1, 2.1, -3.4, 0.21, -0.12],
];

export async function createStory() {
  const model = await create();
  const { root } = model;
  const { hero, flock } = model.parts;
  return {
    root,
    update(progress, time, context = {}) {
      const t = context.reduced ? 0 : time;
      pose(root, sample([
        { x: 0.85, y: -0.45, rx: 1.05, ry: -0.16, rz: -0.42, s: 1.64 },
        { x: 2.0, y: -0.6, rx: 0.93, ry: -0.12, rz: -0.28, s: 1.53 },
        { x: -1.95, y: -0.8, rx: 0.42, ry: -0.64, rz: 0.1, s: 1.5 },
        { x: 0.35, y: -1.0, rx: 0.32, ry: -0.35, rz: 0.12, s: 1.1 },
      ], progress), context);
      foldAtProgress(hero, progress, t, context.reduced);
      const flight = smooth(0.72, 1, progress);
      hero.root.position.set(0, flight * 0.24 + (context.reduced ? 0 : Math.sin(t * 1.15) * 0.035 * flight), 0);
      hero.root.rotation.set(0, 0, flight * -0.08);
      hero.root.scale.setScalar(1);
      flock.forEach((bird, i) => {
        const spread = smooth(0.73 + i * 0.012, 0.94 + i * 0.008, progress);
        const [x, y, z, size, roll] = destinations[i];
        bird.root.visible = spread > 0.001;
        bird.root.scale.setScalar(mix(0.0001, size, spread));
        bird.root.position.set(
          x * spread * (context.mobile ? 0.91 : 1),
          y * spread + (context.reduced ? 0 : Math.sin(t * 1.05 + i * 1.4) * 0.1 * spread),
          z * spread,
        );
        bird.root.rotation.set(-0.05 + i * 0.035, -0.22 + i * 0.07, roll * spread);
        bird.fold(1, 1, context.reduced ? 0 : Math.sin(t * 1.75 + i * 0.9) * 0.13);
      });
    },
  };
}
