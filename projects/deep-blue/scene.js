import { T } from '../../shared/geometry.js';
import { mergeGeometries } from '../../vendor/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const radial = 96, rings = 28;
const bellPoint = (v, a) => {
  const theta = v * Math.PI * 0.54;
  const radius = Math.sin(theta) * 1.16 * (1 + Math.cos(a * 24) * 0.018 * v ** 8);
  return new T.Vector3(Math.cos(a) * radius, 0.4 + Math.cos(theta) * 0.99 + Math.cos(a * 24) * 0.033 * v ** 8, Math.sin(a) * radius);
};
function surface() {
  const positions = [], uvs = [], indices = [];
  for (let row = 0; row <= rings; row++) for (let col = 0; col <= radial; col++) {
    const point = bellPoint(row / rings, col / radial * TAU);
    positions.push(point.x, point.y, point.z);
    uvs.push(col / radial, row / rings);
  }
  for (let row = 0; row < rings; row++) for (let col = 0; col < radial; col++) {
    const a = row * (radial + 1) + col, b = a + radial + 1;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function strand(points, radius, segments = 32) {
  return new T.TubeGeometry(new T.CatmullRomCurve3(points), segments, radius, 5, false);
}
function joined(geometries) {
  const combined = mergeGeometries(geometries);
  geometries.forEach(geometry => geometry.dispose());
  return combined;
}
function luminous(color, opacity) {
  return new T.MeshBasicMaterial({ color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
}
function object(geometry, material) {
  const result = new T.Mesh(geometry, material);
  result.castShadow = false;
  result.receiveShadow = false;
  return result;
}
function animatedSurface(count, rows, columns) {
  const positions = new Float32Array(count * (rows + 1) * (columns + 1) * 3), indices = [];
  for (let item = 0; item < count; item++) for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const a = item * (rows + 1) * (columns + 1) + row * (columns + 1) + col, b = a + columns + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage));
  geometry.setIndex(indices);
  return { geometry, positions };
}

export async function create({ preview = false } = {}) {
  const root = new T.Group(), jelly = new T.Group(), cap = new T.Group();
  jelly.name = 'jellyfish';
  cap.name = 'bell';
  root.add(jelly);
  jelly.add(cap);
  const bellMaterial = new T.MeshPhysicalMaterial({
    color: '#91e5ee', emissive: '#16629a', emissiveIntensity: 0.27,
    roughness: 0.26, metalness: 0.02, clearcoat: 0.75, clearcoatRoughness: 0.12,
    transparent: true, opacity: 0.37, transmission: 0.12, thickness: 0.1,
    ior: 1.34, side: T.DoubleSide, depthWrite: false, envMapIntensity: 0.42,
  });
  const shell = surface();
  const bell = object(shell, bellMaterial);
  bell.renderOrder = 5;
  cap.add(bell);
  const haloMaterial = new T.ShaderMaterial({
    uniforms: { cyan: { value: new T.Color('#66f3ff') }, violet: { value: new T.Color('#b777ff') }, strength: { value: 0.52 } },
    vertexShader: `varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vNormal = normalize(normalMatrix * normal); vView = -mv.xyz; vUv = uv; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 cyan; uniform vec3 violet; uniform float strength;
      varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
      void main() { float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
        float lip = smoothstep(0.86, 1.0, vUv.y) * 0.22;
        gl_FragColor = vec4(mix(violet, cyan, vUv.y), (rim * 0.66 + lip) * strength); }`,
    transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide,
  });
  const halo = object(shell, haloMaterial);
  halo.scale.setScalar(1.003);
  halo.renderOrder = 6;
  cap.add(halo);

  // Fine meridional canals, a scalloped skirt, and four visible horseshoe gonads.
  const ribs = [];
  for (let i = 0; i < 24; i++) {
    const points = [];
    for (let j = 0; j <= 20; j++) points.push(bellPoint(0.075 + j / 20 * 0.925, i / 24 * TAU));
    ribs.push(strand(points, i % 3 === 0 ? 0.010 : 0.0065, 28));
  }
  const ribMaterial = luminous('#b7f7ff', 0.5);
  cap.add(object(joined(ribs), ribMaterial));
  const edges = [];
  for (const v of [0.91, 1]) {
    const points = [];
    for (let i = 0; i <= 192; i++) points.push(bellPoint(v, i / 192 * TAU));
    edges.push(strand(points, v === 1 ? 0.017 : 0.009, 192));
  }
  const edgeMaterial = luminous('#65ebff', 0.8);
  cap.add(object(joined(edges), edgeMaterial));
  const organs = [];
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4, points = [];
    for (let j = 0; j <= 28; j++) {
      const q = 0.38 + j / 28 * (TAU - 0.76);
      points.push(new T.Vector3(Math.cos(a) * 0.30 + Math.cos(q) * 0.24, 0.78 + Math.sin(q) * 0.055, Math.sin(a) * 0.30 + Math.sin(q) * 0.24));
    }
    organs.push(strand(points, 0.036, 28));
  }
  const organMaterial = luminous('#da9eff', 0.54);
  cap.add(object(joined(organs), organMaterial));

  const ribbons = animatedSurface(6, 52, 6);
  const ribbonColors = new Float32Array(ribbons.positions.length), pink = new T.Color('#e7b5f4'), cyan = new T.Color('#66c8f0');
  for (let i = 0; i < ribbonColors.length / 3; i++) {
    const color = i % 7 === 0 || i % 7 === 6 ? cyan : pink;
    ribbonColors[i * 3] = color.r;
    ribbonColors[i * 3 + 1] = color.g;
    ribbonColors[i * 3 + 2] = color.b;
  }
  ribbons.geometry.setAttribute('color', new T.BufferAttribute(ribbonColors, 3));
  const ribbonMaterial = new T.MeshStandardMaterial({ color: '#e0bcff', emissive: '#654da4', emissiveIntensity: 0.52, vertexColors: true, roughness: 0.46, transparent: true, opacity: 0.65, side: T.DoubleSide, depthWrite: false });
  const oralArms = object(ribbons.geometry, ribbonMaterial);
  oralArms.frustumCulled = false;
  jelly.add(oralArms);
  const threads = animatedSurface(20, 48, 5);
  const threadMaterial = luminous('#87e8ff', 0.62);
  const tentacles = object(threads.geometry, threadMaterial);
  tentacles.frustumCulled = false;
  jelly.add(tentacles);

  function deform(time = 0, energy = 1) {
    let offset = 0;
    for (let arm = 0; arm < 6; arm++) {
      const a = arm / 6 * TAU;
      for (let row = 0; row <= 52; row++) {
        const u = row / 52, phase = time * 0.68 + arm * 1.8;
        const x = Math.cos(a) * (0.31 + u * 0.1) + Math.sin(u * 6.8 + phase) * u * 0.21 * energy;
        const z = Math.sin(a) * (0.31 + u * 0.1) + Math.cos(u * 5.6 + phase) * u * 0.17 * energy;
        const twist = a + u * 8.4 + Math.sin(phase + u * 4) * 0.2;
        const width = (0.075 + Math.sin(u * Math.PI) * 0.125) * (1 - u * 0.78);
        for (let col = 0; col <= 6; col++) {
          const side = col / 3 - 1;
          const ruffle = Math.sin(u * 47 + arm + time * 0.56) * side ** 2 * width * 0.85;
          ribbons.positions[offset++] = x + Math.cos(twist) * side * width;
          ribbons.positions[offset++] = 0.70 - u * (2.5 + arm % 3 * 0.19) + ruffle;
          ribbons.positions[offset++] = z + Math.sin(twist) * side * width;
        }
      }
    }
    ribbons.geometry.attributes.position.needsUpdate = true;
    ribbons.geometry.computeVertexNormals();
    offset = 0;
    for (let thread = 0; thread < 20; thread++) {
      const a = thread / 20 * TAU, length = 2.25 + (Math.sin(thread * 2.31) * 0.5 + 0.5) * 1.32;
      for (let row = 0; row <= 48; row++) {
        const u = row / 48, phase = time * 0.56 + thread * 0.73;
        const spread = 1.14 - u * 0.37;
        const x = Math.cos(a) * spread + (Math.sin(u * 7 + phase) - Math.sin(phase)) * u * 0.16 * energy;
        const z = Math.sin(a) * spread + (Math.cos(u * 6.5 + phase) - Math.cos(phase)) * u * 0.16 * energy;
        for (let col = 0; col <= 5; col++) {
          const q = col / 5 * TAU, radius = (0.0105 - 0.007 * u) * (thread % 4 === 0 ? 1.3 : 1);
          threads.positions[offset++] = x + Math.cos(q) * radius;
          threads.positions[offset++] = 0.275 - length * u + Math.cos(a * 24) * 0.033;
          threads.positions[offset++] = z + Math.sin(q) * radius;
        }
      }
    }
    threads.geometry.attributes.position.needsUpdate = true;
    const breath = Math.sin(time * 1.12) * 0.035;
    cap.scale.set(1 + breath, 1 - breath * 0.65, 1 + breath);
  }
  deform(0);
  threads.geometry.computeVertexNormals();
  // Only the hero exists here; story companions are added after camera normalization.
  if (preview) jelly.rotation.z = -0.11;
  return {
    root, angle: [2.2, 1.5, 6.5],
    parts: { jelly, cap, bellMaterial, ribMaterial, edgeMaterial, organMaterial, ribbonMaterial, threadMaterial, haloMaterial, deform },
    update(time, _dt, context = {}) { deform(context.reduced ? 0 : time); },
    credit: 'Original procedural jellyfish, ribbon surfaces and light particles · Object Lab',
  };
}
