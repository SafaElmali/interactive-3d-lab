import { T, mat, metal, box, mesh, label } from '../../shared/geometry.js';

const glow = (color, intensity = 1) => new T.MeshStandardMaterial({
  color,
  emissive: color,
  emissiveIntensity: intensity,
  roughness: 0.32,
  metalness: 0.12,
});

function roundedProfile() {
  // The profile is drawn in -Z/Y, then extruded across the cabinet's width.
  const shape = new T.Shape();
  shape.moveTo(0.9, -2.13);
  shape.lineTo(-0.83, -2.13);
  shape.quadraticCurveTo(-1.04, -2.13, -1.04, -1.92);
  shape.lineTo(-1.07, -0.4);
  shape.quadraticCurveTo(-1.13, -0.15, -0.92, 0.02);
  shape.lineTo(-0.55, 0.22);
  shape.lineTo(-0.14, 1.4);
  shape.lineTo(-0.55, 1.47);
  shape.quadraticCurveTo(-0.69, 1.5, -0.69, 1.67);
  shape.lineTo(-0.66, 2.08);
  shape.quadraticCurveTo(-0.65, 2.29, -0.44, 2.29);
  shape.lineTo(0.77, 2.29);
  shape.quadraticCurveTo(0.96, 2.29, 0.96, 2.1);
  shape.lineTo(0.96, -1.97);
  shape.quadraticCurveTo(0.96, -2.13, 0.9, -2.13);
  return shape;
}

function disc(radius, depth, material, position, rotation = [0, 0, 0]) {
  return mesh(new T.CylinderGeometry(radius, radius, depth, 32), material, position, rotation);
}

function diamond(size, material, position) {
  return mesh(new T.OctahedronGeometry(size), material, position);
}

export function createRunner(materials) {
  const root = new T.Group();
  root.add(mesh(new T.ConeGeometry(0.27, 0.57, 4), materials.cyan, [0, 0.1, 0], [0, Math.PI / 4, 0]));
  root.add(box(0.50, 0.12, 0.24, materials.shell, [0, -0.09, 0], 0.025));
  root.add(box(0.17, 0.18, 0.16, materials.lime, [0, 0.02, 0.17], 0.025));
  for (const x of [-0.19, 0.19])
    root.add(mesh(new T.ConeGeometry(0.055, 0.19, 5), materials.pink, [x, -0.24, 0], [Math.PI, 0, 0]));
  return root;
}

