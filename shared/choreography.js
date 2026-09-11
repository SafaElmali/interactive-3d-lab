import * as T from 'three';
export { T };
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a, b, t) => a + (b - a) * t;
export function smooth(a, b, value) {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
}
// Pure scroll sampling makes reverse scrolling and restored positions reliable.
export function sample(frames, progress) {
  const p = clamp(progress) * (frames.length - 1);
  const i = Math.min(Math.floor(p), frames.length - 2);
  const t = smooth(0, 1, p - i);
  return Object.fromEntries(
    Object.keys(frames[i]).map((key) => [
      key,
      mix(frames[i][key], frames[i + 1][key], t),
    ]),
  );
}
export function rig(model, size = 5) {
  const group = new T.Group(),
    centered = new T.Group(),
    normalized = new T.Group();
  const bounds = new T.Box3().setFromObject(model.root);
  const center = bounds.getCenter(new T.Vector3());
  const dimensions = bounds.getSize(new T.Vector3());
  centered.add(model.root);
  centered.position.copy(center).multiplyScalar(-1);
  normalized.add(centered);
  normalized.scale.setScalar(
    size / Math.max(dimensions.x, dimensions.y, dimensions.z),
  );
  group.add(normalized);
  return group;
}
export function pose(group, v, { mobile = false } = {}) {
  group.position.set((v.x ?? 0) * (mobile ? 0.28 : 1), v.y ?? 0, v.z ?? 0);
  group.rotation.set(v.rx ?? 0, v.ry ?? 0, v.rz ?? 0);
  group.scale.setScalar(v.s ?? 1);
}
export function colorAt(stops, progress, target = new T.Color()) {
  const p = clamp(progress) * (stops.length - 1);
  const i = Math.min(Math.floor(p), stops.length - 2);
  return target
    .set(stops[i])
    .lerp(new T.Color(stops[i + 1]), smooth(0, 1, p - i));
}
export function particles(count, color, size = 0.045) {
  const positions = new Float32Array(count * 3),
    geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const object = new T.Points(
    geometry,
    new T.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  object.frustumCulled = false;
  return { object, positions, geometry };
}
