import { create } from './scene.js';
import {
  T,
  rig,
  pose,
  sample,
  smooth,
  mix,
  particles,
} from '../../shared/choreography.js';
export const story = {
  theme: 'essence',
  colors: ['#f2e5cd', '#e3b467', '#492335', '#d2a8b0'],
  inks: ['#51372c', '#42291f', '#f9e5cd', '#4e2634'],
  chapters: [
    {
      title: 'A little<br>atmosphere.',
      label: 'Essence',
      text: 'Some things arrive before you do.',
    },
    {
      title: '<span>Top</span><span>notes.</span>',
      label: 'The first impression',
      text: 'Lift the lid. Let the moment open.',
    },
    {
      title: '<span>Stay</span><span>awhile.</span>',
      label: 'In the air',
      text: 'A trace of amber. A hint of something familiar.',
    },
    {
      title: 'Leave a trace.',
      label: 'The collection',
      text: 'Amber, rose, and moss. Three ways to be remembered.',
    },
  ],
};
export async function createStory() {
  const root = new T.Group();
  const models = await Promise.all([create(), create(), create()]);
  const bottles = models.map((model, i) => {
    model.controls[0].change(i);
    const group = rig(model, 4.2);
    root.add(group);
    return group;
  });
  const cloud = particles(160, '#fff0d9', 0.038);
  root.add(cloud.object);
  return {
    root,
    update(p, t, ctx) {
      const open = smooth(0.12, 0.32, p) * (1 - smooth(0.72, 0.94, p));
      const reveal = smooth(0.72, 0.97, p);
      const main = sample(
        [
          { x: 0.6, y: -0.4, rx: 0.08, ry: -0.2, rz: -0.14, s: 1 },
          { x: 2.2, y: -0.6, rx: -0.08, ry: 0.6, rz: 0.16, s: 0.88 },
          { x: 2.0, y: -0.3, rx: 0.12, ry: 3.5, rz: -0.16, s: 0.95 },
          {
            x: 0,
            y: -0.4,
            rx: 0.08,
            ry: Math.PI * 2 - 0.2,
            rz: -0.04,
            s: 0.84,
          },
        ],
        p,
      );
      main.y += Math.sin(t * 0.8) * 0.045;
      pose(bottles[0], main, ctx);
      models[0].parts.cap.position.set(open * 0.2, open * 1.25, 0);
      models[0].parts.cap.rotation.set(open * 0.2, open * 0.6, open * -0.25);
      for (let i = 1; i < 3; i++) {
        const side = i === 1 ? -1 : 1;
        pose(bottles[i], {
          x: side * mix(7, 2.55, reveal),
          y: -0.25 + side * 0.18,
          z: -0.7,
          rx: 0.08,
          ry: side * 0.42,
          rz: side * -0.15,
          s: 0.77,
        });
        bottles[i].visible = reveal > 0.001;
      }
      const bloom = smooth(0.29, 0.53, p) * (1 - smooth(0.72, 0.94, p));
      cloud.object.material.opacity = bloom * 0.6;
      for (let i = 0; i < 160; i++) {
        const a = i * 2.4 + p * 5 + t * 0.06;
        const radius = 0.5 + (i / 160) * 3 * bloom;
        cloud.positions[i * 3] = (ctx.mobile ? 0.5 : 2) + Math.cos(a) * radius;
        cloud.positions[i * 3 + 1] = 0.9 + Math.sin(a * 0.71) * radius * 0.65;
        cloud.positions[i * 3 + 2] = Math.sin(a) * radius;
      }
      cloud.geometry.attributes.position.needsUpdate = true;
    },
  };
}
