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
  link.innerHTML = `<div class="preview" data-project="${p.id}" aria-busy="true"><span class="preview-loader" role="status"><span>Loading ${p.title} preview</span></span><span class="index">${p.number}</span><span class="open-icon" aria-hidden="true">↗</span></div><div class="card-meta"><div><h2>${p.title}</h2><span class="category">${p.category}</span></div><p>${p.description}</p></div>`;
  gallery.append(link);
});
try {
  await startGallery();
} catch (error) {
  console.error(error);
  document.body.classList.add('webgl-ready');
  document.querySelectorAll('.preview').forEach((p) => {
    finishPreview(p);
    p.insertAdjacentHTML(
      'beforeend',
      '<span class="preview-error">Open the experiment ↗</span>',
    );
  });
}
function finishPreview(element) {
  element.classList.add('is-ready');
  element.removeAttribute('aria-busy');
  element.querySelector('.preview-loader')?.remove();
}
async function startGallery() {
  // One offscreen WebGL renderer feeds canvases inside the cards. The browser
  // scrolls those cached images with the DOM, without waiting for a 3D frame.
  const source = document.createElement('canvas');
  const { renderer, environment } = await makeRenderer(source);
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(1);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hoverCapable = matchMedia('(hover: hover)');
  let hovered = null;
  let focused = null;
  let request = 0;
  let last = 0;
  let loading = 0;
  const items = projects.map((project) => {
    const element = document.querySelector(`[data-project="${project.id}"]`);
    const canvas = document.createElement('canvas');
    canvas.className = 'preview-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    element.append(canvas);
    const item = {
      project,
      element,
      canvas,
      context: canvas.getContext('2d', { alpha: false }),
      visible: false,
      near: false,
      loading: false,
      failed: false,
      dirty: true,
      settling: false,
      elapsed: 0,
      width: 0,
      height: 0,
    };
    const link = element.closest('.project-card');
    link.addEventListener('pointerenter', (event) => {
      if (hoverCapable.matches && event.pointerType !== 'touch') {
        hovered = item;
        schedule();
      }
    });
    link.addEventListener('pointerleave', () => {
      if (hovered === item) hovered = null;
      schedule();
    });
    link.addEventListener('focus', () => {
      focused = item;
      schedule();
    });
    link.addEventListener('blur', () => {
      focused = null;
      schedule();
    });
    return item;
  });
  const byElement = new Map(items.map((item) => [item.element, item]));
  const active = (item) => !reduced.matches && item === (hovered ?? focused);

  function schedule() {
    if (!request && !document.hidden) request = requestAnimationFrame(frame);
  }
  function needsFrame(item) {
    return (
      item.visible &&
      item.model &&
      item.width > 0 &&
      item.height > 0 &&
      (item.dirty || item.settling || active(item))
    );
  }
  function frame(now) {
    request = 0;
    // Never redraw the entire grid. Cap the single animated cover at 30 fps.
    if (now - last < 1000 / 30) {
      if (items.some(needsFrame)) schedule();
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const candidates = items.filter(needsFrame);
    const item = candidates.find((entry) => entry.dirty) ?? candidates[0];
    if (!item) return;
    try {
      const isActive = active(item);
      item.elapsed += dt;
      const target =
        item.baseRotation +
        (isActive ? Math.sin(item.elapsed * 0.5) * 0.25 : 0);
      item.model.root.rotation.y = T.MathUtils.damp(
        item.model.root.rotation.y,
        target,
        5,
        dt,
      );
      item.settling =
        Math.abs(item.model.root.rotation.y - item.baseRotation) > 0.001;
      if (!isActive && !item.settling)
        item.model.root.rotation.y = item.baseRotation;
      item.model.update?.(reduced.matches ? 0 : item.elapsed, dt, {
        preview: true,
        active: isActive,
        reduced: reduced.matches,
      });
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.ceil(item.width * ratio);
      const height = Math.ceil(item.height * ratio);
      if (source.width !== width || source.height !== height)
        renderer.setSize(width, height, false);
      if (item.canvas.width !== width || item.canvas.height !== height) {
        item.canvas.width = width;
        item.canvas.height = height;
        fitCamera(
          item.camera,
          item.bounds,
          width / height,
          item.model.angle ?? [4, 2.5, 5],
          1.06,
        );
      }
      renderer.render(item.scene, item.camera);
      item.context.drawImage(source, 0, 0);
      item.dirty = false;
      if (!item.element.classList.contains('is-ready'))
        finishPreview(item.element);
    } catch (error) {
      fail(item, error);
    }
    if (items.some(needsFrame)) schedule();
  }
  function fail(item, error) {
    console.error(item.project.id, error);
    item.failed = true;
    item.model = null;
    item.canvas.remove();
    finishPreview(item.element);
    item.element.insertAdjacentHTML(
      'beforeend',
      '<span class="preview-error">Open the experiment ↗</span>',
    );
  }
  async function load(item) {
    try {
      const sceneModule = await import(
        `./projects/${item.project.id}/scene.js`
      );
      const model = await sceneModule.create({ preview: true });
      const { scene } = makeScene(item.project.background, environment.texture);
      const bounds = setupModel(scene, model);
      const camera = new T.PerspectiveCamera(35, 1, 0.01, 200);
      await renderer.compileAsync(scene, camera);
      Object.assign(item, {
        model,
        scene,
        bounds,
        camera,
        baseRotation: model.root.rotation.y,
      });
      schedule();
    } catch (error) {
      fail(item, error);
    } finally {
      item.loading = false;
      loading--;
      loadNearby();
    }
  }
  function loadNearby() {
    if (document.hidden) return;
    for (const item of items) {
      if (loading >= 2) break;
      if (!item.near || item.model || item.loading || item.failed) continue;
      item.loading = true;
      loading++;
      void load(item);
    }
  }
  const preload = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        byElement.get(entry.target).near = entry.isIntersecting;
      loadNearby();
    },
    { rootMargin: '300px 0px' },
  );
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      byElement.get(entry.target).visible = entry.isIntersecting;
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    }
    schedule();
  });
  const resize = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const item = byElement.get(entry.target);
      item.width = entry.contentRect.width;
      item.height = entry.contentRect.height;
      item.dirty = true;
    }
    schedule();
  });
  for (const item of items) {
    preload.observe(item.element);
    visibility.observe(item.element);
    resize.observe(item.element);
  }
  reduced.addEventListener('change', () => {
    for (const item of items) {
      if (item.model) item.model.root.rotation.y = item.baseRotation;
      item.settling = false;
      item.dirty = true;
    }
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(request);
    request = 0;
    if (!document.hidden) {
      last = 0;
      loadNearby();
      schedule();
    }
  });
  document.body.classList.add('webgl-ready');
}
