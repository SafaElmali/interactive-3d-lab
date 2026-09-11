import {
  T,
  mat,
  metal,
  box,
  cylinder,
  torus,
  lathe,
  sphere,
} from '../../shared/geometry.js';
export async function create() {
  const root = new T.Group(),
    cup = new T.Group(),
    beans = new T.Group(),
    grinder = new T.Group();
  root.add(cup, beans, grinder);
  const ceramic = mat('#eee9dc', 0.24),
    coffee = mat('#623c26', 0.27),
    roast = mat('#735039', 0.7);
  cup.add(cylinder(1.25, 0.08, ceramic, [0, -0.73, 0]));
  cup.add(torus(1.11, 0.018, ceramic, [0, -0.68, 0]));
  cup.add(
    lathe(
      [
        [0, -0.64],
        [0.44, -0.64],
        [0.54, -0.55],
        [0.66, 0.42],
        [0.65, 0.49],
        [0.59, 0.49],
        [0.58, 0.39],
        [0.46, -0.48],
        [0, -0.48],
      ],
      ceramic,
    ),
  );
  cup.add(torus(0.36, 0.082, ceramic, [0.74, -0.02, 0], [0, 0, 0]));
  const coffeeSurface = cylinder(0.59, 0.017, coffee, [0, 0.385, 0]);
  cup.add(coffeeSurface);
  const crema = mat('#c8945c', 0.4);
  cup.add(torus(0.55, 0.025, crema, [0, 0.4, 0]));
  const milk = new T.Group();
  milk.position.y = 0.406;
  cup.add(milk);
  for (let i = 0; i < 5; i++) {
    const leaf = sphere(
      0.12 - i * 0.015,
      mat('#f4e4c5'),
      [0, 0.001, -0.23 + i * 0.1],
      [1.8, 0.028, 0.8],
    );
    milk.add(leaf);
  }
  const beanPositions = [
    [-1.32, -0.66, 0.73],
    [-1.5, -0.66, 0.42],
    [1.33, -0.66, 0.6],
    [1.43, -0.66, 0.89],
  ];
  function bean(position, scale = 1) {
    const b = new T.Group();
    b.position.set(...position);
    b.add(sphere(0.14, roast, [0, 0, 0], [0.75, 0.55, 1.2]));
    const groove = box(0.013, 0.011, 0.2, mat('#342316'), [0, 0.074, 0], 0.01);
    b.add(groove);
    b.rotation.y = position[0] * 3;
    b.scale.setScalar(scale);
    return b;
  }
  beanPositions.forEach((p) => cup.add(bean(p)));
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4,
      r = 0.2 + Math.sqrt(i / 18) * 1.15;
    beans.add(
      bean([Math.cos(a) * r, -0.18 + (i % 3) * 0.12, Math.sin(a) * r], 1.35),
    );
  }
  grinder.add(cylinder(0.51, 1.4, mat('#50685a'), [0, 0, 0]));
  grinder.add(cylinder(0.57, 0.13, metal('#c5c1ac'), [0, 0.76, 0]));
  grinder.add(cylinder(0.45, 0.12, metal('#c5c1ac'), [0, -0.76, 0]));
  grinder.add(cylinder(0.05, 0.3, metal(), [0, 0.96, 0]));
  const crank = new T.Group();
  crank.position.y = 1.09;
  crank.add(box(1.03, 0.045, 0.1, metal(), [0.46, 0, 0], 0.025));
  crank.add(cylinder(0.13, 0.16, mat('#3a3029'), [0.91, 0.06, 0]));
  grinder.add(crank);
  const steamMaterial = new T.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const steam = new T.Group();
  cup.add(steam);
  for (let i = 0; i < 12; i++)
    steam.add(
      sphere(0.025, steamMaterial, [0, 0.5 + i * 0.04, 0], [1, 1.6, 1]),
    );
  let phase = 2,
    roastLevel = 0.6,
    milkAmount = 0.6,
    hot = true;
  beans.visible = false;
  grinder.visible = false;
  return {
    root,
    parts: { cup, beans, grinder, crank, steam, steamMaterial, ceramic, coffee, roast, coffeeSurface, milk },
    angle: [3, 3.6, 5.5],
    controls: [
      {
        type: 'choice',
        label: 'The ritual',
        value: 2,
        options: [
          { label: '01 · Roast', value: 0 },
          { label: '02 · Grind', value: 1 },
          { label: '03 · Brew', value: 2 },
        ],
        change: (v) => (phase = v),
      },
      {
        type: 'range',
        label: 'Roast',
        value: 0.6,
        start: 'Light',
        end: 'Dark',
        change: (v) => (roastLevel = v),
      },
      {
        type: 'range',
        label: 'A splash of milk',
        value: 0.6,
        start: 'Black',
        end: 'Milky',
        change: (v) => (milkAmount = v),
      },
      {
        type: 'swatches',
        label: 'Your cup',
        options: [
          { label: 'Porcelain', color: '#eee9dc' },
          { label: 'Forest', color: '#536b54' },
          { label: 'Terracotta', color: '#c58164' },
        ],
        change: (i, o) => ceramic.color.set(o.color),
      },
      {
        type: 'choice',
        label: 'Temperature',
        options: [
          { label: 'Hot', value: true },
          { label: 'Cool', value: false },
        ],
        change: (v) => (hot = v),
      },
    ],
    update: (t) => {
      beans.visible = phase === 0;
      grinder.visible = phase === 1;
      cup.visible = phase === 2;
      roast.color.set('#b58b52').lerp(new T.Color('#38271e'), roastLevel);
      coffee.color.set('#482b1d').lerp(new T.Color('#c0a17b'), milkAmount);
      milk.visible = milkAmount > 0.25;
      milk.scale.setScalar(0.5 + milkAmount * 0.5);
      crank.rotation.y = t * 1.7;
      steam.visible = hot;
      steam.children.forEach((p, i) => {
        const a = (t * 0.25 + i / 12) % 1;
        p.position.set(
          Math.sin(a * 8 + i) * 0.11,
          0.48 + a * 0.85,
          Math.cos(a * 6 + i) * 0.1,
        );
        p.scale.setScalar(0.5 + a * 1.5);
      });
    },
    credit: 'Original procedural coffee study · Object Lab',
  };
}
