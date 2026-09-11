import { create } from './scene.js';
import {
  T,
  rig,
  pose,
  sample,
  smooth,
  mix,
} from '../../shared/choreography.js';
export const story = {
  theme: 'sole',
  colors: ['#ff6334', '#f0e6d4', '#292534', '#beb4f2'],
  inks: ['#381a13', '#332d29', '#f8ddba', '#302144'],
  chapters: [
    {
      title: 'RUN <em>FREE.</em>',
      label: 'Sole Studio',
      text: 'A little lift. A different perspective.',
    },
    {
      title: '<span>AIR</span><span>TIME.</span>',
      label: 'Suspended',
      text: 'Off the ground. Out of the ordinary.',
    },
    {
      title: '<span>EVERY</span><span>ANGLE.</span>',
      label: 'In rotation',
      text: 'From the first stitch to the last step.',
      layout: 'right',
    },
    {
      title: 'GO <em>AGAIN.</em>',
      label: 'Three of a kind',
      text: 'Same silhouette. Three different moods.',
    },
  ],
};
export async function createStory() {
  const root = new T.Group();
  const model = await create();
  const shoes = [0, 1, 2].map((i) => {
    model.controls[0].change(i);
    const group = rig({ root: model.root.clone(true) }, 5.1);
    root.add(group);
    return group;
  });
  return {
    root,
    update(p, t, ctx) {
      const main = sample(
        [
          { x: 0.4, y: -0.25, z: 0, rx: 0.25, ry: -0.6, rz: -0.32, s: 1.18 },
          { x: 2.1, y: 0.15, z: 0.5, rx: 0.6, ry: 2.4, rz: 0.35, s: 1.14 },
          { x: -2.1, y: 0.1, z: 0.4, rx: 2.6, ry: 4.3, rz: -0.5, s: 1.18 },
          {
            x: 0,
            y: -0.3,
            z: 0.8,
            rx: 0.3,
            ry: Math.PI * 2 - 0.5,
            rz: -0.15,
            s: 0.78,
          },
        ],
        p,
      );
      main.y += Math.sin(t * 1.3) * 0.045;
      pose(shoes[0], main, ctx);
      const opening = 1 - smooth(0.02, 0.24, p),
        ending = smooth(0.73, 1, p);
      for (let i = 1; i < 3; i++) {
        const side = i === 1 ? -1 : 1;
        pose(shoes[i], {
          x: side * mix(7, 3.7, Math.max(opening, ending)),
          y: mix(0.55, -0.55, ending),
          z: -1,
          rx: 0.35,
          ry: -0.4 + p * Math.PI * 2 + side * 0.3,
          rz: side * 0.35,
          s: mix(0.72, 0.78, ending),
        });
        shoes[i].visible = opening + ending > 0.005;
      }
    },
  };
}
