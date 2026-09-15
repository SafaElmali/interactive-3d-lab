import { T, mat, metal, mesh, label } from '../../shared/geometry.js';
import { microfinish } from '../../shared/materials.js';

// A fictional studio model. Dimensions and motion are composed for the frame.
const TAU = Math.PI * 2;
const cube = new T.BoxGeometry(1, 1, 1);
const pin = new T.SphereGeometry(0.018, 6, 4);
function block(w, h, d, material, position) {
  const object = mesh(cube, material, position);
  object.scale.set(w, h, d);
  return object;
}
function drum(radius, height, material, y, top = radius, segments = 48) {
  return mesh(new T.CylinderGeometry(top, radius, height, segments), material, [0, y, 0]);
}
function hoop(radius, material, y, thickness = 0.017) {
  return mesh(new T.TorusGeometry(radius, thickness, 6, 48), material, [0, y, 0], [Math.PI / 2, 0, 0]);
}
function strut(a, b, radius, material) {
  const start = new T.Vector3(...a), end = new T.Vector3(...b);
  const object = mesh(new T.CylinderGeometry(radius, radius, start.distanceTo(end), 6), material);
  object.position.copy(start).add(end).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), end.sub(start).normalize());
  return object;
}
function engine(material, dark, y, radius = 0.3) {
  const group = new T.Group();
  group.position.y = y;
  const points = [[radius, -0.26], [radius * 0.93, -0.19], [radius * 0.5, 0.08], [radius * 0.35, 0.18]];
  const bell = mesh(new T.LatheGeometry(points.map(p => new T.Vector2(...p)), 32), material);
  bell.material = material;
  group.add(bell, drum(radius * 0.88, 0.025, dark, -0.22));
  for (let i = 0; i < 5; i++) group.add(hoop(radius * (0.54 + i * 0.1), material, 0.05 - i * 0.06, 0.009));
  return group;
}
function makeSatellite(gold, trim, ink) {
  const satellite = new T.Group(), panels = [];
  const solar = new T.MeshPhysicalMaterial({ color: '#173f8d', metalness: 0.68, roughness: 0.22, clearcoat: 0.8 });
  const cell = new T.MeshStandardMaterial({ color: '#326bc1', metalness: 0.55, roughness: 0.3, emissive: '#05265c', emissiveIntensity: 0.24 });
  satellite.add(block(0.57, 0.57, 0.5, gold, [0, 0, 0]));
  satellite.add(block(0.62, 0.045, 0.56, trim, [0, 0.3, 0]), block(0.62, 0.045, 0.56, trim, [0, -0.3, 0]));
  satellite.add(block(0.38, 0.38, 0.024, ink, [0, 0, 0.266]));
  const camera = drum(0.095, 0.14, trim, 0);
  camera.rotation.x = Math.PI / 2;
  camera.position.set(0, 0, 0.33);
  satellite.add(camera);
  const lens = mesh(new T.CircleGeometry(0.075, 24), new T.MeshPhysicalMaterial({ color: '#071e43', metalness: 0.45, roughness: 0.06, clearcoat: 1 }), [0, 0, 0.405]);
  satellite.add(lens);
  const dish = mesh(new T.SphereGeometry(0.23, 24, 10, 0, TAU, Math.PI * 0.55, Math.PI * 0.3), trim, [0, 0.44, 0]);
  dish.rotation.z = -0.25;
  satellite.add(dish, strut([0, 0.3, 0], [0.04, 0.64, 0], 0.016, trim));
  for (const side of [-1, 1]) {
    const hinge = new T.Group();
    hinge.position.x = side * 0.33;
    satellite.add(hinge);
    hinge.add(strut([0, 0, 0], [side * 0.23, 0, 0], 0.025, trim));
    hinge.add(block(1.14, 0.71, 0.038, trim, [side * 0.79, 0, 0]));
    hinge.add(block(1.09, 0.66, 0.045, solar, [side * 0.79, 0, 0]));
    const cells = new T.InstancedMesh(cube, cell, 40);
    const dummy = new T.Object3D();
    for (let row = 0; row < 5; row++) for (let col = 0; col < 8; col++) {
      dummy.position.set(side * (0.265 + col * 0.145), -0.265 + row * 0.132, 0.027);
      dummy.scale.set(0.129, 0.117, 0.005);
      dummy.updateMatrix();
      cells.setMatrixAt(row * 8 + col, dummy.matrix);
    }
    hinge.add(cells);
    hinge.rotation.y = side * Math.PI / 2;
    panels.push(hinge);
  }
  satellite.add(strut([-0.2, -0.23, 0], [-0.35, -0.58, 0], 0.009, trim));
  return { satellite, panels };
}

