import * as T from 'three';

// Only use on groups whose direct mesh children never move independently.
// The parent can still animate, and shared materials can still change color.
export function instanceStaticChildren(group) {
  const batches = new Map();
  for (const child of group.children) {
    if (
      !child.isMesh ||
      child.isInstancedMesh ||
      child.children.length ||
      Array.isArray(child.material) ||
      child.material.transparent ||
      child.material.transmission > 0 ||
      !child.visible
    )
      continue;
    const key = [
      child.geometry.uuid,
      child.material.uuid,
      child.castShadow,
      child.receiveShadow,
      child.renderOrder,
      child.layers.mask,
    ].join(':');
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(child);
  }
  for (const children of batches.values()) {
    if (children.length < 3) continue;
    const first = children[0];
    const instances = new T.InstancedMesh(
      first.geometry,
      first.material,
      children.length,
    );
    instances.castShadow = first.castShadow;
    instances.receiveShadow = first.receiveShadow;
    instances.renderOrder = first.renderOrder;
    instances.layers.mask = first.layers.mask;
    children.forEach((child, i) => {
      child.updateMatrix();
      instances.setMatrixAt(i, child.matrix);
      group.remove(child);
    });
    instances.computeBoundingBox();
    instances.computeBoundingSphere();
    group.add(instances);
  }
}
