import { create } from './scene.js';
import { T, rig, pose, sample, smooth, mix } from '../../shared/choreography.js';

export const story = {
  theme: 'garden',
  colors: ['#dce9ba', '#c3cb8e', '#477a3e', '#071e2b'],
  inks: ['#203d28', '#293b21', '#f5f3ca', '#ecf4cf'],
  chapters: [
    {
      title: 'Room to grow.',
      label: 'Glass Garden',
      text: 'A little glass. A little light. Space for something extraordinary.',
    },
    {
      title: '<span>Good</span><span>ground.</span>',
      label: 'A world beneath',
      text: 'Stone, charcoal, soil. Every living thing begins with a quiet foundation.',
    },
    {
      title: '<span>Life,</span><span>unfolding.</span>',
      label: 'Into the light',
      text: 'A curl becomes a leaf. A handful of green becomes a world.',
      layout: 'right',
    },
    {
      title: 'Even here, magic.',
      label: 'After the sun',
      text: 'The glass gathers dew. Tiny lights keep their own hours.',
    },
  ],
};

export async function createStory({ lights, scene } = {}) {
  const model = await create();
  const root = new T.Group(), terrarium = rig(model, 4.85);
  root.add(terrarium);
  const { layers, surface, mossGroup, branch, plants, leaves, droplets, dropMaterial, fireflies, glowMaterial, glowLight, drift } = model.parts;
  const dayKey = new T.Color('#fff2dc'), nightKey = new T.Color('#b5d4e4');
  const dayRim = new T.Color('#c9dcff'), nightRim = new T.Color('#90d49b');
  return {
    root,
    update(progress, time, context = {}) {
      const p = T.MathUtils.clamp(progress, 0, 1);
      const { mobile = false, reduced = false } = context;
      const t = reduced ? 0 : time;
      const dusk = smooth(0.73, 0.99, p);
      const grow = smooth(0.36, 0.67, p);
      pose(terrarium, sample([
        { x: 0.45, y: -0.20, rx: 0.13, ry: -0.38, rz: -0.03, s: 1.03 },
        { x: 1.90, y: -0.16, rx: 0.19, ry: 0.16, rz: 0.03, s: 1.02 },
        { x: -1.82, y: -0.30, rx: 0.10, ry: -0.28, rz: -0.035, s: 1.13 },
        { x: 0.65, y: -0.30, rx: 0.14, ry: 0.40, rz: 0.025, s: 1.06 },
      ], p), context);
      if (mobile) terrarium.position.y += 0.42;

      layers.forEach(({ group, homeY, index }) => {
        const settle = smooth(0.10 + index * 0.033, 0.22 + index * 0.033, p);
        group.visible = settle > 0.001;
        group.position.y = homeY + (1 - settle) * (1.35 + index * 0.17);
        group.scale.set(mix(0.73, 1, settle), mix(0.1, 1, settle), mix(0.73, 1, settle));
      });
      const surfaceSettle = smooth(0.25, 0.355, p);
      surface.visible = surfaceSettle > 0.001;
      surface.position.y = -0.86 + (1 - surfaceSettle) * 1.3;
      surface.scale.setScalar(mix(0.01, 1, surfaceSettle));
      mossGroup.visible = grow > 0.001;
      mossGroup.scale.set(1, mix(0.02, 1, grow), 1);
      branch.scale.setScalar(mix(0.01, 1, smooth(0.29, 0.42, p)));

      plants.forEach(({ object, scale, index }) => {
        const emergence = smooth(0.355 + index * 0.024, 0.60 + index * 0.024, p);
        object.visible = emergence > 0.001;
        object.scale.set(scale * mix(0.15, 1, emergence), scale * Math.max(0.002, emergence), scale * mix(0.15, 1, emergence));
      });
      leaves.forEach(({ object, rotation, index }) => {
        const unfurl = smooth(0.405 + (index % 6) * 0.012, 0.63 + (index % 6) * 0.009, p);
        object.scale.set(mix(0.035, 1, unfurl), mix(0.45, 1, unfurl), mix(0.12, 1, unfurl));
        object.rotation.set(
          rotation.x + (1 - unfurl) * 0.95 + Math.sin(t * 0.55 + index) * grow * 0.015,
          rotation.y,
          rotation.z * unfurl,
        );
      });

      droplets.visible = dusk > 0.001;
      dropMaterial.opacity = dusk * 0.62;
      fireflies.visible = dusk > 0.001;
      glowMaterial.opacity = dusk * (0.82 + Math.sin(t * 0.65) * 0.10);
      glowMaterial.size = mobile ? 0.20 : 0.18;
      glowLight.intensity = dusk * 1.7;
      drift(t);
      if (lights) {
        lights.key.color.copy(dayKey).lerp(nightKey, dusk);
        lights.key.intensity = mix(2.7, 0.70, dusk);
        lights.rim.color.copy(dayRim).lerp(nightRim, dusk);
        lights.rim.intensity = mix(1.7, 2.3, dusk);
      }
      if (scene) scene.environmentIntensity = mix(0.75, 0.35, dusk);
    },
  };
}
