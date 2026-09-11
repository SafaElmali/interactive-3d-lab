import { create } from './scene.js';
import {
  T,
  rig,
  pose,
  sample,
  smooth,
  colorAt,
} from '../../shared/choreography.js';
export const story = {
  theme: 'drive',
  colors: ['#131b20', '#cfef48', '#253b4d', '#111820'],
  inks: ['#d7f16e', '#22301b', '#edf2ed', '#d7f16e'],
  chapters: [
    {
      title: 'AFTER HOURS.',
      label: 'The night is yours',
      text: 'Nowhere to be. Every reason to go.',
    },
    {
      title: '<span>IN THE</span><span>LIGHT.</span>',
      label: 'Passing through',
      text: 'A new angle at every turn.',
    },
    {
      title: '<span>KEEP</span><span>MOVING.</span>',
      label: 'The long way',
      text: 'Watch the world become a blur.',
      layout: 'right',
    },
    {
      title: 'ONE MORE LAP.',
      label: 'After the last light',
      text: 'Some nights deserve an encore.',
    },
  ],
};
export async function createStory({ lights, scene } = {}) {
  const model = await create(),
    root = new T.Group(),
    car = rig(model, 5.5);
  root.add(car);
  const { paint, enabled } = model.parts;
  enabled.value = 1;
  const lines = new T.Group();
  root.add(lines);
  const roadMaterial = new T.MeshBasicMaterial({
    color: '#cfe777',
    transparent: true,
    opacity: 0.45,
  });
  const marks = new T.InstancedMesh(
    new T.BoxGeometry(0.035, 0.035, 2.8),
    roadMaterial,
    44,
  );
  const dummy = new T.Object3D();
  marks.frustumCulled = false;
  lines.add(marks);
  const gateMaterial = new T.MeshBasicMaterial({
    color: '#d7ed92',
    transparent: true,
    opacity: 0.3,
  });
  const gates = [];
  for (let i = 0; i < 7; i++) {
    const gate = new T.Group();
    for (const x of [-3.4, 3.4]) {
      const pole = new T.Mesh(new T.BoxGeometry(0.045, 5, 0.045), gateMaterial);
      pole.position.set(x, 1.2, 0);
      gate.add(pole);
    }
    const top = new T.Mesh(new T.BoxGeometry(6.85, 0.045, 0.045), gateMaterial);
    top.position.y = 3.7;
    gate.add(top);
    gates.push(gate);
    lines.add(gate);
  }
  return {
    root,
    update(p, t, ctx) {
      pose(
        car,
        sample(
          [
            { x: 0.4, y: -0.65, z: 0, rx: 0.2, ry: -0.3, rz: -0.035, s: 1.02 },
            { x: 2.2, y: -0.5, z: 0.1, rx: 0.5, ry: 1.4, rz: 0.1, s: 0.97 },
            {
              x: -2.1,
              y: -0.45,
              z: 0.4,
              rx: 0.22,
              ry: 3.8,
              rz: -0.04,
              s: 1.08,
            },
            {
              x: 0.5,
              y: -0.6,
              z: 0,
              rx: 0.15,
              ry: Math.PI * 2 - 0.3,
              rz: 0,
              s: 1.08,
            },
          ],
          p,
        ),
        ctx,
      );
      colorAt(['#bedc48', '#d45131', '#a4c9df', '#bedc48'], p, paint.value);
      lines.rotation.y = -0.13 + Math.sin(p * Math.PI * 2) * 0.1;
      const speed = p * 70 + t * 0.18;
      for (let i = 0; i < 44; i++) {
        dummy.position.set(
          ((i % 4) - 1.5) * 2.5,
          -1.65,
          ((Math.floor(i / 4) * 4 + speed) % 44) - 35,
        );
        dummy.updateMatrix();
        marks.setMatrixAt(i, dummy.matrix);
      }
      marks.instanceMatrix.needsUpdate = true;
      gates.forEach((gate, i) => {
        gate.position.z = ((i * 7 + speed * 0.65) % 49) - 44;
      });
      const bright = smooth(0.08, 0.32, p) * (1 - smooth(0.34, 0.6, p));
      roadMaterial.color.set(bright > 0.5 ? '#324417' : '#cfe777');
      gateMaterial.color.copy(roadMaterial.color);
      gateMaterial.opacity = 0.12 + 0.15 * (1 - bright);
      if (lights) {
        lights.rim.intensity = 3;
        lights.rim.color.set('#badbff');
        scene.environmentIntensity = 0.9;
      }
    },
  };
}
