import * as T from 'three';
import { projects } from './shared/projects.js';
import {
  makeRenderer,
  makeScene,
  setupModel,
  fitCamera,
} from './shared/stage.js';
const gallery = document.querySelector('#gallery');
projects.forEach((p) => {
  const link = document.createElement('a');
  link.className = 'project-card';
  link.href = `./projects/${p.id}/`;
  link.style.setProperty('--card-bg', p.background);
  link.innerHTML = `<div class="preview" data-project="${p.id}"><span class="index">${p.number}</span><span class="open-icon" aria-hidden="true">↗</span></div><div class="card-meta"><div><h2>${p.title}</h2><span class="category">${p.category}</span></div><p>${p.description}</p></div>`;
  gallery.append(link);
});
try {
  await startGallery();
} catch (error) {
  console.error(error);
  document.body.classList.add('webgl-ready');
  document.querySelectorAll('.preview').forEach((p) => {
    p.insertAdjacentHTML(
      'beforeend',
      '<span class="preview-error">Open the experiment ↗</span>',
    );
  });
}
async function startGallery() {
  const canvas = document.createElement('canvas');
  canvas.className = 'gallery-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const { renderer, environment } = makeRenderer(canvas);
  renderer.shadowMap.enabled = false;
  renderer.setSize(innerWidth, innerHeight);
  renderer.setScissorTest(true);
  const items = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let hovered = null;
  gallery.addEventListener('pointerover', (e) => {
    hovered =
      e.target.closest('.project-card')?.querySelector('.preview')?.dataset
        .project ?? null;
  });
  gallery.addEventListener('pointerleave', () => {
    hovered = null;
  });
  const loading = Promise.all(
    projects.map(async (project) => {
      const element = document.querySelector(`[data-project="${project.id}"]`);
      try {
        const sceneModule = await import(`./projects/${project.id}/scene.js`);
        const model = await sceneModule.create({ preview: true });
        const { scene } = makeScene(project.background, environment.texture);
        const bounds = setupModel(scene, model);
        const camera = new T.PerspectiveCamera(35, 1, 0.01, 200);
        items.push({
          project,
          element,
          model,
          scene,
          bounds,
          camera,
          baseRotation: model.root.rotation.y,
        });
        element.classList.add('is-ready');
      } catch (error) {
        console.error(project.id, error);
        element.classList.add('is-ready');
        element.insertAdjacentHTML(
          'beforeend',
          '<span class="preview-error">Open the experiment ↗</span>',
        );
      }
    }),
  );
  document.body.classList.add('webgl-ready');
  let last = performance.now(),
    elapsed = 0,
    request;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    renderer.setScissorTest(false);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const item of items) {
      const r = item.element.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const active = hovered === item.project.id && !reduced.matches;
      item.model.root.rotation.y = T.MathUtils.damp(
        item.model.root.rotation.y,
        item.baseRotation + (active ? Math.sin(elapsed * 0.5) * 0.25 : 0),
        5,
        dt,
      );
      item.model.update?.(reduced.matches ? 0 : elapsed, dt, {
        preview: true,
        active,
      });
      fitCamera(
        item.camera,
        item.bounds,
        r.width / r.height,
        item.model.angle ?? [4, 2.5, 5],
        1.06,
      );
      renderer.setViewport(r.left, innerHeight - r.bottom, r.width, r.height);
      renderer.setScissor(r.left, innerHeight - r.bottom, r.width, r.height);
      renderer.render(item.scene, item.camera);
    }
    request = requestAnimationFrame(frame);
  }
  request = requestAnimationFrame(frame);
  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(request);
    if (!document.hidden) {
      last = performance.now();
      request = requestAnimationFrame(frame);
    }
  });
  await loading;
}
