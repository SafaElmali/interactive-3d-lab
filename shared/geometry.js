import * as T from 'three';
import { toCreasedNormals } from '../vendor/BufferGeometryUtils.js';
export { T };
export const mat = (color, roughness = 0.45, metalness = 0) =>
  new T.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: 0.12,
    clearcoatRoughness: 0.35,
  });
export const metal = (color = '#c3c6c8') =>
  new T.MeshPhysicalMaterial({
    color,
    roughness: 0.24,
    metalness: 1,
    anisotropy: 0.35,
    clearcoat: 0.3,
    clearcoatRoughness: 0.18,
  });
const geometryCache = new Map();
function cached(key, create) {
  if (!geometryCache.has(key)) geometryCache.set(key, create());
  return geometryCache.get(key);
}
function smoothEdges(geometry) {
  // The addon's weld tolerance is 0.01 units; preserve millimeter-sized details.
  geometry.scale(1000, 1000, 1000);
  toCreasedNormals(geometry, Math.PI / 3);
  geometry.scale(0.001, 0.001, 0.001);
  return geometry;
}
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
  const key = `box:${w}:${h}:${d}:${radius}`;
  const geometry = cached(key, () => {
    // Preserve the exact external dimensions while rounding all three axes.
    const bevel = Math.min(radius * 0.38, h * 0.22, w * 0.12, d * 0.12);
    const width = w - 2 * bevel,
      depth = d - 2 * bevel;
    const r = Math.max(0.0001, Math.min(radius - bevel, width / 2, depth / 2));
    const shape = new T.Shape();
    shape.moveTo(-width / 2 + r, -depth / 2);
    shape.lineTo(width / 2 - r, -depth / 2);
    shape.quadraticCurveTo(width / 2, -depth / 2, width / 2, -depth / 2 + r);
    shape.lineTo(width / 2, depth / 2 - r);
    shape.quadraticCurveTo(width / 2, depth / 2, width / 2 - r, depth / 2);
    shape.lineTo(-width / 2 + r, depth / 2);
    shape.quadraticCurveTo(-width / 2, depth / 2, -width / 2, depth / 2 - r);
    shape.lineTo(-width / 2, -depth / 2 + r);
    shape.quadraticCurveTo(-width / 2, -depth / 2, -width / 2 + r, -depth / 2);
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: h - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 10,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -(h - 2 * bevel) / 2, 0);
    return smoothEdges(geometry);
  });
  return mesh(geometry, material, position);
}
export function cylinder(r, h, material, position, top = r) {
  const geometry = cached(`cylinder:${r}:${h}:${top}`, () => {
    const b = Math.min(h * 0.18, r * 0.07, top * 0.07, 0.03);
    const points = [new T.Vector2(0, -h / 2), new T.Vector2(r - b, -h / 2)];
    for (let i = 1; i <= 5; i++) {
      const a = -Math.PI / 2 + ((i / 5) * Math.PI) / 2;
      points.push(
        new T.Vector2(r - b + Math.cos(a) * b, -h / 2 + b + Math.sin(a) * b),
      );
    }
    points.push(new T.Vector2(top, h / 2 - b));
    for (let i = 1; i <= 5; i++) {
      const a = ((i / 5) * Math.PI) / 2;
      points.push(
        new T.Vector2(top - b + Math.cos(a) * b, h / 2 - b + Math.sin(a) * b),
      );
    }
    points.push(new T.Vector2(0, h / 2));
    const geometry = new T.LatheGeometry(points, 96);
    const { position, uv } = geometry.attributes;
    // Lathe defaults allocate UV space by profile-point index, crowding labels
    // into the bevels. Map by physical height so artwork spans the whole wall.
    for (let i = 0; i < position.count; i++)
      uv.setY(i, (position.getY(i) + h / 2) / h);
    return geometry;
  });
  return mesh(geometry, material, position);
}
export function keycap(w, h, d, material) {
  const geometry = cached(`keycap:${w}:${h}:${d}`, () => {
    const source = box(w, h, d, material, [0, 0, 0], 0.055).geometry;
    const sourcePosition = source.attributes.position,
      sourceUV = source.attributes.uv;
    const points = [],
      uvs = [];
    const midpoint = (a, b) => a.map((value, i) => (value + b[i]) / 2);
    function triangle(a, b, c, subdivisions) {
      if (subdivisions) {
        const ab = midpoint(a, b),
          bc = midpoint(b, c),
          ca = midpoint(c, a);
        triangle(a, ab, ca, subdivisions - 1);
        triangle(ab, b, bc, subdivisions - 1);
        triangle(ca, bc, c, subdivisions - 1);
        triangle(ab, bc, ca, subdivisions - 1);
      } else {
        for (const v of [a, b, c]) {
          points.push(v[0], v[1], v[2]);
          uvs.push(v[3], v[4]);
        }
      }
    }
    for (let i = 0; i < sourcePosition.count; i += 3) {
      const vertices = [0, 1, 2].map((j) => [
        sourcePosition.getX(i + j),
        sourcePosition.getY(i + j),
        sourcePosition.getZ(i + j),
        sourceUV.getX(i + j),
        sourceUV.getY(i + j),
      ]);
      // Add interior vertices so the key's dish is a curved surface, not a flat cap.
      triangle(
        ...vertices,
        vertices.every((v) => v[1] > h / 2 - 0.0001) ? 2 : 0,
      );
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i),
        z = positions.getZ(i);
      const level = T.MathUtils.clamp(y / h + 0.5, 0, 1);
      const dish =
        Math.max(0, 1 - (x / (w * 0.48)) ** 2) *
        Math.max(0, 1 - (z / (d * 0.48)) ** 2);
      positions.setXYZ(
        i,
        x * (1 - level * 0.1),
        y - dish * 0.02 * level ** 6,
        z * (1 - level * 0.12),
      );
    }
    return smoothEdges(geometry);
  });
  return mesh(geometry, material);
}
export const sphere = (r, material, position, scale = [1, 1, 1]) => {
  const m = mesh(
    cached(`sphere:${r}`, () => new T.SphereGeometry(r, 40, 28)),
    material,
    position,
  );
  m.scale.set(...scale);
  return m;
};
export const torus = (
  r,
  tube,
  material,
  position,
  rotation = [Math.PI / 2, 0, 0],
) =>
  mesh(
    cached(`torus:${r}:${tube}`, () => new T.TorusGeometry(r, tube, 20, 128)),
    material,
    position,
    rotation,
  );
export const lathe = (points, material, position) =>
  mesh(
    new T.LatheGeometry(
      points.map((p) => new T.Vector2(...p)),
      128,
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
      16,
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
  const material = new T.MeshStandardMaterial({
    map: textLabel(text, options),
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    roughness: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const object = mesh(new T.PlaneGeometry(w, h), material, position);
  object.castShadow = false;
  return object;
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
