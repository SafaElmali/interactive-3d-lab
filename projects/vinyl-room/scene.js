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
export async function create({ preview = false } = {}) {
  const root = new T.Group();
  const wood = mat('#8d5435', 0.38);
  root.add(box(4.4, 0.43, 3.35, wood, [0, 0, 0], 0.14));
  root.add(box(4.3, 0.08, 3.24, mat('#352b23'), [0, 0.255, 0], 0.1));
  for (const x of [-1.7, 1.7])
    for (const z of [-1.22, 1.22])
      root.add(cylinder(0.24, 0.19, mat('#252621'), [x, -0.31, z]));
  const platter = cylinder(1.36, 0.15, metal('#b8bbc0'), [-0.42, 0.38, 0]);
  root.add(platter);
  const disc = new T.Group();
  disc.position.set(-0.42, 0.48, 0);
  root.add(disc);
  disc.add(cylinder(1.31, 0.035, mat('#181b1b', 0.28), [0, 0, 0]));
  for (let r = 0.45; r < 1.27; r += 0.045)
    disc.add(torus(r, 0.0025, mat('#414443', 0.3), [0, 0.021, 0]));
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
  arm.add(cylinder(0.08, 0.18, metal('#92958d'), [0, 0.17, -0.18]));
  root.add(cylinder(0.13, 0.07, metal(), [1.7, 0.35, 1.24]));
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
          { label: 'Walnut', color: '#8d5435' },
          { label: 'Natural', color: '#c3a77e' },
          { label: 'Midnight', color: '#303835' },
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
