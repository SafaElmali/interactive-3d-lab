import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFile } from 'node:fs/promises';
register('./three-loader.mjs', import.meta.url);
// These checks validate geometry and state transitions. They do not render pixels.
globalThis.self = globalThis;
globalThis.createImageBitmap = async () => ({
  width: 1,
  height: 1,
  close() {},
});
globalThis.document = {
  // oxlint-disable-next-line typescript/no-deprecated -- Minimal DOM stand-in for geometry-only checks.
  createElement: () => ({
    width: 512,
    height: 256,
    getContext: () => ({ fillRect() {}, fillText() {} }),
  }),
};
const T = await import('../vendor/three.module.js');
const { GLTFLoader } = await import('../vendor/GLTFLoader.js');
GLTFLoader.prototype.loadAsync = async function (url) {
  const bytes = await readFile(new URL(url));
  return this.parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
};
T.TextureLoader.prototype.loadAsync = async () =>
  new T.Texture({ width: 1, height: 1 });
const { projects } = await import('../shared/projects.js');
for (const project of projects) {
  const { create } = await import(`../projects/${project.id}/scene.js`);
  const model = await create({ preview: true });
  const objects = [];
  model.root.traverse((node) => {
    if (node.isMesh) objects.push(node);
  });
  assert.ok(objects.length > 0, `${project.id}: no geometry`);
  for (const control of model.controls ?? []) {
    if (control.type === 'range') {
      for (const value of [control.min ?? 0, control.max ?? 1]) {
        control.change(value);
        for (let i = 0; i < 40; i++)
          model.update?.(i / 60, 1 / 60, { preview: true });
      }
    } else if (control.type === 'swatches' || control.type === 'choice') {
      control.options.forEach((option, index) => {
        control.change(option.value ?? index, option);
        model.update?.(2, 1 / 60, { preview: true });
      });
    }
  }
  model.root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(model.root);
  assert.ok(!bounds.isEmpty(), `${project.id}: empty bounds`);
  for (const n of objects)
    assert.ok(
      n.matrixWorld.elements.every(Number.isFinite),
      `${project.id}: invalid transform`,
    );
  if (project.id === 'car-garage') {
    assert.ok(
      !objects.some((n) => n.material.name === 'Fabric'),
      'Display fabric must be removed from car',
    );
    const material = objects.find((n) => n.material.name === 'ToyCar').material;
    const shader = { uniforms: {}, fragmentShader: '#include <map_fragment>' };
    material.onBeforeCompile(shader);
    assert.ok(
      shader.fragmentShader.includes('greenMask') && shader.uniforms.labPaint,
      'Car paint mask is not attached',
    );
  }
  if (project.id === 'sneaker-studio') {
    const choices = model.controls[0];
    const maps = new Set();
    choices.options.forEach((option, i) => {
      choices.change(i, option);
      maps.add(objects[0].material.map.uuid);
    });
    assert.equal(
      maps.size,
      3,
      'Shoe colorways must switch distinct original textures',
    );
  }
  model.dispose?.();
  console.log(
    `${project.id}: ${objects.length} meshes, controls and transforms valid`,
  );
}
