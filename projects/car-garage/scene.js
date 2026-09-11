import { T, normalize } from '../../shared/geometry.js';
import { GLTFLoader } from '../../vendor/GLTFLoader.js';
export async function create({ scene, lights } = {}) {
  const gltf = await new GLTFLoader().loadAsync(
    new URL('./assets/model.glb', import.meta.url).href,
  );
  const bodyMaterials = new Set();
  const paint = { value: new T.Color('#d82419') };
  gltf.scene.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = node.material.transmission !== 1;
    node.receiveShadow = true;
    // The source model has separate paint, trim, glass, and tire materials.
    if (node.material.name.startsWith('Paint 1')) {
      bodyMaterials.add(node.material);
      node.material.color = paint.value;
      node.material.clearcoat = 1;
      node.material.clearcoatRoughness = 0.12;
    }
  });
  const root = normalize(gltf.scene, 4.5);
  root.rotation.y = -0.45;
  let spin = false,
    night = 0;
  return {
    root,
    parts: { paint, bodyMaterials },
    angle: [5, 2.6, 5],
    controls: [
      {
        type: 'swatches',
        label: 'Paint',
        options: [
          { label: 'Carmine', color: '#d82419' },
          { label: 'Signal red', color: '#c84731' },
          { label: 'Sunflower', color: '#d6b542' },
          { label: 'Ocean blue', color: '#4b87bd' },
          { label: 'Pearl', color: '#dddacb' },
        ],
        change: (i, o) => {
          paint.value.set(o.color);
        },
      },
      {
        type: 'range',
        label: 'Studio lighting',
        start: 'Day studio',
        end: 'After hours',
        change: (v) => (night = v),
      },
      {
        type: 'choice',
        label: 'Turntable',
        value: 1,
        options: [
          { label: 'Spin', value: true },
          { label: 'Still', value: false },
        ],
        change: (v) => (spin = v),
      },
      {
        type: 'range',
        label: 'Clear coat',
        value: 1,
        start: 'Satin',
        end: 'Polished',
        change: (v) =>
          bodyMaterials.forEach((m) => {
            m.clearcoat = v;
            m.roughness = 0.8 - v * 0.5;
          }),
      },
    ],
    update: (t, dt, { preview, reduced } = {}) => {
      if (spin && !preview && !reduced) root.rotation.y += dt * 0.3;
      if (scene) {
        scene.background?.set('#e8e5d8').lerp(new T.Color('#161c28'), night);
        scene.environmentIntensity = 1 - night * 0.45;
        lights.key.intensity = 2.7 - night * 1.8;
        lights.rim.intensity = 1.4 + night * 2;
      }
    },
    credit:
      '<a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept" target="_blank" rel="noreferrer">CarConcept · Eric Chadwick / DGG<br>CC BY 4.0 · via Khronos</a>',
  };
}
