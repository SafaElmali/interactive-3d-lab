import { normalize } from '../../shared/geometry.js';
import { GLTFLoader } from '../../vendor/GLTFLoader.js';
export async function create() {
  const gltf = await new GLTFLoader().loadAsync(
    new URL('./assets/model.glb', import.meta.url).href,
  );
  const materials = await Promise.all(
    [0, 1, 2].map((i) => gltf.parser.getDependency('material', i)),
  );
  const root = normalize(gltf.scene, 4.4);
  const meshes = [];
  gltf.scene.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = true;
      n.receiveShadow = true;
      meshes.push(n);
    }
  });
  let turntable = false;
  return {
    root,
    angle: [3, 1.65, 5.5],
    controls: [
      {
        type: 'swatches',
        label: 'Colorway',
        options: [
          { label: 'Midnight', color: '#383d44' },
          { label: 'Beach', color: '#c1af94' },
          { label: 'Street', color: '#b84c4d' },
        ],
        change: (i) => meshes.forEach((m) => (m.material = materials[i])),
      },
      {
        type: 'range',
        label: 'Surface finish',
        start: 'Original',
        end: 'Gloss',
        change: (v) => {
          materials.forEach((m) => {
            m.roughness = 1 - v * 0.65;
          });
        },
      },
      {
        type: 'choice',
        label: 'Turntable',
        value: 1,
        options: [
          { label: 'Spin', value: true },
          { label: 'Still', value: false },
        ],
        change: (v) => (turntable = v),
      },
    ],
    update: (t, dt, { preview, reduced } = {}) => {
      if (turntable && !preview && !reduced) root.rotation.y += dt * 0.35;
    },
    credit:
      '<a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe" target="_blank" rel="noreferrer">Materials Variants Shoe · Shopify<br>CC BY 4.0 · via Khronos</a>',
  };
}
