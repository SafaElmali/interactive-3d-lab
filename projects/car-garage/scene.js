import { T, normalize } from '../../shared/geometry.js';
import { GLTFLoader } from '../../vendor/GLTFLoader.js';
export async function create({ scene, lights } = {}) {
  const gltf = await new GLTFLoader().loadAsync(
    new URL('./assets/model.glb', import.meta.url).href,
  );
  const remove = [];
  const bodyMaterials = new Set();
  gltf.scene.traverse((n) => {
    if (n.isCamera || (n.isMesh && n.material.name === 'Fabric'))
      remove.push(n);
    if (n.isMesh) {
      n.castShadow = true;
      n.receiveShadow = true;
      if (n.material.name === 'ToyCar') bodyMaterials.add(n.material);
    }
  });
  remove.forEach((n) => n.removeFromParent());
  const root = normalize(gltf.scene, 4.5);
  root.rotation.y = -0.45;
  const paint = { value: new T.Color('#65963b') };
  const enabled = { value: 0 };
  bodyMaterials.forEach((material) => {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.labPaint = paint;
      shader.uniforms.labPaintEnabled = enabled;
      shader.fragmentShader =
        'uniform vec3 labPaint;\nuniform float labPaintEnabled;\n' +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float greenMask = smoothstep(0.02, 0.12, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));
        vec3 tinted = labPaint * max(diffuseColor.g, 0.01) / 0.28;
        diffuseColor.rgb = mix(diffuseColor.rgb, tinted, greenMask * labPaintEnabled);`,
      );
    };
    material.customProgramCacheKey = () => 'object-lab-car-paint-v1';
  });
  let spin = false,
    night = 0;
  return {
    root,
    parts: { paint, enabled, bodyMaterials },
    angle: [5, 2.6, 5],
    controls: [
      {
        type: 'swatches',
        label: 'Paint',
        options: [
          { label: 'Original green', color: '#65963b' },
          { label: 'Signal red', color: '#c84731' },
          { label: 'Sunflower', color: '#d6b542' },
          { label: 'Ocean blue', color: '#4b87bd' },
          { label: 'Pearl', color: '#dddacb' },
        ],
        change: (i, o) => {
          enabled.value = i === 0 ? 0 : 1;
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
        scene.background.set('#e8e5d8').lerp(new T.Color('#161c28'), night);
        scene.environmentIntensity = 1 - night * 0.45;
        lights.key.intensity = 3.2 - night * 1.8;
        lights.rim.intensity = 1.4 + night * 2;
      }
    },
    credit:
      '<a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar" target="_blank" rel="noreferrer">ToyCar · Guido Odendahl / Eric Chadwick<br>CC0 · via Khronos</a>',
  };
}
