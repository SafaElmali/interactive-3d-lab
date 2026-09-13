import * as T from 'three';
import { projects } from './projects.js';
import { makeRenderer, makeScene } from './stage.js';
import { clamp, smooth, colorAt } from './choreography.js';
import { disposeObject } from './geometry.js';
import { createRenderLoop } from './render-loop.js';

const project = projects.find((p) => p.id === document.body.dataset.project);
const next = projects[(projects.indexOf(project) + 1) % projects.length];
const creditsUrl = new URL('../credits.html', import.meta.url).href;
const iconsUrl = new URL('./icons.svg', import.meta.url).href;
const arrow = (direction) =>
  `<svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${iconsUrl}#arrow-${direction}" /></svg>`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer, environment;
try {
  const { story, createStory } = await import(
    `../projects/${project.id}/story.js`
  );
  document.title = `${project.title} — Object Lab`;
  document.body.className = `scroll-story theme-${story.theme}`;
  document.body.style.background = story.colors[0];
  document.body.innerHTML = `
    <div class="story-backdrop" aria-hidden="true"></div>
    <header class="story-header"><a class="icon-link" href="../../">${arrow('left')}All objects</a><span>${project.title}</span><a href="../../">OBJECT/LAB <small>${project.number}</small></a></header>
    <canvas class="story-canvas" aria-hidden="true"></canvas>
    <main class="story-track" aria-label="${project.title}: a story in four acts">
      ${story.chapters
        .map(
          (
            chapter,
            i,
          ) => `<section class="story-chapter layout-${chapter.layout || (i === 0 ? 'hero' : i === 3 ? 'finale' : 'left')}" id="act-${i + 1}">
        <div class="chapter-art"><${i === 0 ? 'h1' : 'h2'} class="chapter-heading">${chapter.title}</${i === 0 ? 'h1' : 'h2'}></div>
        <div class="chapter-copy"><span class="chapter-label">0${i + 1} / ${chapter.label}</span><p>${chapter.text}</p>${i === 3 ? `<a class="next-story" href="../${next.id}/">Next: ${next.title} ${arrow('up-right')}</a>` : ''}</div>
      </section>`,
        )
        .join('')}
    </main>
    <div class="story-footer"><span class="scroll-cue">Scroll to unfold ${arrow('down')}</span><div class="story-progress" aria-hidden="true"><span></span></div><span class="act-counter">01 — 04</span><a href="${creditsUrl}" class="story-credits">Credits</a></div>
    <div class="story-loading" role="status"><span>${project.title}</span><p>Setting the scene…</p></div>`;
  await start(story, createStory);
} catch (error) {
  console.error(error);
  renderer?.dispose();
  environment?.dispose();
  let message = document.querySelector('.story-loading');
  if (!message) {
    message = document.createElement('div');
    message.className = 'story-loading';
    document.body.append(message);
  }
  message.innerHTML =
    '<span>This scene couldn’t load.</span><p>Please refresh to try again.</p><a href="../../">Back to the collection</a>';
}

