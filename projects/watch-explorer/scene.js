import {
  T,
  mat,
  metal,
  box,
  cylinder,
  torus,
  label,
  lathe,
} from '../../shared/geometry.js';
import { surface, microfinish } from '../../shared/materials.js';
export async function create() {
  const root = new T.Group(),
    caseGroup = new T.Group(),
    face = new T.Group(),
    crystal = new T.Group();
  root.add(caseGroup, face, crystal);
  const steel = microfinish(metal('#c9cdd0'), 220, 0.045),
    strap = await surface(mat('#434d40', 0.8), 'leather', {
      color: false,
      repeat: [2.5, 2.5],
      strength: 0.45,
    }),
    dial = microfinish(mat('#ede9da', 0.38, 0.28), 450, 0.07),
    accent = metal('#ad8753');
  strap.clearcoat = 0.18;
  strap.clearcoatRoughness = 0.45;
  dial.anisotropy = 0.7;
  const lining = mat('#9b7955', 0.85),
    thread = mat('#b3b39b', 0.85);
  for (const direction of [-1, 1]) {
    const band = box(1.1, 0.16, 1.8, strap, [0, 0, direction * 1.72], 0.13);
    caseGroup.add(band);
    caseGroup.add(
      box(1.065, 0.035, 1.77, lining, [0, -0.092, direction * 1.72], 0.12),
    );
    caseGroup.add(
      box(1.08, 0.055, 0.22, strap, [0, 0.095, direction * 1.24], 0.04),
    );
    for (let i = 0; i < 9; i++) {
      const stitch = box(
        0.012,
        0.008,
        0.095,
        thread,
        [-0.44, 0.085, direction * (1.0 + i * 0.18)],
        0.002,
      );
      caseGroup.add(stitch);
      const other = stitch.clone();
      other.position.x = 0.44;
      caseGroup.add(other);
    }
    for (const x of [-0.51, 0.51])
      caseGroup.add(
        box(0.18, 0.24, 0.7, steel, [x, 0.02, direction * 1.04], 0.06),
      );
  }
  for (let i = 0; i < 4; i++)
    caseGroup.add(
      cylinder(0.035, 0.02, mat('#161e18'), [0, 0.091, 1.43 + i * 0.27]),
    );
  caseGroup.add(box(0.96, 0.12, 0.12, steel, [0, 0.1, -2.54], 0.035));
  for (const x of [-0.48, 0.48])
    caseGroup.add(box(0.09, 0.12, 0.38, steel, [x, 0.1, -2.39], 0.035));
  caseGroup.add(box(0.045, 0.05, 0.37, steel, [0, 0.15, -2.4], 0.018));
  caseGroup.add(
    lathe(
      [
        [0, -0.06],
        [0.95, -0.06],
        [0.99, -0.035],
        [1, 0.21],
        [0.99, 0.25],
        [0.92, 0.26],
        [0.87, 0.23],
        [0.87, 0.16],
        [0, 0.16],
      ],
      steel,
    ),
  );
  caseGroup.add(torus(0.96, 0.07, steel, [0, 0.28, 0]));
  caseGroup.add(torus(1.001, 0.009, mat('#2d363c'), [0, 0.13, 0]));
  caseGroup.add(torus(0.922, 0.012, metal('#e2e5df'), [0, 0.325, 0]));
  caseGroup.add(
    cylinder(
      0.87,
      0.018,
      microfinish(metal('#8b9294'), 350, 0.08),
      [0, 0.18, 0],
    ),
  );
  const crown = cylinder(0.13, 0.19, steel, [1.06, 0.13, 0]);
  crown.rotation.z = Math.PI / 2;
  caseGroup.add(crown);
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const ridge = cylinder(0.006, 0.13, steel, [
      1.08,
      0.13 + Math.sin(a) * 0.13,
      Math.cos(a) * 0.13,
    ]);
    ridge.rotation.z = Math.PI / 2;
    caseGroup.add(ridge);
  }
  face.add(cylinder(0.91, 0.025, dial, [0, 0.28, 0]));
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const mark = box(
      i % 5 === 0 ? 0.035 : 0.012,
      0.015,
      i % 5 === 0 ? 0.12 : 0.055,
      i % 5 === 0 ? steel : mat('#44483d'),
      [Math.sin(angle) * 0.8, 0.3, Math.cos(angle) * 0.8],
      0.001,
    );
    mark.rotation.y = angle;
    face.add(mark);
    if (i % 5 === 0) {
      const lume = box(
        0.018,
        0.005,
        0.065,
        mat('#ececd3', 0.65),
        [Math.sin(angle) * 0.8, 0.311, Math.cos(angle) * 0.8],
        0.003,
      );
      lume.rotation.y = angle;
      face.add(lume);
    }
  }
  const logo = label('SECOND\nNATURE', 0.68, 0.28, [0, 0.306, -0.3], {
    color: '#565a4a',
    width: 1024,
    height: 512,
    size: 84,
  });
  logo.rotation.x = -Math.PI / 2;
  face.add(logo);
  face.add(box(0.21, 0.014, 0.15, steel, [0.54, 0.305, 0], 0.012));
  const date = label('24', 0.17, 0.105, [0.54, 0.317, 0], {
    width: 256,
    height: 160,
    size: 108,
    background: '#eee8d6',
    color: '#272e31',
    weight: '400',
  });
  date.rotation.x = -Math.PI / 2;
  face.add(date);
  const inscription = label('AUTOMATIC\n100 M', 0.4, 0.14, [0, 0.303, 0.42], {
    width: 768,
    height: 256,
    size: 67,
    color: '#59645f',
    weight: '400',
  });
  inscription.rotation.x = -Math.PI / 2;
  face.add(inscription);
  function hand(length, width, material) {
    const group = new T.Group();
    const h = box(
      width,
      0.022,
      length,
      material,
      [0, 0, -length * 0.38],
      0.012,
    );
    group.add(h);
    if (width > 0.02)
      group.add(
        box(
          width * 0.43,
          0.004,
          length * 0.65,
          mat('#e5e7cc'),
          [0, 0.014, -length * 0.42],
          0.004,
        ),
      );
    group.position.y = 0.35;
    face.add(group);
    return group;
  }
  const hours = hand(0.54, 0.055, steel),
    minutes = hand(0.79, 0.036, steel),
    seconds = hand(0.83, 0.012, mat('#c77741'));
  seconds.position.y = 0.39;
  face.add(cylinder(0.055, 0.035, accent, [0, 0.4, 0]));
  const sapphire = new T.MeshPhysicalMaterial({
    color: '#e8f9ff',
    transmission: 1,
    thickness: 0.03,
    roughness: 0.025,
    ior: 1.5,
    clearcoat: 1,
  });
  crystal.add(cylinder(0.91, 0.026, sapphire, [0, 0.43, 0]));
  const movement = new T.Group();
  caseGroup.add(movement);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const gear = new T.Group(),
      radius = 0.14 + i * 0.008;
    gear.position.set(
      Math.cos(a) * 0.47,
      0.22 + (i % 2) * 0.025,
      Math.sin(a) * 0.47,
    );
    gear.add(torus(radius, 0.018, accent));
    gear.add(cylinder(0.045, 0.035, steel));
    gear.add(cylinder(0.014, 0.044, mat('#a82e47', 0.14, 0.35)));
    for (let j = 0; j < 5; j++) {
      const spoke = box(0.018, 0.02, radius * 1.7, accent, [0, 0, 0], 0.004);
      spoke.rotation.y = (j / 5) * Math.PI;
      gear.add(spoke);
    }
    for (let j = 0; j < 24; j++) {
      const theta = (j / 24) * Math.PI * 2;
      const tooth = box(
        0.023,
        0.027,
        0.038,
        accent,
        [
          Math.sin(theta) * (radius + 0.018),
          0,
          Math.cos(theta) * (radius + 0.018),
        ],
        0.003,
      );
      tooth.rotation.y = theta;
      gear.add(tooth);
    }
    movement.add(gear);
  }
  let exploded = 0,
    demo = false;
  const straps = [
    ['Field green', '#434d40'],
    ['Cognac', '#9a6040'],
    ['Black', '#272c2c'],
    ['Navy', '#354759'],
  ];
  return {
    root,
    parts: {
      caseGroup,
      face,
      crystal,
      movement,
      hours,
      minutes,
      seconds,
      strap,
      dial,
      steel,
    },
    angle: [2.3, 5, 4.5],
    controls: [
      {
        type: 'swatches',
        label: 'Strap',
        options: straps.map((s) => ({ label: s[0], color: s[1] })),
        change: (i, o) => strap.color.set(o.color),
      },
      {
        type: 'swatches',
        label: 'Dial',
        options: [
          { label: 'Ivory', color: '#ede9da' },
          { label: 'Sage', color: '#a4b9a4' },
          { label: 'Blue', color: '#9caebc' },
        ],
        change: (i, o) => dial.color.set(o.color),
      },
      {
        type: 'range',
        label: 'Inside the case',
        start: 'Assembled',
        end: 'Exploded',
        change: (v) => (exploded = v),
      },
      {
        type: 'choice',
        label: 'Time',
        options: [
          { label: 'Local time', value: false },
          { label: 'Fast forward', value: true },
        ],
        change: (v) => (demo = v),
      },
    ],
    update: (t, dt) => {
      const now = new Date();
      const s = demo ? t * 10 : now.getSeconds() + now.getMilliseconds() / 1000;
      const m = demo ? s / 60 : now.getMinutes() + s / 60;
      const h = demo ? m / 60 : now.getHours() + m / 60;
      hours.rotation.y = (-h / 12) * Math.PI * 2;
      minutes.rotation.y = (-m / 60) * Math.PI * 2;
      seconds.rotation.y = (-s / 60) * Math.PI * 2;
      face.position.y = T.MathUtils.damp(
        face.position.y,
        exploded * 0.9,
        7,
        dt,
      );
      crystal.position.y = T.MathUtils.damp(
        crystal.position.y,
        exploded * 1.5,
        7,
        dt,
      );
    },
    credit: 'Original procedural watch · Displays your device’s local time',
  };
}