export async function create({ preview = false } = {}) {
  const root = new T.Group(), vehicle = new T.Group(), booster = new T.Group(), upperStage = new T.Group(), pad = new T.Group();
  root.add(pad, vehicle);
  vehicle.add(booster, upperStage);
  const cream = microfinish(mat('#f4ead2', 0.43, 0.12), 140, 0.08);
  const red = mat('#d6452e', 0.32, 0.2), dark = mat('#182331', 0.6, 0.4), silver = metal('#adb7bc');
  const gold = microfinish(mat('#cfa65d', 0.54, 0.67), 90, 0.19), concrete = mat('#aca69a', 0.95), padMetal = mat('#687780', 0.65, 0.35);
  silver.side = T.DoubleSide;
  booster.add(drum(0.48, 2.55, cream, -0.615));
  booster.add(drum(0.486, 0.38, red, -1.67), drum(0.482, 0.16, red, 0.42));
  const boosterEngine = engine(silver, dark, -2.24);
  booster.add(drum(0.41, 0.26, dark, -2.01, 0.48), boosterEngine);
  for (const y of [-1.83, -1.45, -0.95, 0.15, 0.66]) booster.add(hoop(0.484, y === 0.66 ? dark : silver, y, 0.014));
  const fins = new T.Shape();
  fins.moveTo(0.45, -1.03); fins.lineTo(0.99, -1.88); fins.lineTo(0.99, -2.12); fins.lineTo(0.45, -1.96); fins.closePath();
  const finGeometry = new T.ExtrudeGeometry(fins, { depth: 0.048, bevelEnabled: false });
  finGeometry.translate(0, 0, -0.024);
  for (let i = 0; i < 4; i++) booster.add(mesh(finGeometry, red, [0, 0, 0], [0, i * Math.PI / 2, 0]));
  const rivets = new T.InstancedMesh(pin, silver, 72), dummy = new T.Object3D();
  for (let i = 0; i < 72; i++) {
    const a = ((i % 24) / 24) * TAU;
    dummy.position.set(Math.sin(a) * 0.487, [-1.42, 0.12, 0.61][Math.floor(i / 24)], Math.cos(a) * 0.487);
    dummy.updateMatrix(); rivets.setMatrixAt(i, dummy.matrix);
  }
  booster.add(rivets);
  for (const angle of [-0.9, 2.2]) {
    booster.add(strut([Math.sin(angle) * 0.495, -1.42, Math.cos(angle) * 0.495], [Math.sin(angle) * 0.495, 0.08, Math.cos(angle) * 0.495], 0.022, red));
  }
  const wordmark = label('A S T E R', 0.68, 0.18, [0, -0.14, 0.487], { width: 768, height: 192, size: 74, color: '#1b2c3e' });
  const number = label('01', 0.45, 0.45, [0, -0.68, 0.49], { size: 136, color: '#d6452e' });
  booster.add(wordmark, number);
  upperStage.add(drum(0.46, 1.32, cream, 1.37));
  upperStage.add(drum(0.465, 0.14, red, 1.68), drum(0.47, 0.13, dark, 0.75));
  upperStage.add(hoop(0.464, silver, 1.94), hoop(0.464, silver, 0.87));
  const upperEngine = engine(silver, dark, 0.5, 0.22);
  upperEngine.visible = false;
  upperStage.add(upperEngine);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    const vent = block(0.034, 0.22, 0.014, dark, [Math.sin(a) * 0.467, 1.13, Math.cos(a) * 0.467]);
    vent.rotation.y = a;
    upperStage.add(vent);
  }
  const fairings = [];
  const profile = [[0.52, 0], [0.545, 0.11], [0.545, 0.56], [0.5, 0.78], [0.41, 1.0], [0.24, 1.21], [0.008, 1.38]];
  const shellMaterial = cream.clone(); shellMaterial.side = T.DoubleSide;
  for (let i = 0; i < 2; i++) {
    const shell = new T.Group(); shell.position.y = 2;
    shell.add(mesh(new T.LatheGeometry(profile.map(p => new T.Vector2(...p)), 28, i * Math.PI, Math.PI), shellMaterial));
    shell.add(mesh(new T.CylinderGeometry(0.548, 0.548, 0.13, 28, 1, true, i * Math.PI, Math.PI), red, [0, 0.35, 0]));
    upperStage.add(shell); fairings.push(shell);
  }
  const { satellite, panels } = makeSatellite(gold, silver, dark);
  satellite.position.y = 2.53; satellite.scale.setScalar(0.56);
  upperStage.add(satellite);

  // The launch structure belongs to the preview; exhaust is revealed by the story.
  pad.add(drum(1.52, 0.2, concrete, -2.73), drum(1.32, 0.045, dark, -2.61));
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU;
    const stripe = block(0.18, 0.018, 0.13, i % 2 ? cream : red, [Math.sin(a) * 1.38, -2.615, Math.cos(a) * 1.38]);
    stripe.rotation.y = a; pad.add(stripe);
  }
  for (const x of [-1.24, -0.94]) pad.add(strut([x, -2.65, -0.52], [x, 2.31, -0.52], 0.035, padMetal));
  for (let i = 0; i < 8; i++) {
    const y = -2.5 + i * 0.63;
    pad.add(strut([-1.24, y, -0.52], [-0.94, y + 0.56, -0.52], 0.018, padMetal));
    pad.add(strut([-1.24, y + 0.56, -0.52], [-0.94, y, -0.52], 0.018, padMetal));
    pad.add(block(0.4, 0.06, 0.33, padMetal, [-1.09, y, -0.52]));
  }
  pad.add(block(0.8, 0.085, 0.22, red, [-0.72, 1.83, -0.52]));
  const lamp = mat('#e4874e', 0.4); lamp.emissive.set('#ff5725'); lamp.emissiveIntensity = 1.6;
  pad.add(mesh(new T.SphereGeometry(0.065, 12, 8), lamp, [-1.09, 2.39, -0.52]));

  // Anchor the flame at the bell's exit so it inherits the separating booster pose.
  const plume = new T.Group();
  plume.position.y = -0.26;
  boosterEngine.add(plume);
  const flameMaterials = ['#f26022', '#ffb239', '#fff1a2'].map(color => new T.MeshBasicMaterial({ color, transparent: true, depthWrite: false, opacity: 0.9 }));
  for (let i = 0; i < 3; i++) {
    const flame = mesh(new T.ConeGeometry(0.26 - i * 0.066, 1.85 - i * 0.4, 24), flameMaterials[i], [0, -(1.85 - i * 0.4) / 2, 0], [0, 0, Math.PI]);
    flame.castShadow = false; plume.add(flame);
  }
  plume.visible = false;
  plume.scale.setScalar(0.001);
  if (preview) root.rotation.y = -0.15;
  return { root, parts: { vehicle, booster, boosterEngine, upperStage, upperEngine, fairings, satellite, panels, pad, plume, flameMaterials } };
}
