import {
  T,
  mat,
  metal,
  box,
  cylinder,
  torus,
  label,
} from '../../shared/geometry.js';
export async function create() {
  const root = new T.Group(),
    caseGroup = new T.Group(),
    face = new T.Group(),
    crystal = new T.Group();
  root.add(caseGroup, face, crystal);
  const steel = metal('#bfc3c4'),
    strap = mat('#434d40', 0.65),
    dial = mat('#ede9da', 0.36),
    accent = metal('#ad8753');
  for (const direction of [-1, 1]) {
    const band = box(1.1, 0.16, 1.8, strap, [0, 0, direction * 1.72], 0.13);
    caseGroup.add(band);
    for (let i = 0; i < 9; i++) {
      const stitch = box(
        0.012,
        0.008,
        0.095,
        mat('#b3b39b'),
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
  caseGroup.add(cylinder(1, 0.32, steel, [0, 0.1, 0]));
  caseGroup.add(torus(0.96, 0.07, steel, [0, 0.28, 0]));
  const crown = cylinder(0.13, 0.19, steel, [1.06, 0.13, 0]);
  crown.rotation.z = Math.PI / 2;
  caseGroup.add(crown);
  face.add(cylinder(0.91, 0.025, dial, [0, 0.28, 0]));
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const mark = box(
      i % 5 === 0 ? 0.035 : 0.012,
      0.015,
      i % 5 === 0 ? 0.12 : 0.055,
      mat('#44483d'),
      [Math.sin(angle) * 0.8, 0.3, Math.cos(angle) * 0.8],
      0.001,
    );
    mark.rotation.y = angle;
    face.add(mark);
  }
  const logo = label('SECOND\nNATURE', 0.68, 0.28, [0, 0.306, -0.3], {
    color: '#565a4a',
    size: 45,
  });
  logo.rotation.x = -Math.PI / 2;
  face.add(logo);
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
    group.position.y = 0.35;
    face.add(group);
    return group;
  }
  const hours = hand(0.54, 0.055, mat('#2a352c')),
    minutes = hand(0.79, 0.036, mat('#2a352c')),
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
    movement.add(
      torus(0.14 + i * 0.008, 0.025, accent, [
        Math.cos(a) * 0.5,
        0.2,
        Math.sin(a) * 0.5,
      ]),
    );
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
