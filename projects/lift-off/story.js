import { create } from './scene.js';
import { T, pose, sample, smooth, mix, particles } from '../../shared/choreography.js';

export const story = {
  theme: 'lift',
  colors: ['#e9e1ce', '#d56739', '#163166', '#091b46'],
  inks: ['#21303b', '#251a17', '#fff0d4', '#eee5ca'],
  chapters: [
    { title: 'LIFT OFF.', label: 'Aster 01 / On the pad', text: 'A small vessel. An unreasonable amount of possibility.' },
    { title: '<span>GO FOR</span><span>LAUNCH.</span>', label: 'The first few seconds', text: 'Light the engine. Leave the familiar behind.' },
    { title: '<span>LET</span><span>GO.</span>', label: 'A little less gravity', text: 'One stage falls away. The next chapter opens.', layout: 'right' },
    { title: 'WIDE OPEN.', label: 'A new point of view', text: 'Wings to the sun. A whole world beneath you.' },
  ],
};

function globe() {
  const earth = new T.Group();
  const radius = 7.8;
  const ocean = new T.Mesh(new T.SphereGeometry(radius, 64, 40), new T.MeshStandardMaterial({ color: '#155aa0', metalness: 0.12, roughness: 0.85, emissive: '#10346f', emissiveIntensity: 0.28 }));
  earth.add(ocean);
  const point = (x, y, r = radius + 0.028) => {
    const lon = x * Math.PI / 180, lat = y * Math.PI / 180;
    return new T.Vector3(Math.sin(lon) * Math.cos(lat) * r, Math.sin(lat) * r, Math.cos(lon) * Math.cos(lat) * r);
  };
  const land = new T.MeshStandardMaterial({ color: '#559c91', roughness: 1, emissive: '#164953', emissiveIntensity: 0.22, side: T.DoubleSide });
  // Abstract landforms, tessellated on the sphere so the silhouette stays curved.
  const shapes = [
    [[-52, 57], [-39, 69], [-15, 61], [4, 51], [-3, 41], [-17, 37], [-19, 24], [-33, 26], [-46, 40]],
    [[6, 33], [21, 43], [37, 38], [40, 19], [28, 6], [14, 15]],
    [[-10, -3], [9, -9], [15, -27], [4, -44], [-5, -31], [-15, -15]],
    [[51, 47], [74, 53], [79, 30], [64, 23], [50, 33]],
  ];
  for (const outline of shapes) {
    const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length;
    const cy = outline.reduce((s, p) => s + p[1], 0) / outline.length;
    const vertices = [];
    const addTriangle = (a, b, c, n) => {
      if (n) {
        const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
        addTriangle(a, ab, ca, n - 1); addTriangle(ab, b, bc, n - 1); addTriangle(ca, bc, c, n - 1); addTriangle(ab, bc, ca, n - 1);
      } else for (const p of [a, b, c]) vertices.push(...point(...p).toArray());
    };
    for (let i = 0; i < outline.length; i++) addTriangle([cx, cy], outline[i], outline[(i + 1) % outline.length], 2);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.computeVertexNormals();
    earth.add(new T.Mesh(geometry, land));
  }
  const clouds = new T.MeshBasicMaterial({ color: '#ecf3e6', transparent: true, opacity: 0.65, depthWrite: false });
  for (let i = 0; i < 12; i++) {
    const longitude = -76 + (i % 4) * 43, latitude = 19 + Math.floor(i / 4) * 19;
    const path = Array.from({ length: 8 }, (_, j) => point(longitude + j * 3.3, latitude + Math.sin(j * 0.5 + i) * 2.1, radius + 0.075));
    earth.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(path), 16, 0.04 + (i % 3) * 0.025, 5, false), clouds));
  }
  earth.add(new T.Mesh(new T.SphereGeometry(radius + 0.1, 64, 32), new T.MeshBasicMaterial({ color: '#68bcef', transparent: true, opacity: 0.15, side: T.BackSide, depthWrite: false })));
  return earth;
}

