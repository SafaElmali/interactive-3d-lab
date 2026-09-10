# Object Lab

Nine interactive 3D projects, one homepage, and a separate folder for every experiment.

**Gallery:** https://object-lab-safa.safaelmali.chatgpt.site

**Repository:** https://github.com/SafaElmali/interactive-3d-lab

## Run locally

Requires Node.js 22 or newer. No dependency installation is necessary: the pinned Three.js library, fonts, models, and textures are included locally.

```sh
npm run dev
```

Open http://127.0.0.1:4320/. Each project is also directly accessible at `/projects/<folder>/`.

```sh
npm run check  # Syntax, links, GLB integrity, geometry, and control-state checks
npm run build  # Copies the deployable site into dist/
```

## Projects

| Folder                         | Experience    | Interactions                                                                 |
| ------------------------------ | ------------- | ---------------------------------------------------------------------------- |
| `projects/can-do/`             | CAN/DO        | Drag the can lineup; scroll through four compositions                        |
| `projects/sneaker-studio/`     | Sole Studio   | Three original colorways, roughness, turntable                               |
| `projects/keyboard-builder/`   | Key / Form    | Palettes, exploded layers, clickable/typeable keys, switch sounds, underglow |
| `projects/perfume-collection/` | Essence       | Fragrance colors, cap lift, spray mist, frosted glass                        |
| `projects/vinyl-room/`         | Side A        | Record playback, local audio file, platter speed, plinth finish              |
| `projects/watch-explorer/`     | Second Nature | Strap/dial colors, exploded case, local time, accelerated hands              |
| `projects/miniature-city/`     | Small Hours   | Day/night, moving traffic, building selection                                |
| `projects/car-garage/`         | After Hours   | Masked paint colors, lighting, turntable, clearcoat                          |
| `projects/coffee-journey/`     | Daily Ritual  | Roast/grind/brew stages, milk, roast, cup colors, steam                      |

## Structure

```text
index.html / home.js / styles.css   Gallery with live 3D previews
projects/<project>/                Standalone entry point and scene.js
shared/                            Viewer, controls, geometry helpers, sound, registry
vendor/                            Pinned Three.js 0.179.1 and addons
assets/                            Shared fonts and source metadata
scripts/                           Development server, checks, static build
.openai/hosting.json                Private Sites hosting configuration
```

Each new scene exports an asynchronous `create(context)` function returning a Three.js `root`, optional `controls`, an `update(time, delta, context)` function, camera angle, and credits. The homepage uses these same models for its previews, rendered with one shared WebGL context. Full project pages load only the requested scene. CAN/DO retains its original independent scroll-based implementation.

## Notes

- Audio starts only after a user action. Uploaded tracks stay on the device and are never sent to a server.
- The shared viewer supports mouse/touch orbiting, scroll zoom, keyboard arrows, and reset. Keyboard keys take priority in the keyboard scene.
- Rendering pauses in hidden tabs; reduced-motion preferences suppress time-driven decorative motion.
- Models and fonts work without third-party asset requests.
- The automated scene checks use real geometry with image-loading stubs. They check controls and transforms, not browser rendering, visual quality, GPU shaders, or audible output. Browser QA has not been performed.

See [CREDITS.md](CREDITS.md) for the original assets, modifications, and licenses. This is a collection of interactive studies; the watch movement, city, and coffee stages are illustrative models.
