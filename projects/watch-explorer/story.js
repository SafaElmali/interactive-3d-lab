import { create } from './scene.js';
import { box, metal } from '../../shared/geometry.js';
import {
  T,
  rig,
  pose,
  sample,
  smooth,
  colorAt,
} from '../../shared/choreography.js';
export const story = {
  theme: 'time',
  colors: ['#182536', '#243449', '#0d171f', '#c5cbd0'],
  inks: ['#e9e5d9', '#e9e5d9', '#e9e5d9', '#23303b'],
  chapters: [
    {
      title: 'MAKE TIME.',
      label: 'Second Nature',
      text: 'A moment worth looking closer at.',
    },
    {
      title: '<span>BEYOND</span><span>THE DIAL.</span>',
      label: 'A world within',
      text: 'The crystal lifts. The dial rises. The little details come into view.',
    },
    {
      title: '<span>EVERY</span><span>SECOND.</span>',
      label: 'Everything in motion',
      text: 'A quiet choreography, hiding in plain sight.',
      layout: 'right',
    },
    {
      title: '<span>SECOND</span><span>NATURE.</span>',
      label: 'Whole again',
      text: 'All that movement. One still moment.',
    },
  ],
};
export async function createStory() {
  const model = await create(),
    root = rig(model, 5.3);
  const { face, crystal, movement, hours, minutes, seconds, strap, dial } =
    model.parts;
  // Give the illustrative exposed movement small, visible cog teeth.
  const gears = movement.children.slice().map((ring, i) => {
    const gear = new T.Group();
    gear.position.copy(ring.position);
    ring.position.set(0, 0, 0);
    movement.remove(ring);
    gear.add(ring);
    movement.add(gear);
    const material = metal(i % 2 ? '#d4c59e' : '#b79a57');
    for (let j = 0; j < 16; j++) {
      const a = (j / 16) * Math.PI * 2;
      const tooth = box(
        0.045,
        0.035,
        0.06,
        material,
        [
          Math.sin(a) * (0.165 + i * 0.008),
          0,
          Math.cos(a) * (0.165 + i * 0.008),
        ],
        0.004,
      );
      tooth.rotation.y = a;
      gear.add(tooth);
    }
    return gear;
  });
  return {
    root,
    update(p, t, ctx) {
      const exploded = smooth(0.14, 0.35, p) * (1 - smooth(0.72, 0.96, p));
      pose(
        root,
        sample(
          [
            { x: 0.7, y: -0.2, rx: 1.1, ry: -0.15, rz: -0.42, s: 1.12 },
            { x: 2.0, y: -0.4, rx: 0.55, ry: 0.3, rz: -0.25, s: 0.88 },
            { x: -2.0, y: -0.3, rx: 0.65, ry: -1.1, rz: 0.25, s: 0.9 },
            { x: 0.8, y: -0.3, rx: 1.35, ry: Math.PI * 2, rz: 0.4, s: 1.08 },
          ],
          p,
        ),
        ctx,
      );
      face.position.y = exploded * 1.0;
      crystal.position.y = exploded * 2.0;
      crystal.rotation.z = exploded * 0.09;
      movement.position.y = exploded * 0.17;
      gears.forEach((gear, i) => {
        gear.rotation.y = (p * 25 + t * 0.1) * (i % 2 ? -1 : 1);
      });
      hours.rotation.y = -1.1 - p * 2;
      minutes.rotation.y = 0.9 - p * 16;
      seconds.rotation.y = -p * 70 - t * 0.1;
      colorAt(['#273b50', '#574336', '#273b50', '#344c5b'], p, strap.color);
      colorAt(['#e8e2cf', '#9bafb7', '#e8e2cf', '#e8e2cf'], p, dial.color);
    },
  };
}
