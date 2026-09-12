import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/GLTFLoader.js';
import { clamp, lerp, smoothstep, selectedIndex, canPose } from './motion.js';
import { createRenderLoop } from '../../shared/render-loop.js';

const brands = [
  {
    name: 'Coca-Cola',
    file: 'coca-cola',
    calories: '140',
    ingredients:
      'CARBONATED WATER · SUGAR · CARAMEL COLOR · NATURAL FLAVORS · CAFFEINE',
  },
  {
    name: '7UP',
    file: '7up',
    calories: '140',
    ingredients:
      'CARBONATED WATER · SUGAR · CITRIC ACID · LEMON AND LIME FLAVORS',
  },
  {
    name: 'Dr Pepper',
    file: 'dr-pepper',
    calories: '150',
    ingredients:
      'CARBONATED WATER · SUGAR · CARAMEL COLOR · NATURAL FLAVORS · CAFFEINE',
  },
  {
    name: 'Sprite',
    file: 'sprite',
    calories: '140',
    ingredients:
      'CARBONATED WATER · SUGAR · CITRIC ACID · NATURAL LEMON-LIME FLAVORS',
  },
  {
    name: 'Fanta',
    file: 'fanta',
    calories: '160',
    ingredients:
      'CARBONATED WATER · SUGAR · ORANGE JUICE · CITRIC ACID · NATURAL FLAVORS',
  },
  {
    name: 'Pepsi',
    file: 'pepsi',
    calories: '150',
    ingredients:
      'CARBONATED WATER · SUGAR · CARAMEL COLOR · NATURAL FLAVORS · CAFFEINE',
  },
  {
    name: 'MTN Dew',
    file: 'mtn-dew',
    calories: '170',
    ingredients:
      'CARBONATED WATER · SUGAR · CITRUS FLAVOR · NATURAL FLAVORS · CAFFEINE',
  },
];

const canvas = document.querySelector('.webgl');
const boot = document.querySelector('.boot');
const controls = document.querySelector('.carousel-controls');
const previousButton = document.querySelector('.carousel-control--previous');
const nextButton = document.querySelector('.carousel-control--next');
const currentLabel = document.querySelector('[data-carousel-current]');
const depthLines = [...document.querySelectorAll('[data-depth]')];
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;

function showError(error) {
  console.error('The can scene could not load:', error);
  boot.classList.remove('is-ready');
  boot.classList.add('has-error');
  boot.removeAttribute('aria-hidden');
  boot.querySelector('.boot__error').hidden = false;
}

try {
  await initialize();
} catch (error) {
  showError(error);
}

