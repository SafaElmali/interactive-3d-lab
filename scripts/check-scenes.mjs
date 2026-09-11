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

// Exercise the actual story animations, including reversing and mobile framing.
for (const project of projects.filter((p) => p.id !== 'can-do')) {
  const { story, createStory } = await import(
    `../projects/${project.id}/story.js`
  );
  assert.equal(story.chapters.length, 4);
  assert.equal(story.colors.length, 4);
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight());
  const lights = {
    key: new T.DirectionalLight(),
    rim: new T.DirectionalLight(),
  };
  scene.add(lights.key, lights.rim);
  const model = await createStory({ scene, lights });
  const world = new T.Group();
  world.add(model.root);
  scene.add(world);
  const camera = new T.PerspectiveCamera(40, 1, 0.1, 150);
  camera.position.z = 11;
  camera.updateMatrixWorld();
  let count = 0;
  for (const mobile of [false, true]) {
    camera.aspect = mobile ? 390 / 844 : 1440 / 900;
    camera.updateProjectionMatrix();
    world.scale.setScalar(Math.min(1, camera.aspect / 1.15));
    world.position.y = mobile ? -0.3 : -0.1;
    const frustum = new T.Frustum().setFromProjectionMatrix(
      new T.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      ),
    );
    for (let i = 0; i <= 60; i++) {
      const p = i / 60;
      model.update(p, 4, { mobile, reduced: false, dt: 1 / 60 });
      scene.updateMatrixWorld(true);
      let inView = 0;
      model.root.traverseVisible((node) => {
        assert.ok(
          node.matrixWorld.elements.every(Number.isFinite),
          `${project.id}: invalid transform at ${p}`,
        );
        if (node.isMesh && frustum.intersectsObject(node)) inView++;
        if (node.isPoints)
          assert.ok(
            node.geometry.attributes.position.array.every(Number.isFinite),
          );
        if (node.isInstancedMesh)
          assert.ok(node.instanceMatrix.array.every(Number.isFinite));
      });
      assert.ok(
        inView > 0,
        `${project.id}: empty camera view at ${p}, mobile=${mobile}`,
      );
      count++;
    }
    for (const p of [0, 1 / 3, 2 / 3, 1]) {
      model.update(p, 0, { mobile, reduced: true, dt: 1 / 60 });
      model.root.updateMatrixWorld(true);
      model.root.traverse((node) =>
        assert.ok(node.matrixWorld.elements.every(Number.isFinite)),
      );
    }
  }
  const snapshot = () => {
    scene.updateMatrixWorld(true);
    const state = [];
    model.root.traverse((node) =>
      state.push([node.visible, ...node.matrixWorld.elements]),
    );
    return state;
  };
  const context = { mobile: false, reduced: false, dt: 1 / 60 };
  model.update(0.35, 4, context);
  const before = snapshot();
  model.update(0.92, 4, context);
  model.update(0.35, 4, context);
  assert.deepEqual(
    snapshot(),
    before,
    `${project.id}: reverse scrolling must restore the same pose`,
  );
  const html = await readFile(
    new URL(`../projects/${project.id}/index.html`, import.meta.url),
    'utf8',
  );
  assert.ok(
    html.includes('../../shared/story.js') && !html.includes('shared/studio.'),
    `${project.id}: must load the scroll story`,
  );
  model.dispose?.();
  console.log(
    `${project.id}: ${count} scroll poses, reverse scrolling, mobile framing, and reduced motion valid`,
  );
}
