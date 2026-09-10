import * as T from 'three';
import { projects } from './projects.js';
import {
  makeRenderer,
  makeScene,
  setupModel,
  fitCamera,
  orbit,
} from './stage.js';
const project = projects.find((p) => p.id === document.body.dataset.project);
document.title = `${project.title} — Object Lab`;
document.body.style.setProperty('--scene-bg', project.background);
document.body.innerHTML = `<header class="studio-header"><a href="../../">← All experiments</a><a class="wordmark" href="../../">OBJECT<span>/</span>LAB</a><span class="experiment-count">${project.number} / 09</span></header><canvas class="studio-canvas" tabindex="0" aria-label="Interactive ${project.title} 3D scene. Drag to rotate, use arrow keys to orbit, and scroll to zoom."></canvas><section class="studio-title"><span class="eyebrow">${project.category.toUpperCase()}</span><h1>${project.title}</h1><p>${project.description}</p><div class="edition-mark">OBJECT STUDY / ${project.number}</div></section><aside class="studio-controls" aria-label="Customize ${project.title}"></aside><div class="studio-bottom"><span class="studio-help">Drag to rotate · Scroll to zoom<br>Arrow keys to orbit · R to reset</span><button class="reset-button" type="button">↺ Reset view</button><span class="studio-credit"></span></div><div class="scene-loading"><strong>OBJECT/LAB</strong><span class="loading-dot">Preparing ${project.title}…</span></div>`;
try {
  await start();
} catch (e) {
  console.error(e);
  document.querySelector('.scene-loading').innerHTML =
    '<strong>Couldn’t load this scene.</strong><span>Please refresh to try again.</span><a href="../../">← Back to the collection</a>';
}
async function start() {
  const canvas = document.querySelector('canvas');
  const { renderer, environment } = makeRenderer(canvas);
  const lights = makeScene(project.background, environment.texture);
  const { scene } = lights;
  const camera = new T.PerspectiveCamera(
    35,
    innerWidth / innerHeight,
    0.01,
    300,
  );
  const { create } = await import(`../projects/${project.id}/scene.js`);
  const model = await create({
    preview: false,
    scene,
    camera,
    renderer,
    lights,
  });
  const bounds = setupModel(scene, model);
  const controls = orbit(camera, canvas);
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    fitCamera(
      camera,
      bounds,
      innerWidth / innerHeight,
      model.angle ?? [4, 2.5, 5],
      innerWidth < 760 ? 1.32 : 1.12,
    );
    controls.target.set(0, 0, 0);
    controls.update();
    controls.saveState();
  }
  resize();
  addEventListener('resize', resize);
  const panel = document.querySelector('.studio-controls');
  for (const spec of model.controls ?? []) buildControl(spec, panel);
  if (model.credit)
    document.querySelector('.studio-credit').innerHTML = model.credit;
  document
    .querySelector('.reset-button')
    .addEventListener('click', () => controls.reset());
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
  let pointerStart = null;
  canvas.addEventListener('pointerdown', (e) => {
    pointerStart = [e.clientX, e.clientY];
  });
  canvas.addEventListener('pointerup', (e) => {
    if (
      !pointerStart ||
      Math.hypot(e.clientX - pointerStart[0], e.clientY - pointerStart[1]) > 6
    )
      return;
    pointer.set(
      (e.clientX / innerWidth) * 2 - 1,
      (-e.clientY / innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    model.pick?.(raycaster.intersectObject(model.root, true), e);
  });
  canvas.addEventListener('keydown', (e) => {
    if (model.key?.(e)) return;
    if (e.key.toLowerCase() === 'r') {
      controls.reset();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key))
      return;
    e.preventDefault();
    const spherical = new T.Spherical().setFromVector3(
      camera.position.clone().sub(controls.target),
    );
    spherical.theta +=
      e.key === 'ArrowLeft' ? 0.15 : e.key === 'ArrowRight' ? -0.15 : 0;
    spherical.phi = T.MathUtils.clamp(
      spherical.phi +
        (e.key === 'ArrowUp' ? -0.12 : e.key === 'ArrowDown' ? 0.12 : 0),
      0.15,
      Math.PI * 0.85,
    );
    camera.position.copy(
      new T.Vector3().setFromSpherical(spherical).add(controls.target),
    );
    controls.update();
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let last = performance.now(),
    time = 0,
    request,
    wasDark = false;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduced.matches) time += dt;
    model.update?.(time, dt, { reduced: reduced.matches, controls });
    const dark =
      scene.background.r * 0.2126 +
        scene.background.g * 0.7152 +
        scene.background.b * 0.0722 <
      0.16;
    if (dark !== wasDark) {
      document.body.classList.toggle('night-mode', dark);
      wasDark = dark;
    }
    controls.update();
    renderer.render(scene, camera);
    request = requestAnimationFrame(frame);
  }
  frame(performance.now());
  document.querySelector('.scene-loading').hidden = true;
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(request);
    model.visibility?.(!document.hidden);
    if (!document.hidden) {
      last = performance.now();
      request = requestAnimationFrame(frame);
    }
  });
  addEventListener('pagehide', () => {
    cancelAnimationFrame(request);
    model.dispose?.();
    controls.dispose();
    renderer.dispose();
    environment.dispose();
  });
}
function buildControl(spec, parent) {
  const group = document.createElement('div');
  group.className = 'control-group';
  parent.append(group);
  const label = document.createElement('label');
  label.className = 'control-label';
  label.textContent = spec.label;
  group.append(label);
  if (spec.type === 'swatches' || spec.type === 'choice') {
    const row = document.createElement('div');
    row.className = spec.type === 'swatches' ? 'swatches' : 'choice-buttons';
    group.append(row);
    const selectedLabel = document.createElement('p');
    selectedLabel.className = 'swatch-label';
    if (spec.type === 'swatches') group.append(selectedLabel);
    spec.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = spec.type === 'swatches' ? 'swatch' : 'chip';
      if (spec.type === 'swatches') button.style.background = option.color;
      else button.textContent = option.label;
      button.title = option.label;
      button.setAttribute('aria-label', `${spec.label}: ${option.label}`);
      button.setAttribute('aria-pressed', String(index === (spec.value ?? 0)));
      if (index === (spec.value ?? 0)) selectedLabel.textContent = option.label;
      button.addEventListener('click', () => {
        row
          .querySelectorAll('button')
          .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        selectedLabel.textContent = option.label;
        spec.change(option.value ?? index, option);
      });
      row.append(button);
    });
  } else if (spec.type === 'range') {
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'control-range';
    input.min = spec.min ?? 0;
    input.max = spec.max ?? 1;
    input.step = spec.step ?? 0.01;
    input.value = spec.value ?? 0;
    input.setAttribute('aria-label', spec.label);
    input.addEventListener('input', () => spec.change(Number(input.value)));
    group.append(input);
    const ends = document.createElement('div');
    ends.className = 'range-ends';
    ends.innerHTML = `<span>${spec.start ?? '0'}</span><span>${spec.end ?? '100'}</span>`;
    group.append(ends);
  } else if (spec.type === 'button') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-button';
    button.textContent = spec.text ?? spec.label;
    button.addEventListener('click', () => spec.click(button));
    group.append(button);
    spec.bind?.(button);
  } else if (spec.type === 'file') {
    const fileLabel = document.createElement('label');
    fileLabel.className = 'file-button';
    fileLabel.tabIndex = 0;
    fileLabel.textContent = spec.text ?? 'Choose audio';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = spec.accept ?? 'audio/*';
    input.setAttribute('aria-label', spec.label);
    fileLabel.append(input);
    group.append(fileLabel);
    const status = document.createElement('p');
    status.className = 'studio-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Stays on your device.';
    group.append(status);
    input.addEventListener('change', () => {
      if (input.files[0]) spec.change(input.files[0], status);
    });
    fileLabel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });
  }
  if (spec.note) {
    const p = document.createElement('p');
    p.className = 'studio-status';
    p.textContent = spec.note;
    group.append(p);
  }
}