async function initialize() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    32,
    innerWidth / innerHeight,
    0.1,
    100,
  );
  const lineup = new THREE.Group();
  scene.add(lineup);
  scene.add(new THREE.HemisphereLight(0x566057, 0x010202, 0.42));
  const fill = new THREE.DirectionalLight(0x87958c, 0.75);
  fill.position.set(-5, 6, 7);
  scene.add(fill);

  const spotlightTarget = new THREE.Object3D();
  scene.add(spotlightTarget);
  const spotlight = new THREE.SpotLight(
    0xfff1d2,
    255,
    24,
    THREE.MathUtils.degToRad(13),
    0.62,
    1.35,
  );
  spotlight.position.set(0, 9, 3.4);
  spotlight.target = spotlightTarget;
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.set(2048, 2048);
  spotlight.shadow.camera.near = 1;
  spotlight.shadow.camera.far = 24;
  spotlight.shadow.bias = -0.00015;
  scene.add(spotlight);
  const coolRim = new THREE.PointLight(0x9bb4ff, 19, 17, 2);
  coolRim.position.set(5.5, 0.5, 3);
  scene.add(coolRim);
  const redRim = new THREE.PointLight(0xff304b, 13, 14, 2);
  redRim.position.set(-5, -0.5, 2.5);
  scene.add(redRim);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({
      color: 0x050706,
      roughness: 0.92,
      metalness: 0.04,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.16;
  floor.receiveShadow = true;
  scene.add(floor);

  let mobile;
  function resize() {
    mobile = innerWidth < 760;
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    camera.aspect = innerWidth / innerHeight;
    camera.fov = mobile ? 42 : 32;
    camera.position.z = mobile ? 15 : 14;
    camera.updateProjectionMatrix();
    measureScroll();
  }

  const textureLoader = new THREE.TextureLoader();
  const [{ scene: sourceModel }, textures] = await Promise.all([
    new GLTFLoader().loadAsync('./assets/soda-can.glb'),
    Promise.all(
      brands.map(async (brand) => {
        const source = await textureLoader.loadAsync(
          `./assets/brands/${brand.file}.jpg`,
        );
        const surface = document.createElement('canvas');
        surface.width = 1024;
        surface.height = 512;
        const context = surface.getContext('2d');
        context.drawImage(source.image, 0, 0, 1024, 512);
        drawNutrition(context, brand);
        source.dispose();
        const texture = new THREE.CanvasTexture(surface);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
      }),
    ),
  ]);

  const cans = brands.map((brand, index) =>
    createCan(sourceModel, textures[index], brand),
  );
  cans.forEach((can) => lineup.add(can));

  let targetProgress = 0;
  let progress = 0;
  let previousProgress = 0;
  let velocity = 0;
  let targetOffset = 0;
  let offset = 0;
  let selected = 3;
  let dragging = false;
  let dragStart = null;
  let wheelTimer;
  let controlsActive;
  const pointer = new THREE.Vector2(2, 2);
  const hoverTarget = new THREE.Vector2();
  const hover = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const labelPoint = new THREE.Vector3();
  let elapsed = 0;
  let contextLost = false;
  reducedMotion = motionPreference.matches;
  const loop = createRenderLoop(frame, {
    reduced: () => reducedMotion,
    visible: () => !document.hidden && !contextLost,
  });
  motionPreference.addEventListener('change', (event) => {
    reducedMotion = event.matches;
    loop.invalidate();
  });

  function measureScroll() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    targetProgress = distance > 0 ? clamp(scrollY / distance) : 0;
    loop.invalidate();
  }

  function updateSelection() {
    const next = selectedIndex(targetOffset);
    if (selected !== next) {
      selected = next;
      currentLabel.textContent = brands[selected].name;
    }
    previousButton.disabled = !controlsActive || selected === 0;
    nextButton.disabled = !controlsActive || selected === brands.length - 1;
  }

  function setOffset(value) {
    targetOffset = clamp(value, -3, 3);
    updateSelection();
    loop.invalidate();
  }

  function step(direction) {
    if (progress >= 0.205) return;
    setOffset(Math.round(targetOffset) + direction);
  }

  previousButton.addEventListener('click', () => step(1));
  nextButton.addEventListener('click', () => step(-1));

  addEventListener('pointerdown', (event) => {
    if (
      progress >= 0.205 ||
      event.button !== 0 ||
      event.target.closest('a, button, input, textarea, select')
    )
      return;
    dragging = true;
    dragStart = { x: event.clientX, y: event.clientY, offset: targetOffset };
    document.body.classList.add('is-dragging');
  });

  addEventListener('pointermove', (event) => {
    pointer.set(
      (event.clientX / innerWidth) * 2 - 1,
      -(event.clientY / innerHeight) * 2 + 1,
    );
    if (!reducedMotion && progress > 0.2 && progress < 0.82) loop.invalidate();
    if (!dragging) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5 && event.cancelable)
      event.preventDefault();
    setOffset(dragStart.offset + (dx / innerWidth) * 4.2);
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('is-dragging');
    setOffset(Math.round(targetOffset));
  }
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  addEventListener('blur', endDrag);
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.set(2, 2);
    if (hover.lengthSq() > 0.000001) loop.invalidate();
  });

  addEventListener(
    'wheel',
    (event) => {
      if (progress >= 0.205) return;
      const delta = event.shiftKey ? event.deltaY : event.deltaX;
      if (!delta || Math.abs(delta) < Math.abs(event.deltaY) * 0.65) return;
      event.preventDefault();
      setOffset(targetOffset - delta * 0.0028);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => setOffset(Math.round(targetOffset)), 140);
    },
    { passive: false },
  );

  addEventListener('keydown', (event) => {
    if (
      progress >= 0.205 ||
      event.target.matches('input, textarea, select, [contenteditable="true"]')
    )
      return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? 1 : -1);
    }
  });
  addEventListener('scroll', measureScroll, { passive: true });
  addEventListener('resize', resize);
  resize();
  progress = targetProgress;
  previousProgress = progress;

  function updatePage() {
    const stops = [
      { at: 0, rgb: [7, 9, 9] },
      { at: 0.34, rgb: [8, 17, 12] },
      { at: 0.61, rgb: [5, 10, 8] },
      { at: 1, rgb: [3, 4, 4] },
    ];
    const start = stops.findIndex(
      (stop, i) =>
        stops[i + 1] && progress >= stop.at && progress <= stops[i + 1].at,
    );
    const from = stops[Math.max(0, start)];
    const to = stops[Math.max(0, start) + 1];
    const mix = smoothstep(from.at, to.at, progress);
    ['r', 'g', 'b'].forEach((channel, i) =>
      document.documentElement.style.setProperty(
        `--scene-${channel}`,
        Math.round(lerp(from.rgb[i], to.rgb[i], mix)),
      ),
    );
    document.documentElement.style.setProperty('--progress', progress);
    const active = progress < 0.205;
    if (controlsActive !== active) {
      controlsActive = active;
      document.body.classList.toggle('is-carousel-active', active);
      controls.setAttribute('aria-hidden', String(!active));
      controls.inert = !active;
      updateSelection();
    }
    const distance = Math.min(progress * innerHeight, innerHeight * 1.3);
    depthLines.forEach((line) => {
      line.style.transform = `translate3d(${distance * Number(line.dataset.depth)}px, ${distance * -0.035}px, 0)`;
    });
  }

  function frame(dt) {
    if (!reducedMotion) elapsed += dt;
    const blend = (amount) =>
      reducedMotion ? 1 : 1 - (1 - amount) ** (dt * 60);
    progress = lerp(progress, targetProgress, blend(0.075));
    if (Math.abs(progress - targetProgress) < 0.00001)
      progress = targetProgress;
    velocity = reducedMotion
      ? 0
      : lerp(velocity, (progress - previousProgress) * 10000, blend(0.12));
    previousProgress = progress;
    offset = lerp(offset, targetOffset, blend(0.12));
    if (Math.abs(offset - targetOffset) < 0.0001) offset = targetOffset;
    if (progress === targetProgress && Math.abs(velocity) < 0.01) velocity = 0;
    updatePage();
    cans.forEach((can, index) => {
      const pose = canPose({
        index,
        selected,
        offset,
        progress,
        time: elapsed,
        mobile,
        frontRotation: can.userData.frontRotation,
        backRotation: can.userData.backRotation,
        cameraZ: camera.position.z,
        fov: camera.fov,
        velocity,
      });
      can.position.set(pose.x, pose.y, pose.z);
      can.rotation.set(pose.rx, pose.ry, pose.rz);
      can.scale.setScalar(pose.scale);
      can.visible = pose.opacity > 0.02;
      can.userData.sleeve.roughness = lerp(0.28, 0.43, pose.labelFocus);
      can.userData.sleeve.clearcoat = lerp(0.92, 0.38, pose.labelFocus);
      for (const material of can.userData.materials) {
        material.opacity = material.userData.baseOpacity * pose.opacity;
      }
      can.userData.gloss.opacity *=
        index === selected ? 1 - pose.labelFocus * 0.84 : 1;
    });
    lineup.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.28) * 0.015;
    camera.position.x = reducedMotion
      ? 0
      : Math.sin(elapsed * 0.22) * 0.04 + velocity * 0.0002;
    camera.lookAt(0, -0.1, 0);
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    const featured = cans[selected];
    const hoverWeight =
      smoothstep(0.2, 0.38, progress) * (1 - smoothstep(0.68, 0.82, progress));
    hoverTarget.set(0, 0);
    if (hoverWeight > 0.01 && !reducedMotion) {
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObject(featured, true).length)
        hoverTarget.copy(pointer);
    }
    hover.lerp(hoverTarget, blend(hoverTarget.lengthSq() > 0 ? 0.09 : 0.065));
    const tilt = hoverWeight * (mobile ? 0.72 : 1);
    featured.rotation.x -= hover.y * 0.085 * tilt;
    featured.rotation.y += hover.x * 0.12 * tilt;
    featured.rotation.z += (-hover.x * 0.045 + hover.y * 0.02) * tilt;
    featured.updateWorldMatrix(true, false);

    const labelWeight =
      smoothstep(0.47, 0.64, progress) * (1 - smoothstep(0.73, 0.86, progress));
    labelPoint.copy(featured.userData.labelPoint);
    featured.localToWorld(labelPoint);
    spotlightTarget.position.x = lerp(
      spotlightTarget.position.x,
      lerp(featured.position.x, labelPoint.x, labelWeight),
      blend(0.16),
    );
    spotlightTarget.position.y = lerp(
      spotlightTarget.position.y,
      lerp(featured.position.y + 0.35, labelPoint.y, labelWeight),
      blend(0.16),
    );
    spotlightTarget.position.z = lerp(
      spotlightTarget.position.z,
      lerp(featured.position.z, labelPoint.z, labelWeight),
      blend(0.16),
    );
    spotlight.position.x = lerp(
      spotlight.position.x,
      lerp(featured.position.x - 0.35, labelPoint.x - 0.7, labelWeight),
      blend(0.12),
    );
    spotlight.position.y = lerp(
      spotlight.position.y,
      lerp(9, labelPoint.y + 3.2, labelWeight),
      blend(0.12),
    );
    spotlight.position.z = lerp(
      spotlight.position.z,
      lerp(3.4, labelPoint.z + 4.8, labelWeight),
      blend(0.12),
    );
    spotlight.angle = THREE.MathUtils.degToRad(lerp(13, 10.5, labelWeight));
    coolRim.intensity = lerp(13, 24, smoothstep(0.18, 0.48, progress));
    redRim.intensity = lerp(12, 6, smoothstep(0.35, 0.7, progress));
    const focusWeight =
      smoothstep(0.18, 0.38, progress) * (1 - smoothstep(0.68, 0.86, progress));
    floor.position.y = lerp(
      lerp(-2.16, -2.55, smoothstep(0.74, 0.9, progress)),
      -2.92,
      focusWeight,
    );
    spotlight.intensity = lerp(lerp(255, 340, focusWeight), 195, labelWeight);
    renderer.render(scene, camera);
    // Reveal only after both the model and every label have been drawn.
    boot.classList.add('is-ready');
    return (
      progress !== targetProgress ||
      offset !== targetOffset ||
      velocity !== 0 ||
      hover.distanceToSquared(hoverTarget) > 0.000001
    );
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop();
    else loop.invalidate();
  });
  addEventListener('pagehide', (event) => {
    loop.stop();
    if (!event.persisted) loop.dispose();
  });
  addEventListener('pageshow', (event) => {
    if (event.persisted) resize();
  });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    loop.stop();
    showError(new Error('The graphics context was interrupted.'));
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    boot.classList.remove('has-error');
    boot.querySelector('.boot__error').hidden = true;
    boot.classList.add('is-ready');
    loop.invalidate();
  });
}

