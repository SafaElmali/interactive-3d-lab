import { T, mat, mesh, cylinder, torus } from '../../shared/geometry.js';
import { microfinish } from '../../shared/materials.js';

const TAU = Math.PI * 2;
const seeded = (i, salt = 0) => {
  const n = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// A folded, cupped leaf surface. Both the blade and veins share this profile.
function leafGeometry(narrow = false) {
  const positions = [], indices = [], uvs = [];
  const rows = 16, columns = 8;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const width = Math.sin(Math.PI * t) ** (narrow ? 0.85 : 0.7);
    for (let col = 0; col <= columns; col++) {
      const u = (col / columns) * 2 - 1;
      positions.push(
        u * width * 0.5 * (1 + Math.sin(t * Math.PI * 8) * 0.025),
        t,
        Math.sin(t * Math.PI) * (1 - Math.abs(u)) * 0.13 - t * t * 0.23,
      );
      uvs.push(col / columns, t);
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col, b = a + columns + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function leafVeins() {
  const points = [];
  const surface = (u, t) => [
    u * Math.sin(Math.PI * t) ** 0.7 * 0.5,
    t,
    Math.sin(t * Math.PI) * (1 - Math.abs(u)) * 0.13 - t * t * 0.23 + 0.006,
  ];
  for (let i = 0; i < 16; i++) points.push(...surface(0, i / 16), ...surface(0, (i + 1) / 16));
  for (let i = 1; i < 7; i++) {
    for (const side of [-1, 1]) {
      const t = i / 8;
      for (let step = 0; step < 4; step++) {
        const a = step / 4, b = (step + 1) / 4;
        points.push(...surface(a * side * 0.9, t + a * 0.08), ...surface(b * side * 0.9, t + b * 0.08));
      }
    }
  }
  return new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(points, 3));
}

function stem(points, radius, material) {
  const curve = new T.CatmullRomCurve3(points.map((point) => new T.Vector3(...point)));
  return mesh(new T.TubeGeometry(curve, 18, radius, 5, false), material);
}

function soilGeometry(radius, height, salt) {
  const geometry = new T.CylinderGeometry(radius, radius * 0.96, height, 72, 4);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const angle = Math.atan2(z, x);
    const edge = Math.min(1, Math.hypot(x, z) / radius);
    const ripple = (Math.sin(angle * 7 + salt) + Math.sin(angle * 13 - salt) * 0.4) * 0.012 * edge;
    positions.setY(i, y + ripple);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function instanceCloud(geometry, material, count, transform, tint) {
  const object = new T.InstancedMesh(geometry, material, count);
  const dummy = new T.Object3D();
  for (let i = 0; i < count; i++) {
    transform(dummy, i);
    dummy.updateMatrix();
    object.setMatrixAt(i, dummy.matrix);
    if (tint) object.setColorAt(i, new T.Color(tint[i % tint.length]));
  }
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

export async function create({ preview = false } = {}) {
  const root = new T.Group();
  root.name = 'Glass Garden';
  const vessel = new T.Group(), habitat = new T.Group(), foliage = new T.Group();
  root.add(vessel, habitat, foliage);
  foliage.position.y = -0.86;

  const glassMaterial = new T.MeshPhysicalMaterial({
    color: '#bfe9dc', roughness: 0.075, metalness: 0.04,
    transparent: true, opacity: 0.19, depthWrite: false,
    side: T.FrontSide, clearcoat: 1, clearcoatRoughness: 0.06,
    envMapIntensity: 1.45,
  });
  // Glass remains nearly clear face-on, with a stronger reflective silhouette.
  glassMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `float edgeGlow = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.5);
       diffuseColor.a *= 0.2 + edgeGlow * 3.0;
       #include <opaque_fragment>`,
    );
  };
  glassMaterial.customProgramCacheKey = () => 'glass-garden-clear-vessel';
  const profile = new T.Path();
  profile.moveTo(0.02, -1.57);
  profile.lineTo(1.2, -1.57);
  profile.bezierCurveTo(1.49, -1.57, 1.57, -1.30, 1.57, -0.82);
  profile.bezierCurveTo(1.64, 0.14, 1.54, 0.94, 1.2, 1.4);
  profile.quadraticCurveTo(1.12, 1.52, 1.12, 1.74);
  const glass = mesh(new T.LatheGeometry(profile.getPoints(36), 96), glassMaterial);
  glass.name = 'Clear hand-blown vessel';
  glass.castShadow = glass.receiveShadow = false;
  glass.renderOrder = 10;
  vessel.add(glass);

  const rimMaterial = glassMaterial.clone();
  rimMaterial.opacity = 0.62;
  rimMaterial.onBeforeCompile = glassMaterial.onBeforeCompile;
  rimMaterial.customProgramCacheKey = glassMaterial.customProgramCacheKey;
  const lip = torus(1.12, 0.047, rimMaterial, [0, 1.74, 0]);
  const foot = torus(1.24, 0.055, rimMaterial, [0, -1.53, 0]);
  for (const ring of [lip, foot]) {
    ring.castShadow = ring.receiveShadow = false;
    ring.renderOrder = 11;
  }
  vessel.add(lip, foot);
  const base = cylinder(1.18, 0.08, microfinish(mat('#706549', 0.88), 180, 0.22), [0, -1.64, 0]);
  base.name = 'Cork resting ring';
  vessel.add(base);

  const strata = [
    { y: -1.39, h: 0.20, r: 1.31, color: '#c9b28d', name: 'Drainage gravel' },
    { y: -1.25, h: 0.075, r: 1.38, color: '#34382c', name: 'Activated charcoal' },
    { y: -1.09, h: 0.245, r: 1.42, color: '#715036', name: 'Living soil' },
    { y: -0.938, h: 0.065, r: 1.42, color: '#9b7850', name: 'Mineral surface' },
  ];
  const layers = strata.map(({ y, h, r, color, name }, i) => {
    const group = new T.Group();
    group.name = name;
    group.position.y = y;
    const material = microfinish(mat(color, 0.96), 130, 0.5);
    group.add(mesh(soilGeometry(r, h, i * 2.1), material));
    habitat.add(group);
    return { group, homeY: y, index: i };
  });

  const pebbleGeometry = new T.IcosahedronGeometry(1, 1);
  const pebbleMaterial = mat('#ffffff', 0.86);
  const drainage = instanceCloud(pebbleGeometry, pebbleMaterial, preview ? 80 : 120, (dummy, i) => {
    const angle = i * 2.399963;
    const r = 1.27 * Math.sqrt(seeded(i, 4));
    dummy.position.set(Math.cos(angle) * r, seeded(i, 8) * 0.13 - 0.055, Math.sin(angle) * r);
    const s = 0.05 + seeded(i, 2) * 0.055;
    dummy.scale.set(s, s * 0.68, s * 0.84);
    dummy.rotation.set(i * 0.8, i * 0.35, i * 1.3);
  }, ['#c6b795', '#e5d5ad', '#a29071', '#776955']);
  layers[0].group.add(drainage);
  const grains = instanceCloud(pebbleGeometry, pebbleMaterial, 130, (dummy, i) => {
    const angle = i * 2.399963;
    const radius = 1.41 + seeded(i, 6) * 0.008;
    dummy.position.set(Math.sin(angle) * radius, seeded(i, 3) * 0.20 - 0.10, Math.cos(angle) * radius);
    const s = 0.012 + seeded(i, 7) * 0.018;
    dummy.scale.set(s * 1.5, s, s);
    dummy.rotation.set(i, i * 0.5, i * 0.8);
  }, ['#352e20', '#be9670', '#896042', '#4b3825']);
  layers[2].group.add(grains);

  const surface = new T.Group();
  surface.position.y = -0.86;
  habitat.add(surface);
  const rocks = instanceCloud(new T.IcosahedronGeometry(1, 2), mat('#ffffff', 0.88), 15, (dummy, i) => {
    const angle = i * 2.399963;
    const radius = 0.55 + seeded(i, 4) * 0.65;
    dummy.position.set(Math.sin(angle) * radius, 0.025 + seeded(i, 3) * 0.035, Math.cos(angle) * radius);
    const s = 0.10 + seeded(i, 1) * 0.16;
    dummy.scale.set(s * 1.5, s * 0.65, s);
    dummy.rotation.set(i * 0.4, i * 0.8, i * 0.1);
  }, ['#6e8275', '#aeb6a0', '#d9d4b2', '#798a7b']);
  surface.add(rocks);

  const mossMaterial = microfinish(mat('#91ae3a', 0.93), 200, 0.25);
  const moss = instanceCloud(new T.IcosahedronGeometry(1, 2), mossMaterial, preview ? 40 : 64, (dummy, i) => {
    const angle = i * 2.399963;
    const radius = 1.23 * Math.sqrt(seeded(i, 9));
    dummy.position.set(Math.sin(angle) * radius, 0.025 + seeded(i, 8) * 0.035, Math.cos(angle) * radius);
    const s = 0.095 + seeded(i, 1) * 0.12;
    dummy.scale.set(s * 1.2, s * 0.5, s);
    dummy.rotation.set(0, i * 0.4, 0);
  }, ['#7e992f', '#adc14c', '#5c812d', '#8caa32']);
  const mossGroup = new T.Group();
  mossGroup.add(moss);
  surface.add(mossGroup);

  const bark = microfinish(mat('#68553b', 0.97), 130, 0.5);
  const branch = new T.Group();
  branch.add(stem([[-0.8, 0, -0.38], [-0.48, 0.30, -0.48], [-0.03, 0.48, -0.60], [0.47, 0.58, -0.47]], 0.083, bark));
  branch.add(stem([[-0.33, 0.35, -0.51], [-0.40, 0.69, -0.45], [-0.60, 0.95, -0.43]], 0.034, bark));
  branch.add(stem([[0.1, 0.49, -0.57], [0.28, 0.86, -0.49], [0.43, 1.08, -0.43]], 0.025, bark));
  surface.add(branch);

  const greens = ['#265e37', '#427b39', '#709a3b', '#94b34e'].map((color) => {
    const material = mat(color, 0.52);
    material.side = T.DoubleSide;
    material.clearcoat = 0.4;
    material.clearcoatRoughness = 0.4;
    return material;
  });
  const stemMaterial = mat('#6a8636', 0.74);
  const veinMaterial = new T.LineBasicMaterial({ color: '#b2c672', transparent: true, opacity: 0.38 });
  const broadGeometry = leafGeometry(), narrowGeometry = leafGeometry(true), veins = leafVeins();
  const plants = [], leaves = [];

  function broadPlant(x, z, scale, turn, index) {
    const plant = new T.Group();
    plant.position.set(x, 0, z);
    plant.rotation.y = turn;
    plant.scale.setScalar(scale);
    foliage.add(plant);
    for (let i = 0; i < 6; i++) {
      const angle = i * 2.399963, height = 0.48 + (i % 3) * 0.24;
      const end = [Math.sin(angle) * 0.24, height, Math.cos(angle) * 0.24];
      plant.add(stem([[0, 0, 0], [end[0] * 0.4, height * 0.6, end[2] * 0.4], end], 0.016, stemMaterial));
      const leaf = new T.Group();
      leaf.position.set(...end);
      leaf.rotation.set(0.22 + (i % 2) * 0.12, angle, Math.sin(angle) * -0.45);
      const blade = mesh(broadGeometry, greens[(i + index) % greens.length]);
      blade.scale.set(0.62 + (i % 2) * 0.14, 0.8 + (i % 3) * 0.12, 0.8 + (i % 3) * 0.12);
      const vein = new T.LineSegments(veins, veinMaterial);
      vein.scale.copy(blade.scale);
      leaf.add(blade, vein);
      plant.add(leaf);
      leaves.push({ object: leaf, rotation: leaf.rotation.clone(), index: leaves.length });
    }
    plants.push({ object: plant, scale, index });
  }
  broadPlant(-0.54, -0.21, 1.15, -0.3, 0);
  broadPlant(0.44, -0.40, 0.90, 0.8, 1);
  broadPlant(-0.16, 0.52, 0.48, 1.6, 2);

  // Each fern frond carries paired tapered leaflets along a bending rachis.
  const fern = new T.Group();
  fern.position.set(0.64, 0, 0.34);
  for (let frond = 0; frond < 7; frond++) {
    const branchGroup = new T.Group();
    branchGroup.rotation.y = frond * TAU / 7;
    branchGroup.rotation.z = -0.10 + (frond % 3) * 0.12;
    const length = 0.73 + (frond % 3) * 0.15;
    branchGroup.add(stem([[0, 0, 0], [0, length * 0.70, 0.28], [0, length, 0.69]], 0.009, stemMaterial));
    for (let pair = 0; pair < 9; pair++) {
      const a = 0.18 + pair * 0.085;
      for (const side of [-1, 1]) {
        const leaflet = mesh(narrowGeometry, greens[(frond + pair) % 3 + 1]);
        leaflet.position.set(0, length * Math.sin(a * Math.PI / 2), 0.69 * a * a);
        leaflet.rotation.set(0.9, 0.1 * side, side * -1.05);
        const size = (0.30 - a * 0.20) * (0.85 + frond * 0.035);
        leaflet.scale.set(size * 0.42, size, size);
        branchGroup.add(leaflet);
      }
    }
    fern.add(branchGroup);
  }
  foliage.add(fern);
  plants.push({ object: fern, scale: 1, index: 3 });

  const dropMaterial = new T.MeshPhysicalMaterial({
    color: '#d3f7d8', roughness: 0.05, metalness: 0.12,
    transparent: true, opacity: 0.62, depthWrite: false, clearcoat: 1,
  });
  const droplets = instanceCloud(new T.SphereGeometry(1, 8, 6), dropMaterial, preview ? 36 : 76, (dummy, i) => {
    // The shoulder narrows above the equator; small droplets cling to its outside.
    const y = -0.55 + seeded(i, 13) * 1.82;
    const radius = y < 0 ? 1.578 : 1.59 - Math.pow(y / 1.4, 2) * 0.37;
    const angle = -1.0 + seeded(i, 14) * 2.0;
    dummy.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    const size = 0.009 + seeded(i, 15) ** 2 * 0.024;
    dummy.scale.set(size, size * (1.0 + seeded(i, 16)), size * 0.5);
    dummy.rotation.set(0, angle, 0);
  });
  droplets.name = 'Condensation';
  droplets.castShadow = droplets.receiveShadow = false;
  droplets.renderOrder = 12;
  root.add(droplets);

  const glowGeometry = new T.BufferGeometry();
  const fireflyPositions = new Float32Array(18 * 3);
  const glowMaterial = new T.PointsMaterial({
    color: '#e9ff89', size: 0.10, transparent: true, opacity: 0.92,
    blending: T.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  glowMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `float radius = length(gl_PointCoord - 0.5) * 2.0;
       diffuseColor.a *= 1.0 - smoothstep(0.12, 1.0, radius);
       #include <opaque_fragment>`,
    );
  };
  glowMaterial.customProgramCacheKey = () => 'glass-garden-firefly';
  glowGeometry.setAttribute('position', new T.BufferAttribute(fireflyPositions, 3));
  const fireflies = new T.Points(glowGeometry, glowMaterial);
  fireflies.frustumCulled = false;
  fireflies.renderOrder = 13;
  root.add(fireflies);
  const glowLight = new T.PointLight('#bfdc5d', 0.8, 5, 2);
  glowLight.position.set(0.1, 0.4, 0.8);
  root.add(glowLight);

  function drift(time = 0) {
    for (let i = 0; i < 18; i++) {
      const angle = i * 2.399963 + time * (0.08 + (i % 3) * 0.015);
      const radius = 0.52 + seeded(i, 19) * 0.6;
      fireflyPositions[i * 3] = Math.sin(angle) * radius;
      fireflyPositions[i * 3 + 1] = -0.4 + seeded(i, 20) * 1.68 + Math.sin(time * 0.55 + i) * 0.10;
      fireflyPositions[i * 3 + 2] = Math.cos(angle) * radius;
    }
    glowGeometry.attributes.position.needsUpdate = true;
  }
  drift(0);
  fireflies.visible = false;
  droplets.visible = preview;
  glowLight.intensity = 0;
  return {
    root,
    parts: { vessel, habitat, foliage, layers, surface, mossGroup, branch, plants, leaves, droplets, dropMaterial, fireflies, glowMaterial, glowLight, glassMaterial, drift },
    angle: [3, 2.2, 6],
    previewPadding: 1.22,
    credit: 'Original procedural terrarium, sculpted leaves, soil, and glass · Object Lab',
  };
}
