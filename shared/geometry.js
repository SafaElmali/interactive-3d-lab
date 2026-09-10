import * as T from 'three';
export { T };
export const mat = (color, roughness = 0.45, metalness = 0) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });
export const metal = (color = '#c3c6c8') => mat(color, 0.2, 0.95);
export function mesh(
  geometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
) {
  const object = new T.Mesh(geometry, material);
  object.position.set(...position);
  object.rotation.set(...rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}
export function box(w, h, d, material, position, radius = 0.06) {
  const r = Math.min(radius, w / 2, d / 2);
  const shape = new T.Shape();
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
    curveSegments: 6,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -h / 2, 0);
  return mesh(geometry, material, position);
}
export const cylinder = (r, h, material, position, top = r) =>
  mesh(new T.CylinderGeometry(top, r, h, 64), material, position);
export const sphere = (r, material, position, scale = [1, 1, 1]) => {
  const m = mesh(new T.SphereGeometry(r, 24, 16), material, position);
  m.scale.set(...scale);
  return m;
};
export const torus = (
  r,
  tube,
  material,
  position,
  rotation = [Math.PI / 2, 0, 0],
) => mesh(new T.TorusGeometry(r, tube, 12, 80), material, position, rotation);
export const lathe = (points, material, position) =>
  mesh(
    new T.LatheGeometry(
      points.map((p) => new T.Vector2(...p)),
      64,
    ),
    material,
    position,
  );
export function tube(points, radius, material) {
  return mesh(
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
      32,
      radius,
      8,
      false,
    ),
    material,
  );
}
export function textLabel(
  text,
  {
    width = 512,
    height = 256,
    color = '#222820',
    background = null,
    size = 76,
    font = 'Arial',
    weight = '700',
  } = {},
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = text.split('\n');
  lines.forEach((line, i) =>
    ctx.fillText(
      line,
      width / 2,
      height / 2 + (i - (lines.length - 1) / 2) * size * 1.35,
    ),
  );
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
export function label(text, w, h, position, options = {}) {
  const material = new T.MeshBasicMaterial({
    map: textLabel(text, options),
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
  });
  return mesh(new T.PlaneGeometry(w, h), material, position);
}
export function normalize(root, width = 4) {
  const bounds = new T.Box3().setFromObject(root),
    size = bounds.getSize(new T.Vector3()),
    center = bounds.getCenter(new T.Vector3());
  const group = new T.Group();
  root.position.sub(center);
  group.add(root);
  group.scale.setScalar(width / Math.max(size.x, size.y, size.z));
  return group;
}
export function disposeObject(root) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  root.traverse((n) => {
    if (n.geometry) geometries.add(n.geometry);
    if (n.material)
      (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) =>
        materials.add(m),
      );
  });
  materials.forEach((m) => {
    Object.values(m).forEach((v) => {
      if (v?.isTexture) textures.add(v);
    });
    m.dispose();
  });
  geometries.forEach((g) => g.dispose());
  textures.forEach((t) => t.dispose());
}
