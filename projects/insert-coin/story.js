import { create, createGameWorld } from './scene.js';
import { T, rig, pose, sample, smooth, mix } from '../../shared/choreography.js';

export const story = {
  theme: 'arcade',
  colors: ['#211954', '#090e21', '#242568', '#31164f'],
  inks: ['#d7ff70', '#d6f8ff', '#edb4ff', '#ceff70'],
  chapters: [
    {
      title: '<span>INSERT</span><span><em>COIN.</em></span>',
      label: 'A world in a cabinet',
      text: 'Painted panels. Six bright buttons. One small invitation to another dimension.',
    },
    {
      title: '<span>POWER</span><span>ON.</span>',
      label: 'Meet you at the screen',
      text: 'A flicker becomes a horizon. The glass warms up. Orbit Run is ready when you are.',
    },
    {
      title: '<span>OUT OF</span><span>BOUNDS.</span>',
      label: 'Beyond the pixels',
      text: 'Platforms find their depth. A little ship slips through the glass. The whole room is a level.',
      layout: 'right',
    },
    {
      title: '<span>ONE MORE</span><span><em>WORLD.</em></span>',
      label: 'Stay for the high score',
      text: 'Follow the bright things. Take the long way home. There is always another orbit.',
    },
  ],
};

export async function createStory() {
  const model = await create();
  const cabinet = rig(model, 4.8), root = new T.Group();
  const game = createGameWorld(model.parts.materials);
  root.add(cabinet, game.root);
  const {
    chassis, sides, deck, monitor, marquee, joystick, buttons, screenUI,
    screenRunner, screenCoins, screenMaterial, bootLine, bootMaterial, scanlines,
    materials,
  } = model.parts;
  const homes = new Map([chassis, ...sides, deck, monitor, marquee].map((part) => [part, {
    position: part.position.clone(), rotation: part.rotation.clone(),
  }]));
  const moves = [
    [chassis, [0, -0.26, -0.14], [0, 0.04, 0]],
    [sides[0], [-0.53, 0.06, 0], [0, -0.09, -0.065]],
    [sides[1], [0.53, 0.06, 0], [0, 0.09, 0.065]],
    [deck, [0, -0.13, 0.64], [0.13, 0, 0]],
    [monitor, [0, 0.18, 0.44], [-0.1, 0, 0]],
    [marquee, [0, 0.62, 0.13], [0.03, 0, 0]],
  ];
  const particle = new T.Object3D();
  return {
    root,
    update(progress, time, context = {}) {
      const t = context.reduced ? 0 : time;
      const assemble = 1 - smooth(0.0, 0.19, progress);
      const boot = smooth(0.17, 0.34, progress);
      const spill = smooth(0.40, 0.70, progress);
      const finale = smooth(0.75, 1, progress);
      const composition = sample([
        { x: 0.55, y: -0.52, z: -0.4, rx: 0.06, ry: -0.43, rz: -0.065, s: 0.92 },
        { x: 1.52, y: -0.37, z: 0.15, rx: 0.08, ry: -0.13, rz: 0.025, s: 1.03 },
        { x: -1.8, y: -0.19, z: -0.55, rx: 0.055, ry: 0.39, rz: -0.08, s: 0.74 },
        { x: 0.45, y: -0.42, z: -0.5, rx: 0.055, ry: -0.42, rz: 0.03, s: 0.86 },
      ], progress);
      composition.y += Math.sin(t * 0.7) * 0.018;
      pose(cabinet, composition, context);
      moves.forEach(([part, offset, rotation]) => {
        const home = homes.get(part);
        part.position.set(...offset.map((v, i) => home.position.getComponent(i) + v * assemble));
        part.rotation.set(home.rotation.x + rotation[0] * assemble,
          home.rotation.y + rotation[1] * assemble, home.rotation.z + rotation[2] * assemble);
      });
      joystick.rotation.set(0.035 * Math.sin(t * 1.3) * boot, 0, -0.09 * Math.sin(progress * Math.PI * 5) * boot);
      buttons.forEach((button, i) => {
        button.position.y = 0.127 - Math.max(0, Math.sin(progress * 24 - i * 0.9)) * 0.022 * boot;
      });
      screenUI.visible = boot > 0.02;
      screenUI.scale.set(1, Math.max(0.001, boot), 1);
      screenUI.position.set(0, 0, 0);
      screenMaterial.emissiveIntensity = mix(0.015, 0.9, boot);
      screenMaterial.color.set('#071817').lerp(new T.Color('#214a3e'), boot);
      screenMaterial.emissive.copy(screenMaterial.color);
      scanlines.material.opacity = boot * 0.14;
      bootLine.visible = progress > 0.17 && progress < 0.34;
      bootLine.scale.set(0.18 + Math.sin(boot * Math.PI) * 0.82, 1 + Math.sin(boot * Math.PI) * 2.6, 1);
      bootMaterial.emissiveIntensity = 1 + Math.sin(boot * Math.PI) * 1.8;
      screenRunner.visible = spill < 0.75;
      screenRunner.position.set(-0.19 + Math.sin(t * 0.6) * 0.06 * boot, -0.09, 0.04);
      screenRunner.rotation.set(0, 0, -Math.sin(t * 0.6) * 0.12 * boot);
      screenCoins.forEach((coin, i) => {
        coin.rotation.set(0, t * 0.5 + i * 0.25, Math.PI / 4);
        coin.visible = spill < 0.75;
      });
      materials.pink.emissiveIntensity = 0.6 + finale * 1.5 + Math.sin(t * 1.4) * 0.07;
      materials.cyan.emissiveIntensity = 0.55 + finale * 1.1;
      materials.lime.emissiveIntensity = 0.4 + finale * 0.6;

      game.root.visible = spill > 0.001;
      game.root.position.set(context.mobile ? 0.07 : 0.2, -0.24, 0.65);
      game.root.rotation.set(-0.06, mix(-0.14, 0.04, finale), 0);
      game.root.scale.setScalar(Math.max(0.001, spill));
      game.runner.position.set(mix(-1.04, 1.37, spill) - finale * 2.7,
        mix(0.74, 0.17, spill) + finale * 0.67 + Math.sin(t * 1.35) * 0.07 * spill,
        mix(-0.03, 0.72, spill) + finale * 0.1);
      game.runner.rotation.set(-0.1, 0.21 + Math.sin(t * 0.7) * 0.08, mix(-0.32, 0.08, finale));
      game.runner.scale.setScalar(0.88 + spill * 0.26);
      game.platforms.forEach((platform, i) => {
        const reveal = smooth(0.42 + i * 0.018, 0.63 + i * 0.013, progress);
        const x = -0.57 + i * 0.63;
        const y = -0.56 + Math.sin(i * 0.83) * 0.44;
        const orbitAngle = -2.5 + i * 0.88;
        platform.position.set(mix(-1.22, mix(x, Math.cos(orbitAngle) * 2.18, finale), reveal),
          mix(0.7, mix(y, Math.sin(orbitAngle) * 1.74 - 0.06, finale), reveal),
          mix(-0.40, 0.10 + Math.sin(i * 0.68) * 0.44 - finale * 0.4, reveal));
        platform.rotation.set(0.19 + finale * 0.05, mix(-0.34, 0.23 + i * 0.14, reveal),
          Math.sin(i * 1.7) * 0.055 + finale * 0.07 * Math.sin(i));
        platform.scale.setScalar(Math.max(0.001, reveal) * mix(1, 0.65, finale));
        platform.visible = reveal > 0.001;
      });
      game.coins.forEach((coin, i) => {
        const a = i / 9 * Math.PI * 2 - 0.4;
        const reveal = smooth(0.48 + i * 0.012, 0.62 + i * 0.009, progress);
        coin.position.set(mix(0.15 + i * 0.28, Math.cos(a) * 2.58, finale),
          mix(0.47 + Math.sin(i * 0.66) * 0.53, Math.sin(a) * 2.12, finale) + Math.sin(t * 1.1 + i) * 0.035,
          0.49 + Math.sin(i) * 0.13);
        coin.rotation.set(0.17, t * 0.9 + i * 0.7, Math.PI / 4);
        coin.scale.setScalar(Math.max(0.001, reveal));
        coin.visible = reveal > 0.001;
      });
      game.portals.forEach((portal, i) => {
        const reveal = smooth(0.51 + i * 0.036, 0.69 + i * 0.018, progress);
        portal.position.set(mix(0.17 + i * 0.86, 0.23, finale),
          mix(0.32 + Math.sin(i) * 0.33, -0.14, finale),
          mix(0.08 - i * 0.16, -1.65 - i * 0.35, finale));
        portal.rotation.set(0, mix(0.25, -0.1, finale), (i % 2 ? -1 : 1) * 0.14 + finale * i * 0.12);
        portal.scale.setScalar(Math.max(0.001, reveal) * mix(0.85, 3.15 + i * 0.53, finale));
        portal.visible = reveal > 0.001;
      });
      for (let i = 0; i < game.sparks.count; i++) {
        const a = i * 2.399963;
        const radius = 1.08 + (i % 7) * 0.18 + finale * 0.55;
        particle.position.set(Math.cos(a) * radius + (1 - finale) * 0.5,
          Math.sin(a) * radius * 0.85 + Math.sin(t * 0.8 + i) * 0.035,
          -0.16 + Math.sin(i * 2.1) * 0.45);
        particle.rotation.set(i * 0.4, i * 0.2, a + t * 0.1);
        particle.scale.setScalar(spill * (0.4 + (i % 3) * 0.35));
        particle.updateMatrix();
        game.sparks.setMatrixAt(i, particle.matrix);
      }
      game.sparks.instanceMatrix.needsUpdate = true;
    },
  };
}
