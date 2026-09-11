import { create } from './scene.js';
import {
  T,
  rig,
  pose,
  sample,
  smooth,
  mix,
  colorAt,
} from '../../shared/choreography.js';
export const story = {
  theme: 'vinyl',
  colors: ['#ce572f', '#edc67f', '#202e35', '#ce572f'],
  inks: ['#f6dfb5', '#3d2b23', '#f5d998', '#f6dfb5'],
  chapters: [
    {
      title: 'SIDE A.',
      label: 'In the groove',
      text: 'Take the long way around.',
    },
    {
      title: '<span>DROP</span><span>IN.</span>',
      label: 'Needle meets vinyl',
      text: 'One small movement. A whole other world.',
    },
    {
      title: '<span>OFF THE</span><span>RECORD.</span>',
      label: 'A change of tempo',
      text: 'Let the familiar take an unexpected turn.',
      layout: 'right',
    },
    {
      title: 'ON REPEAT.',
      label: 'One more time',
      text: 'Some things are worth coming back to.',
    },
  ],
};
export async function createStory() {
  const model = await create({ preview: true });
  const root = new T.Group(),
    player = rig(model, 5.5);
  root.add(player);
  const { disc, arm, wood, power } = model.parts;
  const records = [-1, 1].map((side) => {
    const group = disc.clone(true);
    group.position.set(side * 8, 0, -1);
    root.add(group);
    return group;
  });
  return {
    root,
    dispose: model.dispose,
    update(p, t, ctx) {
      const lift = smooth(0.35, 0.63, p) * (1 - smooth(0.75, 0.98, p));
      pose(
        player,
        sample(
          [
            { x: 0.6, y: -0.7, rx: 0.93, ry: -0.12, rz: -0.12, s: 1 },
            { x: 2.2, y: -0.3, rx: 1.35, ry: 0.25, rz: 0.12, s: 0.93 },
            { x: -2, y: -1, rx: 0.7, ry: -0.4, rz: -0.12, s: 0.74 },
            { x: 0.6, y: -0.6, rx: 1.05, ry: 0, rz: -0.07, s: 0.85 },
          ],
          p,
        ),
        ctx,
      );
      disc.position.set(-0.42, 0.48 + lift * 2.6, lift * 0.4);
      disc.rotation.set(lift * 0.6, -p * Math.PI * 12 - t * 0.22, lift * -0.2);
      arm.rotation.y = -0.55 * smooth(0.08, 0.31, p) * (1 - lift);
      arm.rotation.x = lift * -0.12;
      power.emissive.set('#e1dd84');
      colorAt(['#ffffff', '#eedec5', '#b2aaa0', '#ffffff'], p, wood.color);
      const spread = smooth(0.48, 0.7, p);
      records.forEach((record, i) => {
        const side = i === 0 ? -1 : 1;
        record.visible = spread > 0.001;
        pose(record, {
          x: side * mix(9, 3.8, spread),
          y: 0.2 + side * 0.7,
          z: -1.3,
          rx: 1.25 + side * 0.2,
          ry: p * 12 + side * 0.5,
          rz: side * 0.2,
          s: 0.94,
        });
      });
    },
  };
}
