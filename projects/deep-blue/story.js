import { create } from './scene.js';
import { T, rig, pose, sample, smooth, mix } from '../../shared/choreography.js';

export const story = {
  theme: 'deep-blue',
  colors: ['#081c32', '#101331', '#081c35', '#020811'],
  inks: ['#d4f8fb', '#ece1fb', '#c4f5ff', '#d9f8fa'],
  chapters: [
    { title: 'Deep Blue.', label: 'A softer kind of life', text: 'A living veil. Almost water, almost light. The ocean moves through it.' },
    { title: '<span>Feel the</span><span>current.</span>', label: 'The art of letting go', text: 'One quiet pulse. Twenty trailing threads. Every movement belongs to the water.' },
    { title: '<span>Never</span><span>alone.</span>', label: 'A drifting bloom', text: 'A single light becomes a constellation. A whole world, moving without a sound.', layout: 'right' },
    { title: 'Light lives here.', label: 'Below the blue', text: 'When the last daylight disappears, the deep begins to glow.' },
  ],
};

function oceanDust() {
  const positions = new Float32Array(190 * 3), geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const material = new T.PointsMaterial({ color: '#68deff', size: 0.044, transparent: true, opacity: 0.30, depthWrite: false, blending: T.AdditiveBlending });
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `float radius = length(gl_PointCoord - 0.5) * 2.0;
      diffuseColor.a *= pow(max(0.0, 1.0 - radius), 1.6);
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'deep-blue-plankton';
  const points = new T.Points(geometry, material);
  points.frustumCulled = false;
  function update(time) {
    for (let i = 0; i < 190; i++) {
      const seed = i * 2.399963;
      positions[i * 3] = Math.sin(seed * 1.7) * 6.8 + Math.sin(time * 0.1 + i) * 0.11;
      positions[i * 3 + 1] = Math.cos(seed * 0.73) * 4.1 + Math.sin(time * 0.15 + i * 0.3) * 0.12;
      positions[i * 3 + 2] = -2.8 + Math.sin(seed * 0.59) * 1.7;
    }
    geometry.attributes.position.needsUpdate = true;
  }
  update(0);
  return { points, material, update };
}

export async function createStory({ scene, lights } = {}) {
  const model = await create(), root = new T.Group(), hero = rig(model, 5.15);
  root.add(hero);
  const { cap, deform, bellMaterial, ribMaterial, edgeMaterial, organMaterial, ribbonMaterial, threadMaterial, haloMaterial } = model.parts;
  const companions = [];
  // Shared surfaces make the entire bloom less expensive than separate animated models.
  for (let i = 0; i < 5; i++) {
    const object = hero.clone(true);
    const bell = object.getObjectByName('bell');
    object.visible = false;
    root.add(object);
    companions.push({ object, bell });
  }
  const dust = oceanDust();
  root.add(dust.points);
  const blue = new T.Color('#8bd3ff'), violet = new T.Color('#b2a0ff');
  const bloomFrames = [
    { x: -3.70, y: 1.02, z: -2.0, s: 0.36, rz: -0.22 },
    { x: -0.13, y: 1.94, z: -3.1, s: 0.30, rz: 0.18 },
    { x: -3.25, y: -1.83, z: -2.7, s: 0.26, rz: 0.18 },
    { x: 0.32, y: -1.55, z: -3.5, s: 0.23, rz: -0.16 },
    { x: -1.38, y: 2.76, z: -4.8, s: 0.19, rz: 0.29 },
  ];
  return {
    root,
    update(progress, time, context = {}) {
      const p = T.MathUtils.clamp(progress, 0, 1), t = context.reduced ? 0 : time;
      const bloom = smooth(0.43, 0.66, p), deep = smooth(0.74, 1, p);
      deform(t, 1 + smooth(0.14, 0.34, p) * 0.20);
      pose(hero, sample([
        { x: 1.20, y: -0.18, z: 0, rx: 0.08, ry: -0.3, rz: -0.12, s: 1.00 },
        { x: 2.05, y: -0.08, z: 0, rx: -0.08, ry: 0.45, rz: 0.14, s: 1.13 },
        { x: -1.55, y: -0.03, z: -0.3, rx: 0.10, ry: 0.9, rz: -0.08, s: 0.78 },
        { x: 0.85, y: -0.22, z: 0, rx: 0.03, ry: 1.4, rz: 0.08, s: 1.00 },
      ], p), context);
      hero.position.y += Math.sin(t * 0.6) * 0.06;
      if (context.mobile) hero.position.y += 0.2;
      for (let i = 0; i < companions.length; i++) {
        const { object, bell } = companions[i], base = bloomFrames[i];
        const arrival = smooth(0.43 + i * 0.012, 0.62 + i * 0.008, p);
        object.visible = arrival > 0.001;
        object.position.set(
          mix(base.x, base.x + (i % 2 ? 2.4 : 0.15), deep) * (context.mobile ? 0.74 : 1),
          base.y - (1 - arrival) * 0.5 + Math.sin(t * 0.38 + i * 1.3) * 0.11,
          base.z,
        );
        object.rotation.set(0.05 + i * 0.025, i * 0.8 + Math.sin(t * 0.18 + i) * 0.08, base.rz + Math.sin(t * 0.3 + i) * 0.045);
        object.scale.setScalar(base.s * mix(0.3, 1, arrival));
        bell.scale.copy(cap.scale);
      }
      bellMaterial.opacity = mix(0.37, 0.23, deep);
      bellMaterial.emissiveIntensity = mix(0.27, 0.66, deep);
      ribMaterial.opacity = mix(0.44, 0.85, deep);
      edgeMaterial.opacity = mix(0.7, 1, deep);
      organMaterial.opacity = mix(0.48, 0.85, deep);
      ribbonMaterial.opacity = mix(0.65, 0.71, deep);
      ribbonMaterial.emissiveIntensity = mix(0.52, 1.3, deep);
      threadMaterial.opacity = mix(0.56, 0.84, deep);
      haloMaterial.uniforms.strength.value = mix(0.5, 0.95, deep);
      dust.update(t);
      dust.material.opacity = 0.21 + bloom * 0.10 + deep * 0.26;
      dust.material.size = context.mobile ? 0.09 : 0.045;
      if (scene) scene.environmentIntensity = mix(0.35, 0.12, deep);
      if (lights) {
        lights.key.color.copy(blue);
        lights.key.intensity = mix(1.1, 0.45, deep);
        lights.rim.color.copy(violet);
        lights.rim.intensity = mix(1.5, 1.1, deep);
        lights.key.castShadow = false;
      }
    },
  };
}
