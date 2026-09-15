import { T, mat, metal, box, cylinder, torus, sphere, label, mesh } from '../../shared/geometry.js';
import { microfinish } from '../../shared/materials.js';

// A hollow machined sleeve, with its optical axis pointing toward +Z.
function sleeve(radius, inner, depth, material, z = 0) {
  const profile = [
    [inner, -depth / 2], [radius - 0.015, -depth / 2],
    [radius, -depth / 2 + 0.015], [radius, depth / 2 - 0.015],
    [radius - 0.015, depth / 2], [inner, depth / 2], [inner, -depth / 2],
  ].map(([x, y]) => new T.Vector2(x, y));
  return mesh(new T.LatheGeometry(profile, 64), material, [0, 0, z], [Math.PI / 2, 0, 0]);
}

function knurl(radius, depth, material, count = 72) {
  const geometry = new T.BoxGeometry(0.024, 0.025, depth);
  const instance = new T.InstancedMesh(geometry, material, count);
  const dummy = new T.Object3D();
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2;
    dummy.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    dummy.rotation.z = a;
    dummy.updateMatrix();
    instance.setMatrixAt(i, dummy.matrix);
  }
  instance.castShadow = true;
  instance.receiveShadow = true;
  return instance;
}

export async function create({ preview = false } = {}) {
  const root = new T.Group(), body = new T.Group(), lens = new T.Group();
  root.add(body, lens);
  const silver = microfinish(metal('#d2cfc6'), 210, 0.055);
  const darkMetal = microfinish(mat('#242626', 0.31, 0.78), 130, 0.065);
  const leather = microfinish(mat('#171d1b', 0.86, 0), 92, 0.4);
  const rubber = mat('#111a19', 0.64, 0.15), brass = metal('#bd9356');
  const red = mat('#eb3e24', 0.32, 0.25), black = mat('#080d0d', 0.85);
  const glass = new T.MeshPhysicalMaterial({
    color: '#739d9e', roughness: 0.07, metalness: 0.18,
    transmission: 0.55, thickness: 0.24, ior: 1.52,
    clearcoat: 1, iridescence: 0.75, iridescenceIOR: 1.3,
  });
  body.add(box(4.35, 2.52, 1.28, darkMetal, [0, 0, 0], 0.22));
  body.add(box(4.42, 0.48, 1.35, silver, [0, 1.02, 0], 0.16));
  body.add(box(4.38, 0.15, 1.32, silver, [0, -1.2, 0], 0.09));
  body.add(box(4.2, 1.8, 0.14, leather, [0, -0.12, 0.67], 0.13));
  body.add(box(4.18, 1.75, 0.12, leather, [0, -0.12, -0.665], 0.1));
  body.add(box(0.58, 1.84, 0.39, leather, [1.76, -0.13, 0.78], 0.2));
  body.add(box(0.055, 1.9, 0.035, darkMetal, [-1.98, -0.1, 0.758], 0.01));
  body.add(box(0.055, 1.9, 0.035, darkMetal, [1.39, -0.1, 0.758], 0.01));
  // The rangefinder and metering windows sit above the lens, without brand assets.
  body.add(box(1.05, 0.36, 0.1, darkMetal, [-1.43, 1.02, 0.71], 0.065));
  body.add(box(0.87, 0.22, 0.035, glass, [-1.43, 1.02, 0.777], 0.035));
  body.add(box(0.5, 0.3, 0.09, darkMetal, [0.75, 1.02, 0.715], 0.055));
  body.add(box(0.37, 0.18, 0.03, glass, [0.75, 1.02, 0.777], 0.025));
  body.add(label('LIGHT / LEAK', 1.08, 0.16, [-0.2, 1.04, 0.718], {
    color: '#333b35', width: 768, height: 160, size: 72, font: 'Arial',
  }));
  body.add(label('L / 35', 0.51, 0.15, [-1.48, 0.5, 0.773], {
    color: '#cdc6af', width: 384, height: 120, size: 64, weight: '400',
  }));
  body.add(sphere(0.074, red, [1.15, 1.025, 0.738], [1, 1, 0.35]));
  for (const x of [-1.47, 1.52]) {
    body.add(cylinder(0.34, 0.1, darkMetal, [x, 1.3, -0.02]));
    body.add(cylinder(0.31, 0.21, silver, [x, 1.39, -0.02]));
    const teeth = knurl(0.31, 0.16, silver, 48);
    teeth.rotation.x = Math.PI / 2;
    teeth.position.set(x, 1.39, -0.02);
    body.add(teeth);
    body.add(cylinder(0.18, 0.015, darkMetal, [x, 1.505, -0.02]));
    const dial = label(x < 0 ? 'ISO 400' : '125', 0.28, 0.15, [x, 1.518, -0.02], {
      color: '#eadfc6', width: 384, height: 200, size: 77, weight: '400',
    });
    dial.rotation.x = -Math.PI / 2;
    body.add(dial);
  }
  body.add(cylinder(0.12, 0.1, silver, [0.93, 1.31, 0.32]));
  const release = cylinder(0.088, 0.04, red, [0.93, 1.38, 0.32]);
  body.add(release);
  const advance = box(0.74, 0.08, 0.16, silver, [1.59, 1.54, 0.08], 0.04);
  advance.rotation.y = -0.24;
  body.add(advance, box(0.38, 0.11, 0.2, rubber, [1.96, 1.54, 0.17], 0.06));
  body.add(box(0.55, 0.045, 0.42, darkMetal, [-0.12, 1.277, -0.05], 0.02));
  for (const x of [-0.33, 0.09]) body.add(box(0.055, 0.05, 0.43, silver, [x, 1.31, -0.05], 0.008));
  for (const x of [-2.24, 2.24]) {
    body.add(box(0.15, 0.32, 0.36, silver, [x, 0.64, 0.1], 0.05));
    body.add(torus(0.17, 0.032, darkMetal, [x * 1.032, 0.58, 0.12], [0, Math.PI / 2, 0]));
  }
  for (const [x, y] of [[-2, 1.05], [1.98, 1.05], [-1.97, -1.2], [1.97, -1.2]]) {
    const screw = cylinder(0.033, 0.018, silver, [x, y, 0.689]);
    screw.rotation.x = Math.PI / 2;
    body.add(screw, box(0.034, 0.004, 0.003, darkMetal, [x, y, 0.702], 0.001));
  }
  body.add(box(0.36, 0.75, 0.045, darkMetal, [1.77, 0.05, -0.75], 0.07));
  body.add(box(0.16, 0.46, 0.06, silver, [1.77, 0.05, -0.786], 0.03));
  body.add(box(0.75, 0.55, 0.045, silver, [-0.9, 0.17, -0.744], 0.05));
  const backLabel = label('35 mm\n36 EXP', 0.53, 0.32, [-0.9, 0.17, -0.779], {
    color: '#28342b', width: 384, height: 256, size: 65,
  });
  backLabel.rotation.y = Math.PI;
  body.add(backLabel);

  lens.position.set(-0.12, -0.12, 0);
  const mount = sleeve(0.93, 0.67, 0.11, silver, 0.825);
  lens.add(mount, sleeve(0.86, 0.67, 0.24, darkMetal, 0.98));
  const layers = [], homes = [];
  for (let i = 0; i < 4; i++) {
    const part = new T.Group(), radius = 0.86 - i * 0.064;
    part.position.z = 1.2 + i * 0.24;
    part.add(sleeve(radius, radius - 0.105, i === 0 ? 0.25 : 0.15, i % 2 ? darkMetal : silver));
    part.add(knurl(radius, i === 0 ? 0.17 : 0.095, i % 2 ? darkMetal : silver));
    part.add(sleeve(radius - 0.054, radius - 0.082, 0.018, brass, 0.085));
    if (i > 0) {
      const optic = sphere(radius - 0.11, glass, [0, 0, 0.035], [1, 1, 0.13]);
      optic.castShadow = false;
      part.add(optic);
    }
    layers.push(part);
    homes.push(part.position.z);
    lens.add(part);
  }
  // Engraved focus marks share a single geometry through instancing.
  const ticks = new T.InstancedMesh(new T.BoxGeometry(0.015, 0.06, 0.01), mat('#e9dfc9', 0.6), 24);
  const mark = new T.Object3D();
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    mark.position.set(Math.sin(a) * 0.787, Math.cos(a) * 0.787, 0.141);
    mark.rotation.z = -a;
    mark.updateMatrix();
    ticks.setMatrixAt(i, mark.matrix);
  }
  layers[0].add(ticks);
  layers[3].add(label('35 / 1.8', 0.46, 0.09, [0, -0.556, 0.087], {
    color: '#dad5bf', width: 512, height: 128, size: 64, weight: '400',
  }));
  layers[0].add(sphere(0.033, red, [0, 0.824, 0.128], [1, 1, 0.5]));

  const iris = new T.Group();
  iris.position.z = 1.17;
  iris.add(sleeve(0.655, 0.56, 0.052, brass));
  const irisBackdrop = mesh(new T.CircleGeometry(0.558, 64), black, [0, 0, -0.025]);
  iris.add(irisBackdrop);
  const blades = [];
  const bladeMaterial = microfinish(mat('#56605b', 0.38, 0.75), 170, 0.1);
  for (let i = 0; i < 8; i++) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(18), 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]);
    const finish = bladeMaterial.clone();
    finish.color.multiplyScalar(0.92 + (i % 4) * 0.065);
    const blade = mesh(geometry, finish, [0, 0, i * 0.0015]);
    iris.add(blade);
    blades.push(blade);
  }
  lens.add(iris);
  // The blades form a clean octagonal aperture at every scroll position.
  function setAperture(open) {
    const inner = 0.045 + open * 0.41;
    blades.forEach((blade, i) => {
      const a = i / 8 * Math.PI * 2, step = Math.PI / 4;
      const vertices = [
        [0.557, a], [0.557, a + step * 0.5], [0.557, a + step],
        [inner, a + step + 0.19], [inner, a + 0.19], [0.557, a],
      ];
      const attribute = blade.geometry.attributes.position;
      vertices.forEach(([r, angle], j) => attribute.setXYZ(j, Math.cos(angle) * r, Math.sin(angle) * r, 0));
      attribute.needsUpdate = true;
      blade.geometry.computeVertexNormals();
      blade.geometry.computeBoundingSphere();
    });
  }
  setAperture(0.3);
  if (preview) root.rotation.set(-0.1, -0.18, 0);
  return {
    root,
    parts: { body, lens, layers, homes, iris, blades, setAperture, release },
    angle: [3.2, 2.1, 6.5],
    credit: 'Original procedural film camera and miniature film scenes.',
  };
}

