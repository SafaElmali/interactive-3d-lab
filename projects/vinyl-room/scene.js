import {
  T,
  mat,
  metal,
  box,
  cylinder,
  torus,
  tube,
  label,
} from '../../shared/geometry.js';
import { surface, microfinish } from '../../shared/materials.js';
export async function create({ preview = false } = {}) {
  const root = new T.Group();
  const wood = await surface(mat('#ffffff', 0.7), 'wood', {
    repeat: [0.32, 0.65],
    strength: 0.3,
  });
  wood.clearcoat = 0.65;
  wood.clearcoatRoughness = 0.28;
  root.add(box(4.4, 0.43, 3.35, wood, [0, 0, 0], 0.14));
  root.add(
    box(
      4.3,
      0.08,
      3.24,
      microfinish(mat('#232725', 0.37), 230, 0.08),
      [0, 0.255, 0],
      0.1,
    ),
  );
  for (const x of [-1.7, 1.7])
    for (const z of [-1.22, 1.22])
      root.add(cylinder(0.24, 0.19, mat('#252621'), [x, -0.31, z]));
  const platter = cylinder(1.36, 0.15, metal('#b8bbc0'), [-0.42, 0.38, 0]);
  root.add(platter);
  const brushed = metal('#b8bbc0');
  for (let i = 0; i < 3; i++)
    root.add(torus(1.358, 0.007, brushed, [-0.42, 0.33 + i * 0.042, 0]));
  const dots = new T.InstancedMesh(
    new T.SphereGeometry(0.012, 8, 6),
    mat('#202523'),
    96,
  );
  const dot = new T.Object3D();
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    dot.position.set(-0.42 + Math.cos(a) * 1.36, 0.383, Math.sin(a) * 1.36);
    dot.updateMatrix();
    dots.setMatrixAt(i, dot.matrix);
  }
  root.add(dots);
  const disc = new T.Group();
  disc.position.set(-0.42, 0.48, 0);
  root.add(disc);
  const vinyl = mat('#111616', 0.22);
  vinyl.clearcoat = 0.7;
  vinyl.anisotropy = 0.65;
  disc.add(cylinder(1.31, 0.035, vinyl, [0, 0, 0]));
  const groove = mat('#303735', 0.32);
  for (let r = 0.45; r < 1.27; r += 0.016)
    disc.add(torus(r, 0.0012, groove, [0, 0.019, 0]));
  const recordColor = mat('#d76e44', 0.5);
  disc.add(cylinder(0.4, 0.039, recordColor, [0, 0.015, 0]));
  const recordLabel = label('SIDE A\n33⅓ RPM', 0.55, 0.32, [0, 0.039, 0], {
    color: '#fbecd6',
    size: 42,
  });
  recordLabel.rotation.x = -Math.PI / 2;
  disc.add(recordLabel);
  root.add(cylinder(0.035, 0.18, metal(), [-0.42, 0.52, 0]));
  const arm = new T.Group();
  arm.position.set(1.3, 0.46, -0.9);
  root.add(arm);
  arm.add(cylinder(0.2, 0.22, metal('#c4c6bf'), [0, 0, 0]));
  arm.add(
    tube(
      [
        [0, 0.18, 0],
        [0.1, 0.2, 0.25],
        [0.05, 0.16, 0.8],
        [-0.1, 0.12, 1.5],
      ],
      0.025,
      metal('#d7d9d5'),
    ),
  );
  arm.add(box(0.17, 0.09, 0.32, mat('#24272a'), [-0.1, 0.1, 1.52], 0.02));
  arm.add(box(0.095, 0.06, 0.12, mat('#be632f'), [-0.1, 0.036, 1.59], 0.012));
  arm.add(
    tube(
      [
        [-0.1, 0.014, 1.58],
        [-0.1, -0.03, 1.68],
      ],
      0.005,
      metal(),
    ),
  );
  const counterweight = cylinder(
    0.12,
    0.27,
    metal('#9fa29d'),
    [0, 0.19, -0.28],
  );
  counterweight.rotation.x = Math.PI / 2;
  arm.add(counterweight);
  arm.add(cylinder(0.08, 0.18, metal('#92958d'), [0, 0.17, -0.18]));
  root.add(cylinder(0.13, 0.07, metal(), [1.7, 0.35, 1.24]));
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    root.add(
      cylinder(0.003, 0.05, mat('#575e59'), [
        1.7 + Math.sin(a) * 0.13,
        0.35,
        1.24 + Math.cos(a) * 0.13,
      ]),
    );
  }
  const badge = label('FORM / AUDIO     01', 0.86, 0.1, [1.34, 0.303, 0.75], {
    width: 1024,
    height: 128,
    size: 50,
    color: '#aab2a8',
    weight: '400',
  });
  badge.rotation.x = -Math.PI / 2;
  root.add(badge);
  const power = mat('#bfd671');
  root.add(cylinder(0.035, 0.015, power, [1.37, 0.31, 1.27]));
  let playing = false,
    speed = 33,
    trackUrl,
    audio,
    statusNode;
  let demoContext,
    demoMaster,
    demoTimer,
    demoStep = 0;
  function stopDemo() {
    if (demoTimer) {
      clearInterval(demoTimer);
      demoTimer = null;
    }
    if (demoMaster)
      demoMaster.gain.setTargetAtTime(0, demoContext.currentTime, 0.04);
  }
  async function startDemo() {
    demoContext ??= new AudioContext();
    await demoContext.resume();
    demoMaster ??= demoContext.createGain();
    demoMaster.gain.value = 0.025;
    demoMaster.connect(demoContext.destination);
    const play = () => {
      const now = demoContext.currentTime;
      for (const frequency of [130.81, 164.81, 196]) {
        const oscillator = demoContext.createOscillator(),
          gain = demoContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value =
          frequency * (demoStep % 4 === 3 ? 1.122 : 1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        oscillator.connect(gain).connect(demoMaster);
        oscillator.start(now);
        oscillator.stop(now + 1.4);
      }
      demoStep++;
    };
    play();
    demoTimer = setInterval(play, 1400);
  }
  function pause() {
    playing = false;
    audio?.pause();
    stopDemo();
  }
  let playButton;
  async function toggle(button) {
    playButton = button;
    if (playing) {
      pause();
      button.textContent = 'Play record';
      return;
    }
    try {
      if (audio) await audio.play();
      else await startDemo();
      playing = true;
      button.textContent = 'Pause record';
    } catch {
      if (statusNode)
        statusNode.textContent = 'This audio file could not be played.';
    }
  }
  return {
    root,
    parts: { disc, arm, platter, wood, recordColor, power },
    angle: [3, 4.8, 4.5],
    controls: [
      {
        type: 'button',
        label: 'Transport',
        text: 'Play record',
        click: toggle,
        note: 'Plays a gentle synthesized loop until you choose a track.',
      },
      {
        type: 'file',
        label: 'Your collection',
        text: 'Choose an audio file',
        change: (file, status) => {
          pause();
          if (trackUrl) URL.revokeObjectURL(trackUrl);
          trackUrl = URL.createObjectURL(file);
          audio = new Audio(trackUrl);
          audio.loop = false;
          audio.volume = 0.6;
          statusNode = status;
          status.textContent = file.name;
          if (playButton) playButton.textContent = 'Play record';
          audio.addEventListener('ended', () => {
            pause();
            if (playButton) playButton.textContent = 'Play record';
          });
          audio.addEventListener('error', () => {
            pause();
            status.textContent =
              'This audio format is not supported. Try MP3 or WAV.';
          });
        },
      },
      {
        type: 'choice',
        label: 'Platter speed',
        options: [
          { label: '33⅓ RPM', value: 33 },
          { label: '45 RPM', value: 45 },
        ],
        change: (v) => (speed = v),
      },
      {
        type: 'swatches',
        label: 'Finish',
        options: [
          { label: 'Walnut', color: '#ffffff' },
          { label: 'Natural', color: '#e8d9bb' },
          { label: 'Midnight', color: '#6a7370' },
        ],
        change: (i, o) => wood.color.set(o.color),
      },
    ],
    update: (t, dt) => {
      if (playing && !preview)
        disc.rotation.y -= ((dt * speed) / 60) * Math.PI * 2;
      arm.rotation.y = T.MathUtils.damp(
        arm.rotation.y,
        playing ? -0.55 : 0,
        4,
        dt,
      );
      power.color.set(playing ? '#bdd967' : '#686b55');
    },
    visibility: (visible) => {
      if (!visible) {
        pause();
        if (playButton) playButton.textContent = 'Play record';
      }
    },
    dispose: () => {
      pause();
      if (trackUrl) URL.revokeObjectURL(trackUrl);
      demoContext?.close();
    },
    credit: 'Original procedural turntable · Local audio only',
  };
}