export async function createStory({ scene, lights } = {}) {
  const model = await create(), root = new T.Group();
  root.add(model.root);
  const { vehicle, booster, upperStage, upperEngine, fairings, satellite, panels, pad, plume } = model.parts;
  const stageHardware = upperStage.children
    .filter(object => object !== satellite && !fairings.includes(object))
    .map(object => ({ object, y: object.position.y }));
  const stars = particles(170, '#d8e8ff', 0.026);
  for (let i = 0; i < 170; i++) {
    stars.positions[i * 3] = Math.sin(i * 83.13 + 0.7) * 12;
    stars.positions[i * 3 + 1] = Math.cos(i * 32.77) * 8;
    stars.positions[i * 3 + 2] = -8 - i % 7;
  }
  root.add(stars.object);
  const earth = globe(); root.add(earth);
  const smokeMaterial = new T.MeshStandardMaterial({ color: '#eed4ad', transparent: true, opacity: 0.6, roughness: 1, depthWrite: false });
  const smoke = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), smokeMaterial, 18);
  smoke.frustumCulled = false; root.add(smoke);
  const dummy = new T.Object3D();
  const hemisphere = scene?.children.find(node => node.isHemisphereLight);
  return {
    root,
    update(p, time, ctx = {}) {
      const t = ctx.reduced ? 0 : time;
      const ignition = smooth(0.11, 0.3, p);
      const leaving = smooth(0.19, 0.46, p);
      const separate = smooth(0.43, 0.67, p);
      const reveal = smooth(0.56, 0.81, p);
      const orbit = smooth(0.72, 0.96, p);
      pose(model.root, sample([
        { x: 0.75, y: -0.25, rx: 0.06, ry: -0.3, rz: -0.08, s: 0.86 },
        { x: 1.7, y: 0.6, rx: 0.02, ry: 0.25, rz: -0.17, s: 0.83 },
        { x: -1.5, y: 0.45, rx: 0.04, ry: -0.3, rz: -0.35, s: 0.76 },
        { x: 0.55, y: 0.4, rx: 0.04, ry: -0.12, rz: 0.04, s: 0.93 },
      ], p), ctx);
      vehicle.position.set(0, -orbit * 2.4, 0);
      // Every transform is written from scroll, including all hidden/restored parts.
      booster.position.set(-separate * 1.35, -separate * 2.3 - orbit * 4.5, 0);
      booster.rotation.set(separate * 0.12, 0, separate * 0.42);
      booster.visible = p < 0.85;
      upperStage.position.set(0, separate * 0.48 - orbit * 0.5, 0);
      upperStage.rotation.set(0, 0, 0);
      upperEngine.visible = separate > 0.02;
      // Body separates from the exposed payload during the handover to orbit.
      for (const { object, y } of stageHardware) {
        object.position.y = y - orbit * 4;
        object.visible = orbit < 0.99;
      }
      upperEngine.visible = separate > 0.02 && orbit < 0.99;
      fairings.forEach((shell, i) => {
        const side = i === 0 ? 1 : -1;
        shell.position.set(side * reveal * 2.5, 2 + reveal * 0.2 - orbit * 2, -reveal * 0.3);
        shell.rotation.set(0, 0, -side * reveal * 0.85);
        shell.visible = orbit < 0.98;
      });
      satellite.position.set(orbit * 0.05, 2.53 + orbit * 0.6, orbit * 0.7);
      satellite.rotation.set(-orbit * 0.12, -orbit * 0.24, orbit * 0.1);
      satellite.scale.setScalar(mix(0.56, 1.58, orbit));
      panels.forEach((panel, i) => panel.rotation.y = (i === 0 ? -1 : 1) * (1 - smooth(0.78, 0.99, p)) * Math.PI / 2);
      pad.position.set(0, -leaving * 7, 0);
      pad.visible = leaving < 0.995;
      plume.visible = ignition > 0.005 && separate < 0.98;
      const flicker = ctx.reduced ? 1 : 1 + Math.sin(t * 19) * 0.07 + Math.sin(t * 31) * 0.025;
      plume.scale.set(ignition, ignition * (1.1 + leaving * 0.7) * flicker, ignition);
      smoke.visible = ignition > 0 && leaving < 0.97;
      smokeMaterial.opacity = ignition * (1 - leaving) * 0.55;
      for (let i = 0; i < 18; i++) {
        const a = i * 2.39996, spread = ignition * (0.8 + i % 4 * 0.35);
        dummy.position.set(Math.cos(a) * spread + (ctx.mobile ? 0.2 : 0.8), -2.4 + (i % 3) * 0.18 - leaving * 2, Math.sin(a) * spread);
        dummy.scale.setScalar((0.25 + (i % 4) * 0.11) * ignition);
        dummy.rotation.set(i * 0.4, i, i * 0.3); dummy.updateMatrix(); smoke.setMatrixAt(i, dummy.matrix);
      }
      smoke.instanceMatrix.needsUpdate = true;
      stars.object.material.opacity = smooth(0.36, 0.7, p) * 0.7;
      earth.visible = reveal > 0.001;
      earth.position.set(0, mix(-14, -9.3, reveal), -4.3);
      earth.rotation.set(-0.2, -0.2 + orbit * 0.18, -0.22);
      if (lights) {
        lights.key.intensity = mix(2.7, 2.2, orbit);
        lights.key.color.set('#fff0d4').lerp(new T.Color('#f7ecdb'), orbit);
        lights.rim.intensity = mix(1.5, 2.4, reveal);
        lights.rim.color.set('#f0b287').lerp(new T.Color('#87bdff'), reveal);
        if (hemisphere) hemisphere.intensity = mix(0.42, 0.28, reveal);
      }
    },
  };
}
