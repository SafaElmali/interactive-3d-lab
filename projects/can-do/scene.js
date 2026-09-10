import { T, metal, cylinder, torus } from '../../shared/geometry.js';
export async function create() {
  const root = new T.Group();
  const loader = new T.TextureLoader();
  const textures = await Promise.all(
    ['sprite', 'fanta', 'pepsi'].map((name) =>
      loader.loadAsync(
        new URL(`./assets/brands/${name}.jpg`, import.meta.url).href,
      ),
    ),
  );
  textures.forEach((texture, i) => {
    texture.colorSpace = T.SRGBColorSpace;
    const can = new T.Group();
    can.position.set((i - 1) * 1.05, 0, i === 1 ? 0.3 : 0);
    can.rotation.z = (i - 1) * -0.1;
    const material = new T.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.18,
      clearcoat: 0.9,
    });
    const body = cylinder(0.48, 1.5, material, [0, 0, 0]);
    body.rotation.y = Math.PI;
    can.add(body);
    const aluminum = metal('#bdc3bd');
    can.add(cylinder(0.44, 0.035, aluminum, [0, 0.76, 0]));
    can.add(torus(0.44, 0.025, aluminum, [0, 0.77, 0]));
    can.add(torus(0.44, 0.025, aluminum, [0, -0.76, 0]));
    const tab = torus(0.075, 0.026, aluminum, [0, 0.79, 0.04]);
    tab.scale.set(0.6, 1, 1);
    can.add(tab);
    root.add(can);
  });
  return { root, angle: [2, 1.3, 6] };
}
