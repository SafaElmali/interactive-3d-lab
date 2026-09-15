import { create, createFilm } from './scene.js';
import { T, rig, pose, sample, smooth, mix } from '../../shared/choreography.js';

export const story = {
  theme: 'exposure',
  colors: ['#a73c2d', '#d6c5a8', '#772c22', '#c9482f'],
  inks: ['#f8e7c7', '#302c24', '#f8e7c7', '#ffe9c5'],
  chapters: [
    {
      title: '<span>LIGHT /</span><span><em>LEAK.</em></span>',
      label: 'A little light. A lasting image.',
      text: 'Thirty-six chances to notice something. A camera made for slowing down.',
    },
    {
      title: '<span>LOOK</span><span>CLOSER.</span>',
      label: 'The optical path',
      text: 'Machined rings. Curved glass. A whole world, gathered into a single point.',
    },
    {
      title: '<span>LET IT</span><span>IN.</span>',
      label: 'An opening in time',
      text: 'Eight blades turn. The aperture opens. For a fraction of a second, everything is light.',
      layout: 'right',
    },
    {
      title: '<span>KEEP THE</span><span><em>FEELING.</em></span>',
      label: 'Five small memories',
      text: 'A dune. A skyline. A quiet shore. Some moments deserve a place on film.',
    },
  ],
};

export async function createStory() {
  const model = await create(), cameraRig = rig(model, 4.75);
  const root = new T.Group(), film = createFilm();
  root.add(cameraRig, film.root);
  const { body, layers, homes, iris, setAperture, release } = model.parts;
  // A tiny warm image plane is visible through the opened iris.
  const light = new T.Mesh(
    new T.CircleGeometry(0.55, 64),
    new T.MeshBasicMaterial({ color: '#f1b974' }),
  );
  light.position.z = -0.011;
  iris.add(light);
  let lastAperture = -1;
  return {
    root,
    update(progress, time, context = {}) {
      const focus = smooth(0.38, 0.62, progress) * (1 - smooth(0.72, 0.84, progress));
      const separation = smooth(0.13, 0.31, progress) * (1 - smooth(0.73, 0.87, progress));
      const filmReveal = smooth(0.76, 0.99, progress);
      const motionTime = context.reduced ? 0 : time;
      const composition = sample([
        { x: 0.65, y: -0.24, z: 0, rx: -0.13, ry: -0.38, rz: -0.10, s: 1.04 },
        { x: 1.58, y: -0.12, z: -0.8, rx: -0.22, ry: -0.69, rz: 0.16, s: 0.86 },
        { x: -1.62, y: -0.1, z: -0.25, rx: 0.015, ry: 0.08, rz: -0.10, s: 1.04 },
        { x: -2.22, y: 0.28, z: -0.25, rx: -0.1, ry: -0.28, rz: -0.1, s: 0.45 },
      ], progress);
      composition.y += Math.sin(motionTime * 0.6) * 0.025 * (1 - filmReveal);
      pose(cameraRig, composition, context);
      body.position.set(focus * 1.9, focus * 0.65, -focus * 0.8);
      body.scale.setScalar(1 - focus * 0.97);
      body.visible = focus < 0.999;
      layers.forEach((part, i) => {
        part.position.set(
          focus * (i % 2 ? 1.42 : -1.28),
          focus * ((i < 2 ? 1 : -1) * 1.18),
          homes[i] + separation * (0.28 + i * 0.61) - focus * 2.2,
        );
        part.rotation.set(focus * (i % 2 ? 0.32 : -0.22), focus * 0.4, separation * i * 0.045);
        part.scale.setScalar(1 - focus * 0.68);
        part.visible = focus < 0.985;
      });
      iris.position.z = 1.17 + focus * 0.34;
      iris.scale.setScalar(1 + focus * 2.05);
      iris.rotation.z = focus * 0.22;
      const opening = mix(0.22, 0.98, smooth(0.45, 0.68, progress)) * (1 - smooth(0.8, 0.96, progress) * 0.76);
      if (Math.abs(opening - lastAperture) > 0.000001) {
        setAperture(opening);
        lastAperture = opening;
      }
      light.scale.setScalar(0.95);
      light.visible = focus > 0.15;
      release.position.y = 1.38 - smooth(0.52, 0.59, progress) * (1 - smooth(0.69, 0.74, progress)) * 0.045;
      film.root.visible = progress > 0.755;
      film.root.position.set(context.mobile ? 0.15 : 0.38, -0.95, 1.4);
      film.root.rotation.z = -0.045;
      film.frames.forEach((frame, i) => {
        const reveal = smooth(0.765 + i * 0.026, 0.875 + i * 0.026, progress);
        const targetX = -2.43 + i * 1.215;
        const targetY = Math.sin(i * 0.61) * 0.37;
        frame.position.set(
          mix(-2.4, targetX, reveal),
          mix(0.98, targetY, reveal),
          mix(-0.7 - i * 0.06, -0.10 * Math.cos(i * 0.7), reveal),
        );
        frame.rotation.set(
          0.035 * Math.sin(i),
          mix(-1.28, 0.1 * Math.sin(i * 0.75), reveal),
          mix(-0.75, Math.cos(i * 0.61) * 0.16, reveal),
        );
        frame.scale.setScalar(mix(0.06, 1, reveal));
      });
    },
  };
}