function createCan(source, texture, brand) {
  const can = new THREE.Group();
  can.name = `can-${brand.file}`;
  const model = source.clone(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 3.62 / size.y;
  model.scale.setScalar(scale);
  model.position.copy(center).multiplyScalar(-scale);
  const aluminum = new THREE.MeshPhysicalMaterial({
    color: 0xaeb4b0,
    metalness: 0.62,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  });
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.material = aluminum;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  can.add(model);
  const sleeveMaterial = new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.28,
    metalness: 0.18,
    clearcoat: 0.92,
    clearcoatRoughness: 0.14,
    side: THREE.DoubleSide,
  });
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(1.112, 1.112, 3.18, 64, 1, true),
    sleeveMaterial,
  );
  sleeve.rotation.y = Math.PI * 0.44;
  sleeve.castShadow = true;
  can.add(sleeve);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xbec3bc,
    metalness: 0.92,
    roughness: 0.2,
  });
  for (const y of [-1.7, 1.7]) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.03, 0.055, 12, 64),
      rimMaterial,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y;
    rim.castShadow = true;
    can.add(rim);
  }
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(1.03, 1.03, 0.035, 64),
    rimMaterial,
  );
  lid.position.y = 1.7;
  lid.castShadow = true;
  can.add(lid);
  const tabMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c918c,
    metalness: 0.95,
    roughness: 0.22,
  });
  const tab = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.11, 0.31, 5, 10),
    tabMaterial,
  );
  tab.scale.set(1.25, 0.34, 1);
  tab.rotation.x = Math.PI / 2;
  tab.rotation.z = 0.22;
  tab.position.set(0.03, 1.735, 0.08);
  tab.castShadow = true;
  can.add(tab);
  const glossMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  can.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(1.124, 1.124, 3.02, 64, 1, true, -0.38, 0.16),
      glossMaterial,
    ),
  );
  const labelAngle = ((70 + 164 * 0.5) / 1024) * Math.PI * 2;
  const materials = [
    aluminum,
    sleeveMaterial,
    rimMaterial,
    tabMaterial,
    glossMaterial,
  ];
  materials.forEach((material) => {
    material.userData.baseOpacity = material.opacity;
    material.transparent = true;
  });
  can.userData = {
    frontRotation: Math.PI - sleeve.rotation.y,
    backRotation:
      THREE.MathUtils.euclideanModulo(
        -labelAngle - sleeve.rotation.y + Math.PI,
        Math.PI * 2,
      ) - Math.PI,
    labelPoint: new THREE.Vector3(
      Math.sin(labelAngle + sleeve.rotation.y) * 1.13,
      (0.5 - (132 + 250 * 0.5) / 512) * 3.18,
      Math.cos(labelAngle + sleeve.rotation.y) * 1.13,
    ),
    sleeve: sleeveMaterial,
    gloss: glossMaterial,
    materials,
  };
  return can;
}