function flatPolygon(points, material, position = [0, 0, 0]) {
  const shape = new T.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  return mesh(new T.ShapeGeometry(shape), material, position);
}

// Each exposure is a tiny stage made from geometry, not a downloaded photograph.
export function createFilm() {
  const root = new T.Group(), frames = [];
  const emulsion = mat('#291c13', 0.32, 0.2);
  const edge = mat('#c98737', 0.43, 0.3);
  const cream = mat('#f5dcb2', 0.81), sand = mat('#d56b44', 0.8);
  const ink = mat('#163735', 0.72), sage = mat('#58736b', 0.75);
  const water = mat('#65999a', 0.48, 0.12), peach = mat('#efb18b', 0.82);
  const palette = [peach, water, cream, sage, peach];
  for (let i = 0; i < 5; i++) {
    const frame = new T.Group();
    const shape = new T.Shape();
    shape.moveTo(-0.635, -0.725); shape.lineTo(0.635, -0.725);
    shape.lineTo(0.635, 0.725); shape.lineTo(-0.635, 0.725); shape.closePath();
    for (const y of [-0.628, 0.628]) {
      for (let j = 0; j < 7; j++) {
        const x = -0.535 + j * 0.178;
        const hole = new T.Path();
        hole.moveTo(x - 0.038, y - 0.045); hole.lineTo(x - 0.038, y + 0.045);
        hole.lineTo(x + 0.038, y + 0.045); hole.lineTo(x + 0.038, y - 0.045); hole.closePath();
        shape.holes.push(hole);
      }
    }
    const film = mesh(new T.ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false }), emulsion);
    frame.add(film);
    frame.add(box(1.12, 1.055, 0.019, edge, [0, 0, 0.012], 0.013));
    frame.add(box(1.06, 0.988, 0.021, palette[i], [0, 0, 0.028], 0.006));
    const sun = mesh(new T.CircleGeometry(i === 4 ? 0.09 : 0.16, 32), cream, [0.23, 0.23, 0.047]);
    frame.add(sun);
    if (i === 0 || i === 2) {
      frame.add(flatPolygon([[-0.53, -0.18], [-0.23, 0.2], [0.13, -0.14], [0.39, 0.04], [0.53, -0.17], [0.53, -0.48], [-0.53, -0.48]], i === 0 ? sand : sage, [0, 0, 0.052]));
      frame.add(flatPolygon([[-0.53, -0.32], [-0.2, -0.13], [0.11, -0.31], [0.53, -0.08], [0.53, -0.49], [-0.53, -0.49]], i === 0 ? ink : water, [0, 0, 0.062]));
      if (i === 2) {
        frame.add(box(0.035, 0.45, 0.035, ink, [-0.27, -0.09, 0.092], 0.004));
        frame.add(flatPolygon([[-0.46, -0.13], [-0.27, 0.34], [-0.08, -0.13]], ink, [0, 0, 0.12]));
      }
    } else if (i === 1) {
      for (let j = 0; j < 5; j++) {
        const height = 0.33 + ((j * 3) % 5) * 0.07;
        const x = -0.42 + j * 0.21;
        frame.add(box(0.17, height, 0.06, j % 2 ? sand : ink, [x, -0.47 + height / 2, 0.073], 0.004));
        for (let k = 0; k < 3; k++) frame.add(box(0.04, 0.045, 0.012, cream, [x, -0.38 + k * 0.12, 0.11], 0.003));
      }
    } else if (i === 3) {
      frame.add(box(1.06, 0.26, 0.026, sand, [0, -0.36, 0.052], 0.001));
      for (const x of [-0.31, 0.24]) {
        frame.add(box(0.24, 0.52, 0.08, cream, [x, -0.12, 0.09], 0.01));
        frame.add(mesh(new T.CircleGeometry(0.12, 32, 0, Math.PI), cream, [x, 0.14, 0.132]));
        frame.add(box(0.13, 0.42, 0.01, ink, [x, -0.12, 0.136], 0.009));
        frame.add(mesh(new T.CircleGeometry(0.065, 32, 0, Math.PI), ink, [x, 0.091, 0.147]));
      }
    } else {
      frame.add(box(1.06, 0.54, 0.023, water, [0, -0.221, 0.052], 0.001));
      frame.add(flatPolygon([[-0.32, -0.09], [-0.02, -0.09], [-0.09, -0.18], [-0.26, -0.18]], ink, [0, 0, 0.08]));
      frame.add(box(0.014, 0.41, 0.022, ink, [-0.17, 0.04, 0.082], 0.002));
      frame.add(flatPolygon([[-0.155, -0.06], [-0.155, 0.23], [0.027, -0.06]], cream, [0, 0, 0.089]));
      for (let j = 0; j < 4; j++) frame.add(box(0.16 + (j % 2) * 0.18, 0.012, 0.012, cream, [0.12 * Math.cos(j * 2.4), -0.25 - j * 0.06, 0.079], 0.004));
    }
    frame.add(label(`${String(i + 1).padStart(2, '0')}   LIGHT / LEAK   400`, 1.03, 0.065, [0, -0.55, 0.025], {
      color: '#e2a247', width: 768, height: 80, size: 47, weight: '400',
    }));
    root.add(frame);
    frames.push(frame);
  }
  return { root, frames };
}