async function start(story, createStory) {
  ({ renderer, environment } = await makeRenderer(
    document.querySelector('canvas'),
  ));
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x000000, 0);
  const lights = makeScene(story.colors[0], environment.texture);
  const { scene } = lights;
  scene.background = null;
  const camera = new T.PerspectiveCamera(
    40,
    innerWidth / innerHeight,
    0.1,
    150,
  );
  camera.position.set(0, 0, 11);
  const world = new T.Group();
  scene.add(world);
  const model = await createStory({ scene, lights, camera, renderer });
  world.add(model.root);
  model.root.traverse((node) => {
    if (!node.isMesh) return;
    for (const material of Array.isArray(node.material)
      ? node.material
      : [node.material]) {
      for (const value of Object.values(material))
        if (value?.isTexture)
          value.anisotropy = Math.min(
            8,
            renderer.capabilities.getMaxAnisotropy(),
          );
      // Transparent glass should not cast a solid, opaque shadow on its contents.
      if (material.transmission > 0.5) node.castShadow = false;
    }
  });
  const chapters = [...document.querySelectorAll('.story-chapter')];
  const arts = chapters.map((n) => n.querySelector('.chapter-art'));
  const copies = chapters.map((n) => n.querySelector('.chapter-copy'));
  const progressBar = document.querySelector('.story-progress span');
  const counter = document.querySelector('.act-counter');
  const cue = document.querySelector('.scroll-cue');
  const background = new T.Color(),
    ink = new T.Color();
  let mobile = false,
    maxScroll = 1,
    progress = 0,
    time = 0;
  let lastAct = -1;
  let contextLost = false;
  const loop = createRenderLoop(frame, {
    reduced: () => reduced.matches,
    visible: () => !document.hidden && !contextLost,
  });
  const loading = document.querySelector('.story-loading');
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    loop.stop();
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    loop.invalidate();
  });
  function resize() {
    mobile = innerWidth < 760;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    world.scale.setScalar(Math.min(1, camera.aspect / 1.15));
    world.position.y = mobile ? -0.3 : -0.1;
    maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - innerHeight,
    );
    loop.invalidate();
  }
  resize();
  progress = clamp(scrollY / maxScroll);
  addEventListener('resize', resize);
  addEventListener('scroll', loop.invalidate, { passive: true });
  reduced.addEventListener('change', loop.invalidate);
  function frame(dt) {
    const target = clamp(scrollY / maxScroll);
    progress = reduced.matches
      ? target
      : T.MathUtils.damp(progress, target, 9, dt);
    if (Math.abs(progress - target) < 0.00001) progress = target;
    if (!reduced.matches) time += dt;
    // Reduced motion uses static chapter compositions without spins or parallax.
    const sceneProgress = reduced.matches
      ? Math.round(progress * 3) / 3
      : progress;
    model.update(sceneProgress, time, { mobile, reduced: reduced.matches, dt });
    scene.background = null;
    colorAt(story.colors, progress, background);
    colorAt(story.inks, progress, ink);
    const luminance = (color) =>
      color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
    const bgL = luminance(background),
      inkL = luminance(ink);
    if ((Math.max(bgL, inkL) + 0.05) / (Math.min(bgL, inkL) + 0.05) < 4.5) {
      ink.set(bgL > 0.18 ? '#161a18' : '#fff9ed');
    }
    document.body.style.backgroundColor = background.getStyle();
    document.body.style.setProperty('--ink', ink.getStyle());
    const act = Math.min(3, Math.round(progress * 3));
    if (act !== lastAct) {
      counter.textContent = `0${act + 1} — 04`;
      cue.firstChild.textContent =
        act === 3 ? 'One more world ' : 'Scroll to unfold ';
      chapters.forEach((node, i) => {
        node.toggleAttribute('inert', i !== act);
        node.setAttribute('aria-hidden', String(i !== act));
      });
      lastAct = act;
    }
    chapters.forEach((node, i) => {
      const distance = progress * 3 - i;
      const opacity = reduced.matches
        ? Number(i === act)
        : 1 - smooth(0.2, 0.68, Math.abs(distance));
      arts[i].style.opacity = copies[i].style.opacity = opacity;
      const drift = reduced.matches ? 0 : distance * -95;
      arts[i].style.transform = `translate3d(0,${drift}px,0)`;
      copies[i].style.transform = `translate3d(0,${drift * 0.45}px,0)`;
      arts[i].style.visibility = copies[i].style.visibility =
        opacity < 0.001 ? 'hidden' : 'visible';
    });
    progressBar.style.transform = `scaleX(${progress})`;
    renderer.render(scene, camera);
    if (loading.isConnected) loading.remove();
    return progress !== target;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop();
    else loop.invalidate();
  });
  addEventListener('pagehide', (event) => {
    loop.stop();
    if (event.persisted) return;
    loop.dispose();
    model.dispose?.();
    disposeObject(scene);
    renderer.dispose();
    environment.dispose();
  });
  addEventListener('pageshow', (event) => {
    if (event.persisted) resize();
  });
}
