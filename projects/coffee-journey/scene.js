import {
  T,
  mat,
  metal,
  box,
  cylinder,
  torus,
  lathe,
  sphere,
  tube,
  label,
} from '../../shared/geometry.js';
import { microfinish } from '../../shared/materials.js';
export async function create() {
  const root = new T.Group(),
    cup = new T.Group(),
    beans = new T.Group(),
    grinder = new T.Group();
  root.add(cup, beans, grinder);
  const ceramic = microfinish(mat('#eee9dc', 0.18), 300, 0.025),
    coffee = mat('#623c26', 0.16),
    roast = microfinish(mat('#735039', 0.65), 210, 0.18);
  ceramic.clearcoat = 1;
  ceramic.clearcoatRoughness = 0.1;
  coffee.clearcoat = 1;
  coffee.clearcoatRoughness = 0.07;
  roast.clearcoat = 0.25;
  roast.clearcoatRoughness = 0.4;
  const saucer = new T.Path();
  saucer.moveTo(0, -0.77);
  saucer.lineTo(0.59, -0.77);
  saucer.quadraticCurveTo(0.88, -0.74, 1.2, -0.64);
  saucer.quadraticCurveTo(1.3, -0.6, 1.22, -0.57);
  saucer.quadraticCurveTo(0.91, -0.62, 0.65, -0.69);
  saucer.lineTo(0, -0.69);
  cup.add(
    lathe(
      saucer.getPoints(16).map((p) => [p.x, p.y]),
      ceramic,
    ),
  );
  cup.add(torus(0.5, 0.035, ceramic, [0, -0.65, 0]));
  const profile = new T.Path();
  profile.moveTo(0, -0.64);
  profile.lineTo(0.42, -0.64);
  profile.quadraticCurveTo(0.52, -0.64, 0.55, -0.51);
  profile.bezierCurveTo(0.61, -0.28, 0.62, 0.1, 0.66, 0.42);
  profile.bezierCurveTo(0.67, 0.49, 0.64, 0.52, 0.61, 0.49);
  profile.quadraticCurveTo(0.59, 0.47, 0.59, 0.4);
  profile.bezierCurveTo(0.55, 0.11, 0.54, -0.3, 0.48, -0.45);
  profile.quadraticCurveTo(0.46, -0.5, 0.39, -0.5);
  profile.lineTo(0, -0.5);
  cup.add(
    lathe(
      profile.getPoints(16).map((p) => [p.x, p.y]),
      ceramic,
    ),
  );
  const handle = torus(0.33, 0.083, ceramic, [0.73, -0.01, 0], [0, 0, 0]);
  handle.scale.set(1, 1.16, 1);
  cup.add(handle);
  const coffeeSurface = cylinder(0.59, 0.017, coffee, [0, 0.385, 0]);
  cup.add(coffeeSurface);
  const crema = microfinish(mat('#c8945c', 0.45), 420, 0.18);
  const foam = new T.Group();
  foam.add(torus(0.55, 0.015, crema, [0, 0, 0]));
  for (let i = 0; i < 65; i++) {
    const a = i * 2.39996,
      r = 0.47 + (i % 5) * 0.021;
    foam.add(
      sphere(
        0.003 + (i % 4) * 0.002,
        crema,
        [Math.sin(a) * r, 0, Math.cos(a) * r],
        [1, 0.4, 1],
      ),
    );
  }
  foam.position.y = 0.398;
  cup.add(foam);
  const milk = new T.Group();
  milk.position.y = 0.406;
  cup.add(milk);
  const milkMaterial = mat('#f4e4c5', 0.4);
  for (let i = 0; i < 7; i++) {
    const width = 0.23 - i * 0.024,
      z = -0.2 + i * 0.069;
    for (const side of [-1, 1]) {
      const leaf = tube(
        [
          [0, 0, z + 0.03],
          [side * width, 0, z - 0.075],
          [side * width * 0.82, 0, z + 0.02],
          [0, 0, z + 0.075],
        ],
        0.018 - i * 0.0014,
        milkMaterial,
      );
      leaf.scale.y = 0.13;
      milk.add(leaf);
    }
  }
  const stem = tube(
    [
      [0, 0, -0.31],
      [0.012, 0, 0],
      [0, 0, 0.34],
    ],
    0.008,
    milkMaterial,
  );
  stem.scale.y = 0.15;
  milk.add(stem);
  const beanPositions = [
    [-1.32, -0.66, 0.73],
    [-1.5, -0.66, 0.42],
    [1.33, -0.66, 0.6],
    [1.43, -0.66, 0.89],
  ];
  const beanGeometry = new T.SphereGeometry(1, 64, 40);
  const vertices = beanGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i),
      y = vertices.getY(i),
      z = vertices.getZ(i);
    const seam = 0.09 * Math.sin(z * 4);
    const indentation =
      Math.exp(-(((x - seam) / 0.13) ** 2)) * Math.max(0, y) * 0.33;
    const wrinkle =
      Math.sin(z * 24 + x * 9) * Math.sin(y * 22 - z * 12) * 0.016;
    vertices.setXYZ(
      i,
      x * 0.105 * (1 + wrinkle),
      (y - indentation + wrinkle) * 0.077,
      z * 0.168 * (1 + wrinkle),
    );
  }
  beanGeometry.computeVertexNormals();
  const seamMaterial = mat('#3c291c', 0.95);
  function bean(position, scale = 1) {
    const b = new T.Group();
    b.position.set(...position);
    const beanMesh = new T.Mesh(beanGeometry, roast);
    beanMesh.castShadow = beanMesh.receiveShadow = true;
    b.add(beanMesh);
    const groove = tube(
      Array.from({ length: 16 }, (_, i) => {
        const z = -0.85 + (i / 15) * 1.7;
        return [
          0.00945 * Math.sin(z * 4),
          0.077 * Math.sqrt(1 - z * z) * 0.67,
          z * 0.168,
        ];
      }),
      0.002,
      seamMaterial,
    );
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
  const grinderBody = microfinish(metal('#50685a'), 290, 0.11);
  grinderBody.roughness = 0.45;
  grinder.add(cylinder(0.51, 1.4, grinderBody, [0, 0, 0]));
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2;
    grinder.add(
      cylinder(0.0028, 0.47, grinderBody, [
        Math.sin(a) * 0.51,
        -0.3,
        Math.cos(a) * 0.51,
      ]),
    );
  }
  grinder.add(cylinder(0.57, 0.13, metal('#c5c1ac'), [0, 0.76, 0]));
  grinder.add(cylinder(0.45, 0.12, metal('#c5c1ac'), [0, -0.76, 0]));
  grinder.add(cylinder(0.05, 0.3, metal(), [0, 0.96, 0]));
  const crank = new T.Group();
  crank.position.y = 1.09;
  crank.add(box(1.03, 0.045, 0.1, metal(), [0.46, 0, 0], 0.025));
  crank.add(cylinder(0.13, 0.16, mat('#3a3029'), [0.91, 0.06, 0]));
  grinder.add(crank);
  const mark = label('DAILY\nRITUAL', 0.48, 0.3, [0, 0.23, 0.512], {
    width: 768,
    height: 512,
    size: 115,
    color: '#e3ddc9',
    weight: '400',
  });
  grinder.add(mark);
  const steamMaterial = new T.SpriteMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  steamMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      float haze = max(0.0, 1.0 - length(vMapUv - 0.5) * 2.0);
      diffuseColor.a *= haze * haze;`,
    );
  };
  // Sprite shaders expose UV coordinates when a map is present.
  const pixel = new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  pixel.needsUpdate = true;
  steamMaterial.map = pixel;
  const steam = new T.Group();
  cup.add(steam);
  for (let i = 0; i < 12; i++) {
    const particle = new T.Sprite(steamMaterial);
    particle.position.set(0, 0.5 + i * 0.04, 0);
    particle.scale.set(0.11, 0.2, 1);
    steam.add(particle);
  }
  let phase = 2,
    roastLevel = 0.6,
    milkAmount = 0.6,
    hot = true;
  beans.visible = false;
  grinder.visible = false;
  return {
    root,
    parts: {
      cup,
      beans,
      grinder,
      crank,
      steam,
      steamMaterial,
      ceramic,
      coffee,
      roast,
      coffeeSurface,
      milk,
      foam,
    },
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
        p.scale.set(0.09 + a * 0.14, 0.16 + a * 0.25, 1);
      });
    },
    credit: 'Original procedural coffee study · Object Lab',
  };
}