export async function create({ preview = false } = {}) {
  const root = new T.Group();
  const shell = mat('#34327e', 0.31, 0.24), sideInk = mat('#242058', 0.36, 0.18);
  const charcoal = mat('#101223', 0.6, 0.15), metalwork = metal('#747797');
  const pink = glow('#f838c6', 1.15), lime = glow('#c5ff50', 0.62), cyan = glow('#47e0f1', 0.78);
  const materials = { shell, charcoal, pink, lime, cyan };
  const chassis = new T.Group(), left = new T.Group(), right = new T.Group();
  const deck = new T.Group(), monitor = new T.Group(), marquee = new T.Group();
  root.add(chassis, left, right, deck, monitor, marquee);

  // A weighty black plinth and recessed metal feet keep the silhouette grounded.
  chassis.add(box(2.16, 0.20, 1.98, charcoal, [0, -2.1, -0.03], 0.095));
  chassis.add(box(1.95, 1.84, 1.59, shell, [0, -1.05, -0.09], 0.09));
  chassis.add(box(1.95, 2.43, 0.26, charcoal, [0, 0.93, -0.78], 0.06));
  chassis.add(box(1.96, 0.15, 1.31, shell, [0, 2.12, -0.04], 0.035));
  for (const x of [-0.77, 0.77])
    for (const z of [-0.70, 0.65]) chassis.add(disc(0.115, 0.16, metalwork, [x, -2.22, z]));

  const door = box(1.31, 1.48, 0.065, charcoal, [0, -1.21, 0.748], 0.055);
  chassis.add(door);
  chassis.add(box(1.12, 0.038, 0.025, pink, [0, -1.78, 0.796], 0.008));
  chassis.add(box(0.57, 0.53, 0.055, metalwork, [0.2, -0.85, 0.813], 0.04));
  chassis.add(box(0.48, 0.43, 0.035, charcoal, [0.2, -0.84, 0.847], 0.025));
  chassis.add(box(0.29, 0.048, 0.026, lime, [0.2, -0.745, 0.872], 0.008));
  chassis.add(box(0.21, 0.015, 0.015, charcoal, [0.2, -0.745, 0.889], 0.003));
  const returnButton = box(0.11, 0.09, 0.043, pink, [0.34, -0.96, 0.887], 0.02);
  chassis.add(returnButton);
  const lock = disc(0.027, 0.018, metalwork, [-0.51, -0.67, 0.79], [Math.PI / 2, 0, 0]);
  chassis.add(lock);
  chassis.add(label('ONE COIN / ALL IN', 0.81, 0.115, [0, -1.48, 0.79], {
    width: 1024, height: 128, size: 88, color: '#bdbaf1', font: 'monospace',
  }));
  for (let i = 0; i < 6; i++)
    chassis.add(box(0.58, 0.019, 0.018, metalwork, [-0.12, -1.01 - i * 0.045, 0.79], 0.005));

  const profile = roundedProfile();
  const panelGeometry = new T.ExtrudeGeometry(profile, {
    depth: 0.13, bevelEnabled: true, bevelThickness: 0.024, bevelSize: 0.024,
    bevelSegments: 3, curveSegments: 8,
  });
  panelGeometry.rotateY(Math.PI / 2);
  panelGeometry.translate(-0.065, 0, 0);
  const contour = profile.getPoints(9);
  const pipingGeometry = new T.TubeGeometry(
    new T.CatmullRomCurve3(contour.map((p) => new T.Vector3(0, p.y, -p.x)), true, 'centripetal'),
    144, 0.016, 6, true,
  );
  for (const [side, group] of [[-1, left], [1, right]]) {
    group.position.x = side * 1.03;
    group.add(mesh(panelGeometry, sideInk));
    group.add(mesh(pipingGeometry, pink, [side * 0.09, 0, 0]));
    // Layered side graphics are actual inset geometry, readable from three quarters.
    const art = new T.Group();
    art.position.set(side * 0.093, 0, -0.1);
    art.rotation.y = side * Math.PI / 2;
    group.add(art);
    for (let i = 0; i < 5; i++) {
      const stripe = box(1.05 - i * 0.12, 0.075, 0.008, i % 2 ? cyan : pink,
        [-0.13 + i * 0.035, -0.85 + i * 0.17, 0], 0.005);
      stripe.rotation.z = -0.43;
      art.add(stripe);
    }
    const emblem = mesh(new T.RingGeometry(0.27, 0.31, 4), lime, [0, 0.71, 0.009], [0, 0, Math.PI / 4]);
    art.add(emblem);
    art.add(diamond(0.135, cyan, [0, 0.71, 0.023]));
    art.add(label('ORBIT', 0.88, 0.22, [0, 0.17, 0.025], {
      width: 512, height: 128, size: 99, color: '#e8e3ff', font: 'monospace',
    }));
    art.add(label('RUN / 01', 0.69, 0.095, [0, -0.02, 0.025], {
      width: 768, height: 128, size: 85, color: '#c5ff50', font: 'monospace',
    }));
    for (const y of [-1.81, 1.94]) {
      const screw = disc(0.033, 0.012, metalwork, [side * 0.094, y, -0.64], [0, 0, Math.PI / 2]);
      group.add(screw);
    }
  }

  deck.position.set(0, 0.07, 0.57);
  deck.rotation.x = -0.09;
  deck.add(box(1.95, 0.16, 1.04, shell, [0, 0, 0], 0.08));
  deck.add(box(1.78, 0.029, 0.86, charcoal, [0, 0.094, 0], 0.07));
  deck.add(box(1.9, 0.045, 0.027, cyan, [0, -0.002, 0.53], 0.008));
  const joystick = new T.Group();
  joystick.position.set(-0.50, 0.108, 0.025);
  joystick.add(disc(0.19, 0.045, metalwork, [0, 0, 0]));
  joystick.add(disc(0.13, 0.037, charcoal, [0, 0.039, 0]));
  joystick.add(disc(0.039, 0.28, metalwork, [0, 0.18, 0]));
  joystick.add(mesh(new T.SphereGeometry(0.135, 24, 16), pink, [0, 0.35, 0]));
  deck.add(joystick);
  const buttons = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
    const button = new T.Group();
    button.position.set(0.09 + i * 0.255, 0.127, -0.17 + row * 0.30);
    button.add(disc(0.114, 0.043, metalwork, [0, 0, 0]));
    button.add(disc(0.091, 0.065, row ? pink : lime, [0, 0.035, 0]));
    deck.add(button);
    buttons.push(button);
  }
  for (const x of [-0.25, 0.05]) deck.add(disc(0.043, 0.019, cyan, [x, 0.12, -0.34]));

  monitor.position.set(0, 0.86, 0.05);
  monitor.rotation.x = -0.28;
  monitor.add(box(1.99, 1.43, 0.21, charcoal, [0, 0, 0], 0.17));
  monitor.add(box(1.80, 1.25, 0.105, metalwork, [0, 0, 0.11], 0.15));
  monitor.add(box(1.72, 1.17, 0.08, charcoal, [0, 0, 0.165], 0.14));
  const screenMaterial = glow('#183936', 0.64);
  monitor.add(box(1.60, 1.05, 0.045, screenMaterial, [0, 0, 0.208], 0.13));
  const display = new T.Group();
  display.position.z = 0.239;
  monitor.add(display);
  const screenUI = new T.Group();
  display.add(screenUI);
  screenUI.add(label('ORBIT RUN', 1.13, 0.16, [0, 0.337, 0.018], {
    width: 1024, height: 128, size: 105, color: '#c5ff50', font: 'monospace',
  }));
  screenUI.add(label('01     000250     HI', 1.23, 0.074, [0, 0.454, 0.022], {
    width: 1024, height: 128, size: 76, color: '#9ceef1', font: 'monospace',
  }));
  screenUI.add(label('INSERT COIN', 0.94, 0.11, [0, -0.394, 0.02], {
    width: 1024, height: 128, size: 105, color: '#f99fdf', font: 'monospace',
  }));
  const screenRunner = createRunner(materials);
  screenRunner.scale.setScalar(0.46);
  screenRunner.position.set(-0.19, -0.09, 0.04);
  screenUI.add(screenRunner);
  const screenCoins = [];
  for (let i = 0; i < 4; i++) {
    const coin = diamond(0.045, lime, [0.12 + i * 0.13, -0.07 + Math.sin(i * 0.8) * 0.14, 0.021]);
    screenUI.add(coin);
    screenCoins.push(coin);
  }
  for (let i = 0; i < 7; i++) {
    const h = 0.05 + (i % 3) * 0.042;
    screenUI.add(box(0.105, h, 0.018, i % 2 ? pink : cyan, [-0.6 + i * 0.19, -0.29 + h / 2, 0], 0.008));
  }
  const gridMaterial = new T.MeshBasicMaterial({ color: '#77cbba', transparent: true, opacity: 0.13, depthWrite: false });
  const scanlines = new T.InstancedMesh(new T.PlaneGeometry(1.43, 0.009), gridMaterial, preview ? 25 : 37);
  const scanline = new T.Object3D();
  for (let i = 0; i < scanlines.count; i++) {
    scanline.position.set(0, -0.45 + i * 0.9 / (scanlines.count - 1), 0.022);
    scanline.updateMatrix();
    scanlines.setMatrixAt(i, scanline.matrix);
  }
  display.add(scanlines);
  const bootMaterial = glow('#c9fff1', 1.6);
  const bootLine = box(1.42, 0.024, 0.008, bootMaterial, [0, 0, 0.031], 0.003);
  bootLine.visible = false;
  display.add(bootLine);
  // A subtly bowed glass face catches a continuous studio highlight over the pixels.
  const glassGeometry = new T.PlaneGeometry(1.58, 1.035, 24, 18);
  const vertices = glassGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i);
    const edge = Math.max(0, (Math.abs(y) - 0.40) / 0.1175);
    vertices.setXYZ(i, x * (1 - edge * edge * 0.035), y,
      0.035 * Math.max(0, 1 - (x / 0.80) ** 2) * Math.max(0, 1 - (y / 0.53) ** 2));
  }
  glassGeometry.computeVertexNormals();
  const glass = new T.MeshPhysicalMaterial({
    color: '#bfeeff', transparent: true, opacity: 0.14, depthWrite: false,
    roughness: 0.08, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04,
  });
  const glassFace = mesh(glassGeometry, glass, [0, 0, 0.307]);
  glassFace.castShadow = false;
  monitor.add(glassFace);

  marquee.position.set(0, 1.85, 0.48);
  marquee.rotation.x = -0.055;
  marquee.add(box(1.99, 0.55, 0.28, charcoal, [0, 0, 0], 0.065));
  marquee.add(box(1.86, 0.40, 0.035, pink, [0, 0, 0.158], 0.045));
  marquee.add(box(1.80, 0.34, 0.018, sideInk, [0, 0, 0.184], 0.028));
  marquee.add(label('ORBIT RUN', 1.59, 0.25, [0, 0.013, 0.199], {
    width: 1024, height: 192, size: 130, color: '#d7ff72', font: 'monospace',
  }));
  for (const side of [-1, 1]) {
    marquee.add(diamond(0.051, cyan, [side * 0.865, 0, 0.214]));
    for (let i = 0; i < 5; i++)
      chassis.add(box(0.045, 0.01, 0.025, charcoal, [side * (0.37 + i * 0.095), 1.529, 0.481], 0.002));
  }

  return {
    root,
    angle: [4.2, 2.8, 6.7],
    previewPadding: 1.16,
    parts: {
      chassis, sides: [left, right], deck, monitor, marquee, joystick, buttons,
      screenUI, screenRunner, screenCoins, screenMaterial, bootLine, bootMaterial,
      scanlines, materials,
    },
    credit: 'Original procedural arcade cabinet and ORBIT RUN artwork · Object Lab',
  };
}

