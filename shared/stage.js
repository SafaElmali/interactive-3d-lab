import * as T from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
export function makeRenderer(canvas) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const pmrem = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  room.dispose();
  pmrem.dispose();
  return { renderer, environment };
}
export function makeScene(background, environment) {
  const scene = new T.Scene();
  scene.background = new T.Color(background);
  scene.environment = environment;
  scene.add(new T.HemisphereLight('#ffffff', '#737985', 2.1));
  const key = new T.DirectionalLight('#fff7e9', 3.2);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -6,
    right: 6,
    top: 6,
    bottom: -6,
    near: 0.1,
    far: 30,
  });
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new T.DirectionalLight('#cfddff', 1.4);
  rim.position.set(-4, 2, -5);
  scene.add(rim);
  return { scene, key, rim };
}
export function setupModel(scene, model) {
  scene.add(model.root);
  const b = new T.Box3().setFromObject(model.root),
    c = b.getCenter(new T.Vector3());
  model.root.position.sub(c);
  b.setFromObject(model.root);
  const floor = new T.Mesh(
    new T.PlaneGeometry(200, 200),
    new T.ShadowMaterial({ opacity: 0.16 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = b.min.y - 0.04;
  floor.receiveShadow = true;
  scene.add(floor);
  return b;
}
export function fitCamera(
  camera,
  bounds,
  aspect,
  angle = [4, 2.5, 5],
  padding = 1.18,
) {
  const size = bounds.getSize(new T.Vector3());
  const radius = Math.max(size.x, size.y, size.z) / 2;
  const vertical = (camera.fov * Math.PI) / 180,
    horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
  const distance =
    (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * padding;
  camera.aspect = aspect;
  camera.position
    .set(...angle)
    .normalize()
    .multiplyScalar(distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}
export function orbit(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 24;
  controls.maxPolarAngle = Math.PI * 0.88;
  controls.dampingFactor = 0.065;
  controls.saveState();
  return controls;
}
