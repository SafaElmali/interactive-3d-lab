import { T } from '../../shared/geometry.js';
import { smooth, mix } from '../../shared/choreography.js';

const S = 1.3;
const vec = (p) => new T.Vector3(...p);
const between = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
const CORNERS = [
  [0, 0, S],
  [S, 0, 0],
  [0, 0, -S],
  [-S, 0, 0],
];
const BODY = [
  [-0.22, 0.02, 0.5],
  [0.22, 0.02, 0.5],
  [0.22, 0.02, -0.5],
  [-0.22, 0.02, -0.5],
];

// Every surface starts in the same square. The outer triangles really rotate
// about their original crease axes before their vertices resolve into a crane.
function paperPattern() {
  const vertices = [];
  const triangle = (part, a, b, c) => {
    const normal = vec(b.flat).sub(vec(a.flat)).cross(vec(c.flat).sub(vec(a.flat)));
    for (const point of normal.y < 0 ? [a, c, b] : [a, b, c])
      vertices.push({ ...point, part });
  };
  const point = (flat, final) => ({ flat, final });
  const center = point([0, 0, 0], [0, 0.48, -0.03]);
  for (let i = 0; i < 4; i++)
    triangle(-1, center, point(CORNERS[i], BODY[i]), point(CORNERS[(i + 1) % 4], BODY[(i + 1) % 4]));

  function wing(part, corner, direction) {
    const next = (part + 1) % 4;
    const a = point(CORNERS[part], BODY[part]);
    const b = point(CORNERS[next], BODY[next]);
    const c = point(between(a.flat, b.flat, 0.5), [direction * 0.28, 0.31, 0]);
    const tip = point(corner, [direction * 2.12, 0.64, -0.37]);
    const ridge = point(between(c.flat, corner, 0.47), [direction * 1.0, 0.64, -0.14]);
    triangle(part, a, c, ridge);
    triangle(part, c, b, ridge);
    triangle(part, a, ridge, tip);
    triangle(part, ridge, b, tip);
  }
  wing(1, [S, 0, -S], 1);
  wing(3, [-S, 0, S], -1);

  function taperedStrip(part, corner, stations) {
    const next = (part + 1) % 4;
    const rows = stations.map(({ t, y, z, width, ridge }) => {
      const left = between(CORNERS[part], corner, t);
      const right = between(CORNERS[next], corner, t);
      // Follow the winding of the original sheet on opposite sides of the body.
      const sign = part === 0 ? -1 : 1;
      return [
        point(left, [sign * width, y, z]),
        point(between(left, right, 0.5), [0, y + ridge, z]),
        point(right, [-sign * width, y, z]),
      ];
    });
    for (let i = 0; i < rows.length - 1; i++) {
      for (let j = 0; j < 2; j++) {
        triangle(part, rows[i][j], rows[i][j + 1], rows[i + 1][j]);
        // At the pointed tip, one triangle suffices; avoid zero-area faces.
        if (i < rows.length - 2)
          triangle(part, rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
      }
    }
  }
  taperedStrip(0, [S, 0, S], [
    { t: 0, y: 0.02, z: 0.5, width: 0.22, ridge: 0.1 },
    { t: 0.33, y: 0.39, z: 0.65, width: 0.105, ridge: 0.05 },
    { t: 0.63, y: 1.19, z: 0.95, width: 0.057, ridge: 0.035 },
    { t: 0.76, y: 1.35, z: 1.14, width: 0.083, ridge: 0.04 },
    { t: 1, y: 1.06, z: 1.61, width: 0, ridge: 0 },
  ]);
  taperedStrip(2, [-S, 0, -S], [
    { t: 0, y: 0.02, z: -0.5, width: 0.22, ridge: 0.1 },
    { t: 0.43, y: 0.37, z: -0.93, width: 0.095, ridge: 0.055 },
    { t: 1, y: 0.99, z: -1.63, width: 0, ridge: 0 },
  ]);
  return vertices;
}

function makePaper(vertices, source) {
  const root = new T.Group();
  root.name = 'One square of folded paper';
  const colors = ['#f04d31', '#e43b26', '#f45538', '#ec422d', '#db3525'];
  const geometry = source
    ? source.mesh.geometry.clone()
    : new T.BufferGeometry();
  if (!source) {
    geometry.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(vertices.length * 3), 3));
    const shades = [];
    vertices.forEach((_, i) => {
      const shade = new T.Color(colors[Math.floor(i / 3) % colors.length]);
      shades.push(shade.r, shade.g, shade.b);
    });
    geometry.setAttribute('color', new T.Float32BufferAttribute(shades, 3));
  }
  const material = source?.mesh.material ?? new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0,
    side: T.DoubleSide,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const mesh = new T.Mesh(geometry, material);
  mesh.name = 'Vermilion paper facets';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  const edgesGeometry = source
    ? source.edges.geometry.clone()
    : new T.BufferGeometry();
  if (!source)
    edgesGeometry.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(vertices.length * 6), 3));
  const edges = new T.LineSegments(edgesGeometry, source?.edges.material ?? new T.LineBasicMaterial({
    color: '#962e20',
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  }));
  edges.name = 'Fine fold lines';
  root.add(edges);
  const axes = CORNERS.map((v, i) => vec(CORNERS[(i + 1) % 4]).sub(vec(v)).normalize());
  const vertex = new T.Vector3();
  const target = new T.Vector3();
  const wingAxis = new T.Vector3(0, 0, 1);
  function fold(crease, resolve, flutter = 0) {
    const positions = geometry.attributes.position;
    vertices.forEach((data, i) => {
      vertex.set(...data.flat);
      if (data.part === -1) {
        vertex.y = data.flat[0] === 0 && data.flat[2] === 0 ? crease * 0.32 : 0;
      } else {
        const hinge = vec(CORNERS[data.part]);
        vertex.sub(hinge).applyAxisAngle(axes[data.part], -crease * 1.02).add(hinge);
      }
      target.set(...data.final);
      if (data.part === 1 || data.part === 3) {
        const side = data.part === 1 ? 1 : -1;
        const hinge = new T.Vector3(side * 0.22, 0.02, 0);
        target.sub(hinge).applyAxisAngle(wingAxis, flutter * side).add(hinge);
      }
      vertex.lerp(target, resolve);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    });
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    const edgePositions = edgesGeometry.attributes.position;
    let index = 0;
    for (let i = 0; i < positions.count; i += 3)
      for (const [a, b] of [[0, 1], [1, 2], [2, 0]])
        for (const n of [i + a, i + b])
          edgePositions.setXYZ(index++, positions.getX(n), positions.getY(n), positions.getZ(n));
    edgePositions.needsUpdate = true;
    edgesGeometry.computeBoundingSphere();
    edgesGeometry.computeBoundingBox();
  }
  fold(1, 1);
  return { root, mesh, edges, fold };
}

export async function create({ preview = false } = {}) {
  const vertices = paperPattern();
  const hero = makePaper(vertices);
  const root = new T.Group();
  root.add(hero.root);
  const flock = [];
  if (!preview) {
    for (let i = 0; i < 7; i++) {
      const bird = makePaper(vertices, hero);
      bird.root.name = `Companion crane ${i + 1}`;
      bird.root.visible = false;
      bird.root.scale.setScalar(0.0001);
      root.add(bird.root);
      flock.push(bird);
    }
  }
  return {
    root,
    angle: [4.8, 3.4, 6],
    parts: { hero, flock },
    credit: 'Original procedural origami · A single square, folded into flight',
    update(time, _delta, context = {}) {
      const t = context.reduced ? 0 : time;
      hero.fold(1, 1, Math.sin(t * 1.25) * 0.035);
    },
  };
}

export function foldAtProgress(hero, progress, time, reduced = false) {
  const crease = smooth(0.04, 0.32, progress);
  const resolve = smooth(0.34, 0.64, progress);
  const airborne = smooth(0.72, 0.93, progress);
  const flutter = reduced ? 0 : Math.sin(time * 1.6 + progress * 4) * 0.09 * airborne;
  hero.fold(crease, resolve, flutter);
}