export function createGameWorld(materials) {
  const root = new T.Group();
  const runner = createRunner(materials);
  root.add(runner);
  const platforms = [], coins = [], portals = [];
  const platformMaterial = mat('#353871', 0.38, 0.2);
  for (let i = 0; i < 6; i++) {
    const platform = new T.Group();
    const width = 0.62 + (i % 2) * 0.2;
    platform.add(box(width, 0.14, 0.64, platformMaterial, [0, 0, 0], 0.06));
    platform.add(box(width - 0.05, 0.025, 0.58, materials.lime, [0, 0.083, 0], 0.045));
    const tower = box(0.20, 0.22 + (i % 3) * 0.17, 0.24, i % 2 ? materials.pink : materials.cyan,
      [width * 0.18, 0.21 + (i % 3) * 0.085, -0.11], 0.018);
    platform.add(tower);
    root.add(platform);
    platforms.push(platform);
  }
  for (let i = 0; i < 9; i++) {
    const coin = diamond(0.095, materials.lime, [0, 0, 0]);
    root.add(coin);
    coins.push(coin);
  }
  const portalGeometry = new T.TorusGeometry(0.59, 0.028, 8, 64);
  for (let i = 0; i < 3; i++) {
    const portal = new T.Group();
    portal.add(mesh(portalGeometry, i % 2 ? materials.cyan : materials.pink));
    for (let j = 0; j < 4; j++) {
      const a = j * Math.PI / 2;
      portal.add(box(0.095, 0.095, 0.11, materials.lime, [Math.cos(a) * 0.59, Math.sin(a) * 0.59, 0], 0.01));
    }
    root.add(portal);
    portals.push(portal);
  }
  const sparks = new T.InstancedMesh(new T.BoxGeometry(0.052, 0.052, 0.052), materials.cyan, 36);
  sparks.frustumCulled = false;
  root.add(sparks);
  return { root, runner, platforms, coins, portals, sparks };
}
