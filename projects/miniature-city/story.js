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
  theme: 'city',
  colors: ['#9ec8da', '#eec08a', '#16213f', '#263459'],
  inks: ['#183744', '#553a31', '#fae6b8', '#fae6b8'],
  chapters: [
    {
      title: 'SMALL HOURS.',
      label: 'A world in miniature',
      text: 'Four corners. A thousand little stories.',
    },
    {
      title: '<span>COME</span><span>AROUND.</span>',
      label: 'Golden hour',
      text: 'The café is open. The long way home looks good.',
    },
    {
      title: '<span>LIGHTS</span><span>ON.</span>',
      label: 'After sunset',
      text: 'As the sky falls quiet, the windows wake up.',
      layout: 'right',
    },
    {
      title: 'STAY A LITTLE.',
      label: 'A different perspective',
      text: 'The city keeps its own time.',
    },
  ],
};
export async function createStory({ scene, lights } = {}) {
  const model = await create({ preview: true });
  const root = new T.Group(),
    city = rig(model, 5.7);
  root.add(city);
  const { buildings, cars, windowMaterial, lampMaterial } = model.parts;
  const stars = particles(150, '#e7e5fa', 0.025);
  for (let i = 0; i < 150; i++) {
    stars.positions[i * 3] = Math.sin(i * 72.13) * 10;
    stars.positions[i * 3 + 1] = Math.cos(i * 12.78) * 7;
    stars.positions[i * 3 + 2] = -8 - (i % 9);
  }
  root.add(stars.object);
  const moon = new T.Mesh(
    new T.SphereGeometry(0.44, 32, 20),
    new T.MeshBasicMaterial({ color: '#ffdb91' }),
  );
  root.add(moon);
  const hemisphere = scene?.children.find((node) => node.isHemisphereLight);
  return {
    root,
    update(p, t, ctx) {
      const night = smooth(0.37, 0.72, p);
      pose(
        city,
        sample(
          [
            { x: 0.7, y: -0.8, rx: 0.62, ry: -0.65, rz: 0, s: 0.94 },
            { x: 2.2, y: -0.7, rx: 0.4, ry: 0.2, rz: -0.06, s: 1.03 },
            { x: -2, y: -0.55, rx: 0.55, ry: 2.4, rz: 0.04, s: 0.98 },
            {
              x: 0.6,
              y: -0.7,
              rx: 1.08,
              ry: Math.PI * 2 - 0.65,
              rz: 0,
              s: 0.92,
            },
          ],
          p,
        ),
        ctx,
      );
      buildings.forEach((building, i) => {
        building.position.y =
          0.14 +
          (1 - smooth(0.01 + i * 0.025, 0.22 + i * 0.025, p)) *
            (0.75 + i * 0.2);
      });
      windowMaterial.emissiveIntensity = night * 3.5;
      windowMaterial.color.set('#596c71').lerp(new T.Color('#ffcf84'), night);
      lampMaterial.emissiveIntensity = 0.3 + night * 6;
      cars[0].position.z = ((p * 16 + t * 0.04 + 1) % 5) - 2.5;
      cars[1].position.x = 2.5 - ((p * 14 + t * 0.04 + 3) % 5);
      moon.position.set(
        ctx.mobile ? 2.1 : -3.8,
        2.1 + Math.sin(p * Math.PI) * 0.5,
        -3,
      );
      moon.material.color.set('#ffdb91').lerp(new T.Color('#e8eeff'), night);
      stars.object.material.opacity = night * 0.65;
      if (lights) {
        lights.key.intensity = mix(3.2, 0.7, night);
        lights.key.color.set('#fff1d4').lerp(new T.Color('#adcaff'), night);
        lights.rim.intensity = mix(1.4, 1.1, night);
        hemisphere.intensity = mix(2.1, 0.4, night);
        scene.environmentIntensity = mix(1, 0.25, night);
      }
    },
  };
}