function drawNutrition(ctx, brand) {
  const x = 70,
    y = 132,
    width = 164,
    height = 250,
    padding = 10;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 6, 5, 0.84)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = 'rgba(255,255,255,0.94)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '900 17px Arial Narrow, Arial, sans-serif';
  ctx.fillText('NUTRITION FACTS', x + padding, y + 9);
  ctx.fillRect(x + padding, y + 32, width - padding * 2, 3);
  ctx.font = '700 8px Arial, sans-serif';
  ctx.fillText('SERVING SIZE 1 CAN', x + padding, y + 41);
  ctx.fillText('AMOUNT PER SERVING', x + padding, y + 56);
  ctx.font = '900 11px Arial, sans-serif';
  ctx.fillText('CALORIES', x + padding, y + 70);
  ctx.textAlign = 'right';
  ctx.font = '900 25px Arial Narrow, Arial, sans-serif';
  ctx.fillText(brand.calories, x + width - padding, y + 62);
  ctx.textAlign = 'left';
  ctx.fillRect(x + padding, y + 94, width - padding * 2, 3);
  ctx.font = '700 8px Arial, sans-serif';
  [
    ['TOTAL FAT', '0G'],
    ['SODIUM', '45MG'],
    ['TOTAL CARBOHYDRATE', '39G'],
    ['TOTAL SUGARS', '39G'],
  ].forEach(([label, amount], index) => {
    const rowY = y + 103 + index * 13;
    ctx.fillText(label, x + padding, rowY);
    ctx.textAlign = 'right';
    ctx.fillText(amount, x + width - padding, rowY);
    ctx.textAlign = 'left';
    ctx.fillRect(x + padding, rowY + 10, width - padding * 2, 1);
  });
  ctx.font = '900 10px Arial, sans-serif';
  ctx.fillText('INGREDIENTS', x + padding, y + 160);
  ctx.font = '700 8px Arial, sans-serif';
  const lines = [];
  let line = '';
  for (const word of brand.ingredients.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > width - padding * 2 && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  lines
    .slice(0, 5)
    .forEach((text, index) =>
      ctx.fillText(text, x + padding, y + 175 + index * 11),
    );
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = '700 6px Arial, sans-serif';
  ctx.fillText(
    'DEMONSTRATION LABEL · NOT FOR RETAIL',
    x + padding,
    y + height - 16,
  );
  ctx.restore();
}
