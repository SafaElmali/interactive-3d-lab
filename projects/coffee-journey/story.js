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
  theme: 'ritual',
  colors: ['#e1c69e', '#8c4d30', '#32251f', '#eee1c9'],
  inks: ['#503727', '#fff0d3', '#f8e7c7', '#503727'],
  chapters: [
    {
      title: 'Slow mornings.',
      label: 'Daily Ritual',
      text: 'A small beginning. A whole day ahead.',
    },
    {
      title: '<span>A little</span><span>turn.</span>',
      label: 'From bean to grind',
      text: 'The first ritual of the morning.',
    },
    {
      title: '<span>Let it</span><span>pour.</span>',
      label: 'Into the cup',
      text: 'Good things take their time.',
      layout: 'right',
    },
    {
      title: 'Stay for a cup.',
      label: 'Just a moment',
      text: 'Warm hands. A slower world.',
    },
  ],
};
export async function createStory() {
  const model = await create(),
    root = new T.Group();
  const {
    cup,
    beans,
    grinder,
    crank,
    steam,
    steamMaterial,
    coffee,
    roast,
    coffeeSurface,
    milk,
  } = model.parts;
  // A loose cloud of real bean geometry, gathered by scrolling into the grinder.
  const originalBeans = beans.children.slice();
  for (let i = 0; i < 24; i++) {
    const bean = originalBeans[i % originalBeans.length].clone(true);
    const a = i * 2.4,
      r = 0.7 + (i % 6) * 0.15;
    bean.position.set(
      Math.cos(a) * r,
      Math.sin(i * 1.9) * 0.6,
      Math.sin(a) * r,
    );
    beans.add(bean);
  }
  cup.visible = beans.visible = grinder.visible = true;
  const homes = beans.children.map((bean) => bean.position.clone());
  const beanRig = rig({ root: beans }, 4.8),
    grinderRig = rig({ root: grinder }, 4.3),
    cupRig = rig({ root: cup }, 4.7);
  root.add(beanRig, grinderRig, cupRig);
  const streamMaterial = new T.MeshStandardMaterial({
    color: '#ab7950',
    roughness: 0.2,
  });
  const stream = new T.Mesh(
    new T.CylinderGeometry(0.028, 0.018, 2.4, 12),
    streamMaterial,
  );
  stream.position.set(0, 1.6, 0);
  cup.add(stream);
  return {
    root,
    update(p, t, ctx) {
      pose(
        beanRig,
        sample(
          [
            { x: 0.5, y: -0.1, rx: 0.45, ry: 0, rz: -0.2, s: 1.12 },
            { x: 2.1, y: 1.4, rx: 0.2, ry: 3.2, rz: 0, s: 0.28 },
            { x: -6, y: -3, rx: 1, ry: 6.4, rz: 0.5, s: 0.02 },
            { x: 3.2, y: -1.2, rx: 0.6, ry: 8, rz: -0.3, s: 0.4 },
          ],
          p,
        ),
        ctx,
      );
      pose(
        grinderRig,
        sample(
          [
            { x: 11, y: -2, rx: 0.2, ry: -0.4, rz: 0.1, s: 0.6 },
            { x: 2.0, y: -0.55, rx: 0.22, ry: 0.5, rz: 0.08, s: 0.9 },
            { x: -10, y: -4, rx: 0.3, ry: 2.5, rz: -0.8, s: 0.2 },
            { x: -12, y: -4, rx: 0.3, ry: 3, rz: -0.8, s: 0.02 },
          ],
          p,
        ),
        ctx,
      );
      pose(
        cupRig,
        sample(
          [
            { x: -2, y: -10, rx: 0.4, ry: 0, rz: 0, s: 0.5 },
            { x: -5, y: -7, rx: 0.4, ry: -0.5, rz: -0.3, s: 0.6 },
            { x: -2.0, y: -0.45, rx: 0.6, ry: 0.3, rz: -0.07, s: 1.05 },
            { x: 0.7, y: -0.35, rx: 0.8, ry: Math.PI * 2, rz: 0.08, s: 1.1 },
          ],
          p,
        ),
        ctx,
      );
      const gather = smooth(0.12, 0.4, p) * (1 - smooth(0.75, 1, p));
      beans.children.forEach((bean, i) => {
        const home = homes[i],
          phase = p * 14 + i * 2.4;
        bean.position.set(
          home.x * (1 - gather * 0.6),
          home.y + Math.sin(phase) * (1 - gather) * 0.35,
          home.z * (1 - gather * 0.6),
        );
        bean.rotation.x = p * 8 + i * 0.3;
        bean.rotation.z = Math.sin(phase) * 0.5;
      });
      crank.rotation.y = -p * 60;
      roast.color
        .set('#b58b52')
        .lerp(new T.Color('#38271e'), smooth(0, 0.3, p));
      const fill = smooth(0.46, 0.76, p);
      coffeeSurface.position.y = mix(-0.35, 0.385, fill);
      coffeeSurface.scale.setScalar(mix(0.76, 1, fill));
      coffee.color
        .set('#482b1d')
        .lerp(new T.Color('#b88f64'), smooth(0.66, 0.95, p));
      milk.visible = p > 0.64;
      milk.scale.setScalar(smooth(0.64, 0.9, p));
      const pouring = smooth(0.46, 0.56, p) * (1 - smooth(0.72, 0.82, p));
      stream.visible = pouring > 0.001;
      stream.scale.x = stream.scale.z = pouring;
      steam.visible = p > 0.61;
      steamMaterial.opacity = smooth(0.61, 0.85, p) * 0.2;
      steam.children.forEach((particle, i) => {
        const a = (t * 0.12 + p * 2 + i / 12) % 1;
        particle.position.set(
          Math.sin(a * 8 + i) * 0.13,
          0.5 + a * 0.9,
          Math.cos(a * 6 + i) * 0.1,
        );
        particle.scale.setScalar(0.5 + a * 1.5);
      });
    },
  };
}
