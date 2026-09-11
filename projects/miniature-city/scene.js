import {
  T,
  mat,
  metal,
  box,
  cylinder,
  sphere,
  label,
} from '../../shared/geometry.js';
import { surface, microfinish } from '../../shared/materials.js';
export async function create({ preview = false, scene, lights } = {}) {
  const root = new T.Group();
  const lawn = mat('#87a37c', 0.9),
    pavement = await surface(mat('#eee8dc', 0.9), 'stone', {
      repeat: [2, 2],
      strength: 0.3,
    }),
    road = microfinish(mat('#3e484b', 0.95), 380, 0.07);
  root.add(box(5.7, 0.3, 5.7, mat('#c9c5ac'), [0, -0.22, 0], 0.3));
  root.add(box(5.6, 0.09, 5.6, lawn, [0, -0.025, 0], 0.25));
  root.add(box(0.8, 0.035, 5.6, road, [0, 0.04, 0]));
  root.add(box(5.6, 0.035, 0.8, road, [0, 0.041, 0]));
  for (let n = -2; n <= 2; n++) {
    root.add(box(0.06, 0.008, 0.27, mat('#e4dfbd'), [0, 0.065, n]));
    root.add(box(0.27, 0.008, 0.06, mat('#e4dfbd'), [n, 0.066, 0]));
  }
  for (const side of [-1, 1])
    for (let n = 0; n < 5; n++) {
      root.add(
        box(0.055, 0.008, 0.42, mat('#e8e7d3'), [
          side * 0.66 + n * 0.07 * side,
          0.068,
          0,
        ]),
      );
      root.add(
        box(0.42, 0.008, 0.055, mat('#e8e7d3'), [
          0,
          0.068,
          side * 0.66 + n * 0.07 * side,
        ]),
      );
    }
  const windowMaterial = new T.MeshPhysicalMaterial({
    color: '#354d5c',
    metalness: 0.32,
    roughness: 0.14,
    clearcoat: 1,
    emissive: '#f1bd65',
    emissiveIntensity: 0,
  });
  const buildingData = [
    ['Corner café', -1.6, -1.6, 1.0, '#d99b72'],
    ['Cinema', 1.6, -1.6, 1.4, '#b7ad93'],
    ['Design studio', -1.6, 1.6, 1.8, '#d7d8c7'],
    ['Bookshop', 1.6, 1.6, 0.85, '#bd8777'],
  ];
  const facades = await Promise.all(
    buildingData.map((data) =>
      surface(mat(data[4], 0.85), 'stone', {
        repeat: [0.8, 0.8],
        strength: 0.3,
      }),
    ),
  );
  const trim = mat('#e0dfd3', 0.72),
    frames = metal('#555c58');
  const buildings = [];
  buildingData.forEach(([name, x, z, height], index) => {
    root.add(box(1.65, 0.07, 1.65, pavement, [x, 0.06, z], 0.08));
    const b = new T.Group();
    b.position.set(x, 0.14, z);
    b.userData.name = name;
    b.add(box(1.15, height, 1.15, facades[index], [0, height / 2, 0], 0.025));
    for (const side of [-1, 1]) {
      b.add(
        box(1.18, 0.06, 0.06, trim, [0, height - 0.03, side * 0.565], 0.009),
      );
      b.add(
        box(0.06, 0.06, 1.18, trim, [side * 0.565, height - 0.03, 0], 0.009),
      );
      root.add(box(1.65, 0.045, 0.07, trim, [x, 0.1, z + side * 0.8], 0.012));
    }
    b.add(box(1.23, 0.12, 1.23, mat('#677477'), [0, height + 0.06, 0], 0.025));
    b.add(
      box(0.22, 0.18, 0.35, mat('#a3aba4'), [0.28, height + 0.2, 0.18], 0.02),
    );
    for (let i = 0; i < 6; i++)
      b.add(
        box(
          0.2,
          0.006,
          0.012,
          frames,
          [0.28, height + 0.294, 0.05 + i * 0.045],
          0.001,
        ),
      );
    b.add(cylinder(0.048, 0.23, frames, [-0.33, height + 0.2, -0.29]));
    b.add(cylinder(0.075, 0.025, frames, [-0.33, height + 0.32, -0.29]));
    for (let floor = 0; floor < Math.floor(height / 0.35); floor++)
      for (let column = 0; column < 3; column++)
        for (const side of [-1, 1]) {
          b.add(
            box(
              0.208,
              0.228,
              0.022,
              frames,
              [(column - 1) * 0.31, floor * 0.35 + 0.23, side * 0.579],
              0.008,
            ),
          );
          b.add(
            box(
              0.022,
              0.228,
              0.208,
              frames,
              [side * 0.579, floor * 0.35 + 0.23, (column - 1) * 0.31],
              0.008,
            ),
          );
          b.add(
            box(
              0.18,
              0.2,
              0.014,
              windowMaterial,
              [(column - 1) * 0.31, floor * 0.35 + 0.23, side * 0.592],
              0.007,
            ),
          );
          b.add(
            box(
              0.014,
              0.2,
              0.18,
              windowMaterial,
              [side * 0.592, floor * 0.35 + 0.23, (column - 1) * 0.31],
              0.007,
            ),
          );
          b.add(
            box(
              0.235,
              0.025,
              0.06,
              trim,
              [(column - 1) * 0.31, floor * 0.35 + 0.12, side * 0.597],
              0.006,
            ),
          );
          b.add(
            box(
              0.06,
              0.025,
              0.235,
              trim,
              [side * 0.597, floor * 0.35 + 0.12, (column - 1) * 0.31],
              0.006,
            ),
          );
          b.add(
            box(
              0.01,
              0.2,
              0.008,
              frames,
              [(column - 1) * 0.31, floor * 0.35 + 0.23, side * 0.604],
              0.001,
            ),
          );
        }
    if (index === 0) {
      b.add(box(1.15, 0.07, 0.35, mat('#68866a'), [0, 0.4, 0.69], 0.02));
      for (let k = 0; k < 5; k++)
        b.add(
          box(
            0.09,
            0.03,
            0.35,
            mat('#f0e3c7'),
            [-0.46 + k * 0.23, 0.443, 0.69],
            0.003,
          ),
        );
    }
    if (index === 1) {
      b.add(box(1.0, 0.23, 0.055, mat('#da9a55'), [0, 0.5, 0.625], 0.025));
    }
    const sign = label(
      ['CAFÉ / 04', 'CINEMA', 'ATELIER', 'BOOKS'][index],
      0.86,
      0.14,
      [0, index === 1 ? 0.5 : 0.48, index === 1 ? 0.656 : 0.614],
      {
        width: 1024,
        height: 192,
        size: 105,
        color: '#f6ebd2',
        background: index === 1 ? '#bb7241' : '#364846',
      },
    );
    b.add(sign);
    buildings.push(b);
    root.add(b);
  });
  for (const [x, z] of [
    [-0.75, -2.1],
    [-2.35, -0.8],
    [0.76, 2.2],
    [2.32, 0.8],
    [-2.4, 2.28],
    [2.3, -2.32],
  ]) {
    root.add(cylinder(0.035, 0.43, mat('#79644a'), [x, 0.27, z]));
    const leaves = new T.InstancedMesh(
      new T.SphereGeometry(0.053, 8, 6),
      mat('#527650', 0.9),
      96,
    );
    const leaf = new T.Object3D();
    for (let i = 0; i < 96; i++) {
      const phi = i * 2.39996,
        level = 1 - (2 * (i + 0.5)) / 96;
      const radius =
        Math.sqrt(1 - level * level) * (0.2 + Math.sin(i * 12.9) * 0.02);
      leaf.position.set(
        x + Math.cos(phi) * radius,
        0.6 + level * 0.29,
        z + Math.sin(phi) * radius,
      );
      leaf.scale.setScalar(0.8 + (i % 5) * 0.13);
      leaf.updateMatrix();
      leaves.setMatrixAt(i, leaf.matrix);
      leaves.setColorAt(
        i,
        new T.Color().setHSL(
          0.25 + (i % 3) * 0.017,
          0.2,
          0.3 + (i % 7) * 0.025,
        ),
      );
    }
    leaves.castShadow = leaves.receiveShadow = true;
    root.add(leaves);
    root.add(box(0.34, 0.055, 0.34, pavement, [x, 0.06, z], 0.06));
  }
  const cars = [];
  for (const [x, z, color] of [
    [-0.22, -1.6, '#c66e52'],
    [1.6, 0.22, '#dccc7c'],
  ]) {
    const car = new T.Group();
    car.add(box(0.2, 0.13, 0.4, mat(color), [0, 0.15, 0], 0.04));
    car.add(box(0.17, 0.1, 0.2, mat('#415a5a'), [0, 0.24, 0.02], 0.03));
    for (const wx of [-0.103, 0.103])
      for (const wz of [-0.12, 0.12]) {
        const wheel = cylinder(0.052, 0.035, mat('#222929'), [wx, 0.09, wz]);
        wheel.rotation.z = Math.PI / 2;
        car.add(wheel);
      }
    for (const lx of [-0.065, 0.065])
      car.add(
        box(0.048, 0.025, 0.018, mat('#eeecce'), [lx, 0.16, -0.198], 0.007),
      );
    car.position.set(x, 0, z);
    if (x > 0) car.rotation.y = Math.PI / 2;
    cars.push(car);
    root.add(car);
  }
  const lampMaterial = new T.MeshStandardMaterial({
    color: '#eee3bd',
    emissive: '#ffd291',
    emissiveIntensity: 0.3,
  });
  for (const [x, z] of [
    [-0.55, -0.65],
    [0.55, 0.65],
    [-0.55, 2.4],
    [2.4, 0.55],
  ]) {
    root.add(cylinder(0.016, 0.6, mat('#59605a'), [x, 0.3, z]));
    root.add(sphere(0.05, lampMaterial, [x, 0.63, z]));
  }
  let night = 0,
    selected = -1,
    traffic = true;
  function select(i) {
    selected = i;
    if (!preview) {
      const node = document.querySelector('.studio-help');
      if (node)
        node.textContent =
          buildingData[i][0] + ' · Drag to explore the neighborhood';
    }
  }
  return {
    root,
    parts: { buildings, cars, windowMaterial, lampMaterial, lawn },
    angle: [5, 4.5, 5],
    controls: [
      {
        type: 'range',
        label: 'Time of day',
        start: 'Daylight',
        end: 'Nightfall',
        change: (v) => (night = v),
      },
      {
        type: 'choice',
        label: 'Around the block',
        options: [
          { label: 'Café', value: 0 },
          { label: 'Cinema', value: 1 },
          { label: 'Studio', value: 2 },
          { label: 'Books', value: 3 },
        ],
        change: select,
      },
      {
        type: 'choice',
        label: 'Street life',
        options: [
          { label: 'Moving', value: true },
          { label: 'Still', value: false },
        ],
        change: (v) => (traffic = v),
        note: 'Click a building to discover it.',
      },
    ],
    pick: (hits) => {
      let node = hits[0]?.object;
      while (node && !node.userData.name) node = node.parent;
      const i = buildings.indexOf(node);
      if (i >= 0) select(i);
    },
    update: (t, dt) => {
      windowMaterial.emissiveIntensity = night * 3;
      lampMaterial.emissiveIntensity = 0.3 + night * 5;
      windowMaterial.color.set(night > 0.5 ? '#dfb966' : '#596c71');
      if (scene) {
        scene.background?.set('#e1e8e2').lerp(new T.Color('#1a283a'), night);
        scene.environmentIntensity = 1 - night * 0.85;
        lights.key.intensity = 2.7 - night * 2.3;
        lights.rim.intensity = 1.4 - night * 0.9;
        scene.children.find((n) => n.isHemisphereLight).intensity =
          0.42 - night * 0.3;
      }
      buildings.forEach(
        (b, i) =>
          (b.position.y = T.MathUtils.damp(
            b.position.y,
            i === selected ? 0.24 : 0.14,
            7,
            dt,
          )),
      );
      if (traffic) {
        cars[0].position.z = ((t * 0.4 + 1) % 5) - 2.5;
        cars[1].position.x = 2.5 - ((t * 0.35 + 3) % 5);
      }
    },
    credit: 'Original procedural neighborhood · Object Lab',
  };
}
