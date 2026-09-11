import {
  T,
  mat,
  metal,
  box,
  label,
  keycap,
  cylinder,
  torus,
} from '../../shared/geometry.js';
import { microfinish } from '../../shared/materials.js';
import { keySound } from '../../shared/audio.js';
export async function create({ preview = false } = {}) {
  const root = new T.Group(),
    base = new T.Group(),
    board = new T.Group(),
    caps = new T.Group();
  root.add(base, board, caps);
  const shell = microfinish(metal('#c7bdde'), 250, 0.06),
    keyMaterial = microfinish(mat('#f4f0e8', 0.43), 350, 0.11),
    accent = microfinish(mat('#9989c7', 0.38), 350, 0.09),
    dark = microfinish(mat('#66617e', 0.43), 350, 0.11);
  base.add(box(5.7, 0.36, 2.15, shell, [0, 0, 0], 0.2));
  base.add(box(5.47, 0.08, 1.97, mat('#292936'), [0, 0.2, 0], 0.14));
  board.add(box(5.35, 0.05, 1.9, mat('#234c40'), [0, 0.3, 0], 0.12));
  const traces = metal('#b79751');
  for (let i = 0; i < 14; i++) {
    const x = -2.4 + i * 0.37;
    board.add(box(0.012, 0.004, 1.62, traces, [x, 0.33, 0], 0.001));
    board.add(
      box(
        0.25,
        0.004,
        0.015,
        traces,
        [x + 0.1, 0.332, ((i % 5) - 2) * 0.3],
        0.001,
      ),
    );
    board.add(box(0.09, 0.035, 0.12, mat('#202725'), [x, 0.35, 0.7], 0.007));
  }
  base.add(box(0.38, 0.12, 0.05, mat('#121718'), [2.16, 0.02, -1.08], 0.04));
  base.add(box(0.25, 0.035, 0.055, metal(), [2.16, 0.02, -1.105], 0.015));
  for (const x of [-2.2, 2.2])
    for (const z of [-0.72, 0.72])
      base.add(cylinder(0.15, 0.055, mat('#202323'), [x, -0.2, z]));
  const maker = label(
    'KEY / FORM   ·   NO. 003',
    1.55,
    0.1,
    [0, -0.025, 1.077],
    { width: 1024, height: 96, size: 43, color: '#29332b' },
  );
  base.add(maker);
  const switchHousing = new T.MeshPhysicalMaterial({
    color: '#dbe6e2',
    transmission: 0.32,
    roughness: 0.18,
    thickness: 0.04,
    clearcoat: 1,
  });
  const underglow = new T.MeshStandardMaterial({
    color: '#be83ff',
    emissive: '#be83ff',
    emissiveIntensity: 1,
  });
  base.add(box(5.5, 0.028, 2, underglow, [0, -0.12, 0], 0.16));
  for (const x of [-2.58, 2.58])
    for (const z of [-0.87, 0.87]) {
      const screw = new T.Mesh(
        new T.CylinderGeometry(0.035, 0.035, 0.015, 16),
        metal(),
      );
      screw.position.set(x, 0.2, z);
      base.add(screw);
    }
  const rows = [
    ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '−', '⌫'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
    ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '↵'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '↑'],
    ['Ctrl', 'Alt', 'Cmd', 'Space', 'Fn', '←', '↓', '→'],
  ];
  const keyGroups = [];
  rows.forEach((row, r) => {
    const widths = row.map((k) =>
      k === 'Space'
        ? 5
        : k === 'Shift'
          ? 2
          : k === 'Caps'
            ? 1.7
            : k === '↵'
              ? 1.7
              : k === 'Tab'
                ? 1.5
                : 1,
    );
    const total = widths.reduce((a, b) => a + b, 0);
    let cursor = -2.62;
    row.forEach((character, c) => {
      const w = (widths[c] / total) * 5.24 - 0.035;
      const g = new T.Group();
      const x = cursor + w / 2;
      cursor += w + 0.035;
      g.position.set(x, 0.48, (r - 2) * 0.382);
      g.userData = { character, pressedUntil: 0 };
      g.add(
        keycap(
          w,
          0.23,
          0.34,
          (r === 0 && c === 0) || character === '↵'
            ? accent
            : character === 'Space'
              ? dark
              : keyMaterial,
        ),
      );
      if (character !== 'Space') {
        const legend = label(
          character,
          Math.min(w * 0.65, 0.27),
          0.15,
          [0, 0.104, 0],
          {
            width: 256,
            height: 128,
            size: character.length > 2 ? 50 : 76,
            color: '#39374b',
          },
        );
        legend.rotation.x = -Math.PI / 2;
        g.add(legend);
      }
      const stem = box(0.09, 0.17, 0.09, accent, [0, -0.2, 0], 0.01);
      g.add(stem, box(0.24, 0.08, 0.26, switchHousing, [0, -0.19, 0], 0.025));
      g.add(torus(0.045, 0.009, traces, [0, -0.245, 0]));
      caps.add(g);
      keyGroups.push(g);
    });
  });
  let explode = 0,
    sound = 'soft',
    rgb = true;
  function press(key) {
    key.userData.pressedUntil = performance.now() + 130;
    if (sound !== 'off' && !preview) keySound(sound);
  }
  const themes = [
    ['Lavender', '#c7bdde', '#f4f0e8', '#9989c7', '#66617e'],
    ['Graphite', '#373a40', '#575b65', '#e19c48', '#272b30'],
    ['Matcha', '#a4b18d', '#e8e9df', '#607b57', '#708265'],
  ];
  return {
    root,
    parts: {
      base,
      board,
      caps,
      keyGroups,
      shell,
      keyMaterial,
      accent,
      dark,
      underglow,
    },
    angle: [2.6, 5, 4.2],
    controls: [
      {
        type: 'swatches',
        label: 'Keycap palette',
        options: themes.map((t) => ({ label: t[0], color: t[3] })),
        change: (i) => {
          shell.color.set(themes[i][1]);
          keyMaterial.color.set(themes[i][2]);
          accent.color.set(themes[i][3]);
          dark.color.set(themes[i][4]);
        },
      },
      {
        type: 'range',
        label: 'Pull it apart',
        start: 'Assembled',
        end: 'Exploded',
        change: (v) => (explode = v),
      },
      {
        type: 'choice',
        label: 'Switch sound',
        value: 1,
        options: [
          { label: 'Off', value: 'off' },
          { label: 'Soft', value: 'soft' },
          { label: 'Thock', value: 'thocky' },
          { label: 'Click', value: 'clicky' },
        ],
        change: (v) => (sound = v),
      },
      {
        type: 'choice',
        label: 'Underglow',
        options: [
          { label: 'On', value: true },
          { label: 'Off', value: false },
        ],
        change: (v) => (rgb = v),
        note: 'Click a key, then type on your keyboard.',
      },
    ],
    pick: (hits) => {
      let node = hits[0]?.object;
      while (node && !node.userData.character) node = node.parent;
      if (node?.userData.character) press(node);
    },
    key: (e) => {
      const key = keyGroups.find(
        (k) =>
          k.userData.character.toLowerCase() ===
          (e.key === ' ' ? 'space' : e.key.toLowerCase()),
      );
      if (key) {
        e.preventDefault();
        press(key);
        return true;
      }
      return false;
    },
    update: (t, dt) => {
      board.position.y = T.MathUtils.damp(
        board.position.y,
        explode * 0.7,
        8,
        dt,
      );
      caps.position.y = T.MathUtils.damp(
        caps.position.y,
        explode * 1.55,
        8,
        dt,
      );
      keyGroups.forEach((k) => {
        k.position.y = T.MathUtils.damp(
          k.position.y,
          performance.now() < k.userData.pressedUntil ? 0.39 : 0.48,
          30,
          dt,
        );
      });
      underglow.emissiveIntensity = rgb ? 0.8 + Math.sin(t * 2) * 0.25 : 0;
      underglow.color.set(rgb ? '#be83ff' : '#4f4b5a');
    },
    credit: 'Original procedural model · Object Lab',
  };
}
