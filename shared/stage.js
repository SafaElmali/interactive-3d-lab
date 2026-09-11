import * as T from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { RGBELoader } from '../vendor/RGBELoader.js';
export async function makeRenderer(canvas) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const pmrem = new T.PMREMGenerator(renderer);
  let environment;
  try {
    const hdri = await new RGBELoader().loadAsync(
      new URL(
        '../assets/materials/studio_small_08/studio_small_08_1k.hdr',
        import.meta.url,
      ).href,
    );
    environment = pmrem.fromEquirectangular(hdri);
    hdri.dispose();
  } catch (error) {
    console.warn(
      'Studio environment unavailable; using local lighting.',
      error,
    );
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.02);
    room.dispose();
  }
  pmrem.dispose();
  return { renderer, environment };
}
export function makeScene(background, environment) {
  const scene = new T.Scene();
  scene.background = new T.Color(background);
  scene.environment = environment;
  scene.environmentIntensity = 0.75;
  scene.environmentRotation.y = 0.45;
  scene.add(new T.HemisphereLight('#dce5ed', '#16191c', 0.42));
  const key = new T.DirectionalLight('#fff2dc', 2.7);
  key.position.set(-3.5, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {
    left: -6,
    right: 6,
    top: 6,
    bottom: -6,
    near: 0.1,
    far: 30,
  });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 3;
  scene.add(key);
  const rim = new T.DirectionalLight('#c9dcff', 1.7);
  rim.position.set(4, 2.5, -4);
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
