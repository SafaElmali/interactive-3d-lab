import {
  T,
  mat,
  metal,
  box,
  cylinder,
  label,
  torus,
} from '../../shared/geometry.js';
import { microfinish } from '../../shared/materials.js';
export async function create() {
  const root = new T.Group();
  const bottle = new T.Group(),
    cap = new T.Group();
  root.add(bottle, cap);
  const glass = new T.MeshPhysicalMaterial({
    color: '#fffcf6',
    transmission: 1,
    thickness: 0.16,
    attenuationColor: '#e8ddc4',
    attenuationDistance: 4,
    roughness: 0.035,
    ior: 1.48,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.035,
  });
  bottle.add(box(1.7, 2.5, 0.9, glass, [0, 0, 0], 0.2));
  const liquid = new T.MeshPhysicalMaterial({
    color: '#c99a43',
    // The liquid must enter the opaque buffer to be visible through the glass.
    transmission: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    roughness: 0.1,
    ior: 1.36,
  });
  bottle.add(box(1.43, 1.85, 0.67, liquid, [0, -0.2, 0], 0.12));
  const heavyBase = glass.clone();
  heavyBase.thickness = 0.35;
  bottle.add(box(1.56, 0.17, 0.76, heavyBase, [0, -1.11, 0], 0.11));
  for (const y of [1.3, 1.48, 1.58])
    bottle.add(torus(0.19, 0.018, metal('#d8c08e'), [0, y, 0]));
  bottle.add(cylinder(0.18, 0.45, metal('#cbb58a'), [0, 1.45, 0]));
  bottle.add(cylinder(0.13, 0.2, metal('#e8d6b0'), [0, 1.74, 0]));
  bottle.add(box(0.09, 0.035, 0.08, mat('#35342d'), [0, 1.77, 0.135], 0.01));
  const dipTube = cylinder(0.018, 1.9, mat('#e9d9b8'), [0, 0.01, 0]);
  bottle.add(dipTube);
  const capMaterial = microfinish(mat('#3c3025', 0.21, 0.08), 250, 0.045);
  capMaterial.clearcoat = 0.85;
  capMaterial.clearcoatRoughness = 0.12;
  cap.add(box(0.66, 0.72, 0.66, capMaterial, [0, 1.66, 0], 0.075));
  const band = metal('#d9c59f');
  cap.add(box(0.69, 0.045, 0.69, band, [0, 1.33, 0], 0.05));
  bottle.add(box(1.25, 0.94, 0.01, band, [0, -0.1, 0.45], 0.015));
  const front = label('E S S E N C E\nNO. 01', 1.18, 0.87, [0, -0.1, 0.462], {
    background: '#eee7d6',
    color: '#2e2b24',
    width: 1024,
    height: 768,
    size: 86,
    font: 'serif',
    weight: '400',
  });
  bottle.add(front);
  const seal = label('PARIS  ·  EXTRAIT', 0.87, 0.09, [0, -0.39, 0.464], {
    width: 1024,
    height: 128,
    size: 60,
    color: '#75613e',
    weight: '400',
  });
  bottle.add(seal);
  const small = label('EAU DE PARFUM  /  50 ML', 1.3, 0.12, [0, -0.88, 0.455], {
    size: 24,
    color: '#50412a',
  });
  bottle.add(small);
  const flavors = [
    { label: 'Amber', color: '#c99a43', cap: '#3c3025' },
    { label: 'Rose', color: '#ce7c7d', cap: '#714149' },
    { label: 'Moss', color: '#7d9757', cap: '#324432' },
    { label: 'Iris', color: '#9999ca', cap: '#484357' },
  ];
  let opened = false,
    sprayUntil = 0,
    capButton;
  const particles = new T.BufferGeometry();
  const array = new Float32Array(70 * 3);
  particles.setAttribute('position', new T.BufferAttribute(array, 3));
  const mist = new T.Points(
    particles,
    new T.PointsMaterial({
      color: '#ffffff',
      size: 0.045,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  root.add(mist);
  return {
    root,
    parts: { bottle, cap, liquid, capMaterial, glass, mist },
    angle: [2.4, 1.5, 6],
    controls: [
      {
        type: 'swatches',
        label: 'Fragrance',
        options: flavors,
        change: (i) => {
          liquid.color.set(flavors[i].color);
          capMaterial.color.set(flavors[i].cap);
        },
      },
      {
        type: 'button',
        label: 'The bottle',
        text: 'Lift the cap',
        bind: (b) => (capButton = b),
        click: (b) => {
          opened = !opened;
          b.textContent = opened ? 'Replace the cap' : 'Lift the cap';
        },
      },
      {
        type: 'button',
        label: 'A little atmosphere',
        text: 'Spray',
        click: () => {
          opened = true;
          if (capButton) capButton.textContent = 'Replace the cap';
          sprayUntil = performance.now() + 1500;
        },
      },
      {
        type: 'range',
        label: 'Glass finish',
        start: 'Clear',
        end: 'Frosted',
        change: (v) => (glass.roughness = 0.07 + v * 0.65),
      },
    ],
    update: (t, dt) => {
      cap.position.y = T.MathUtils.damp(
        cap.position.y,
        opened ? 1.15 : 0,
        7,
        dt,
      );
      cap.rotation.z = T.MathUtils.damp(
        cap.rotation.z,
        opened ? -0.15 : 0,
        7,
        dt,
      );
      const amount = Math.max(0, (sprayUntil - performance.now()) / 1500);
      mist.material.opacity = amount * 0.7;
      if (amount) {
        for (let i = 0; i < 70; i++) {
          const phase = (i / 70 + 1 - amount) % 1;
          array[i * 3] = Math.sin(i * 2.4) * phase * 0.7;
          array[i * 3 + 1] = 1.8 + Math.cos(i * 4.2) * phase * 0.45;
          array[i * 3 + 2] = 0.2 + phase * 2;
        }
        particles.attributes.position.needsUpdate = true;
      }
    },
    credit: 'Original procedural bottle · Object Lab',
  };
}
