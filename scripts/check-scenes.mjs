import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
T.TextureLoader.prototype.loadAsync = async (url) => {
  await readFile(new URL(url));
  const texture = new T.Texture({ width: 1, height: 1 });
  texture.name = new URL(url).pathname;
  return texture;
};
const { box, cylinder, mat, keycap } = await import('../shared/geometry.js');
const { instanceStaticChildren } = await import('../shared/instance-static.js');
const repeated = new T.Group();
repeated.position.set(2, -1, 3);
repeated.rotation.y = 0.8;
const sharedMaterial = mat('#abc');
const originals = Array.from({ length: 6 }, (_, i) => {
  const object = box(0.2, 0.3, 0.1, sharedMaterial, [i * 0.3, i % 2, 0]);
  object.rotation.z = i * 0.15;
  repeated.add(object);
  return object;
});
const beforeBounds = new T.Box3().setFromObject(repeated);
instanceStaticChildren(repeated);
assert.equal(
  repeated.children.length,
  1,
  'Repeated static meshes should share a draw',
);
const batch = repeated.children[0];
assert.equal(
  batch.count,
  originals.length,
  'Every original object must remain',
);
assert.equal(
  batch.geometry,
  originals[0].geometry,
  'Instancing must preserve geometry',
);
assert.equal(
  batch.material,
  sharedMaterial,
  'Day/night material updates must stay shared',
);
assert.equal(batch.castShadow, true);
assert.equal(batch.receiveShadow, true);
const matrix = new T.Matrix4();
originals.forEach((original, index) => {
  batch.getMatrixAt(index, matrix);
  matrix.elements.forEach((value, i) => {
    assert.ok(
      Math.abs(value - original.matrix.elements[i]) < 0.000001,
      'Instances must retain their original position, rotation and scale',
    );
  });
});
const afterBounds = new T.Box3().setFromObject(repeated);
assert.ok(beforeBounds.min.distanceTo(afterBounds.min) < 0.000001);
assert.ok(beforeBounds.max.distanceTo(afterBounds.max) < 0.000001);
for (const object of [
  box(2, 0.25, 1, mat('#fff')),
  keycap(2, 0.25, 1, mat('#fff')),
]) {
  const bounds = new T.Box3().setFromObject(object);
  assert.ok(Math.abs(bounds.max.y - 0.125) < 0.001);
  assert.ok(Math.abs(bounds.min.y + 0.125) < 0.001);
  assert.ok(
    bounds.max.x <= 1.001 && bounds.max.z <= 0.501,
    'Bevels must preserve fit between parts',
  );
  assert.ok(object.geometry.attributes.normal.array.every(Number.isFinite));
}
const round = cylinder(1, 0.1, mat('#fff'));
assert.ok(
  round.geometry.attributes.position.count > 1000,
  'Circular edges must be smooth',
);
const { RGBELoader } = await import('../vendor/RGBELoader.js');
const hdr = await readFile(
  new URL(
    '../assets/materials/studio_small_08/studio_small_08_1k.hdr',
    import.meta.url,
  ),
);
const parsedHDR = new RGBELoader().parse(
  hdr.buffer.slice(hdr.byteOffset, hdr.byteOffset + hdr.byteLength),
);
assert.equal(parsedHDR.width, 1024);
assert.equal(parsedHDR.height, 512);
const materialSources = JSON.parse(
  await readFile(
    new URL('../assets/materials/sources.json', import.meta.url),
    'utf8',
  ),
);
for (const asset of materialSources.assets) {
  for (const file of Object.values(asset.files)) {
    const bytes = await readFile(new URL('../' + file.path, import.meta.url));
    assert.equal(bytes.length, file.bytes, file.path);
    assert.equal(
      createHash('md5').update(bytes).digest('hex'),
      file.md5,
      file.path,
    );
  }
}
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
  const geometries = new Set(objects.map((n) => n.geometry));
  for (const geometry of geometries) {
    for (const attribute of Object.values(geometry.attributes))
      assert.ok(
        (attribute.array ?? attribute.data.array).every(Number.isFinite),
        `${project.id}: invalid surface geometry`,
      );
  }
  if (project.id === 'can-do') {
    const sleeves = objects.filter((node) => node.material.map);
    assert.equal(sleeves.length, 3, 'The cover must show three labeled cans');
    for (const { geometry } of sleeves) {
      const { position, uv } = geometry.attributes;
      geometry.computeBoundingBox();
      const radius = geometry.boundingBox.max.x;
      const labelV = [];
      for (let i = 0; i < position.count; i++) {
        if (Math.hypot(position.getX(i), position.getZ(i)) > radius * 0.999)
          labelV.push(uv.getY(i));
      }
      assert.ok(
        Math.max(...labelV) - Math.min(...labelV) > 0.9,
        'The can wall must display the full label height, not stretch a thin strip',
      );
    }
  }
  if (project.id === 'car-garage') {
    const materials = new Set(objects.map((n) => n.material));
    const tire = objects.find((n) => n.material.name === 'Tireside').material;
    const tireColor = tire.color.clone();
    const glass = objects.find((n) => n.material.name === 'Glass').material;
    model.controls[0].change(1, model.controls[0].options[1]);
    assert.ok(
      tire.color.equals(tireColor),
      'Paint changes must preserve tire shading',
    );
    assert.equal(glass.transmission, 1, 'Preserve the imported window glass');
    assert.ok(model.parts.bodyMaterials.size > 0);
    for (const material of model.parts.bodyMaterials)
      assert.ok(material.color.equals(new T.Color('#c84731')));
    const triangles = objects.reduce(
      (total, n) =>
        total +
        (n.geometry.index?.count ?? n.geometry.attributes.position.count) / 3,
      0,
    );
    assert.ok(
      triangles > 200000 && materials.size > 20,
      'The detailed car must preserve separate body, interior, wheels, and glass',
    );
    const bytes = await readFile(
      new URL('../projects/car-garage/assets/model.glb', import.meta.url),
    );
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      'c272098089d78c5cd9fd9f24ff50ee8acf8d932c55f2d55fc10adb6c8998966b',
    );
  }
  if (project.id === 'watch-explorer' || project.id === 'vinyl-room') {
    const material =
      project.id === 'watch-explorer' ? model.parts.strap : model.parts.wood;
    assert.ok(
      material.normalMap && material.roughnessMap,
      'Photographic surface maps must be loaded',
    );
    assert.equal(material.normalMap.colorSpace, T.NoColorSpace);
    if (material.map) assert.equal(material.map.colorSpace, T.SRGBColorSpace);
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
