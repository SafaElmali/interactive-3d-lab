# Insert Coin

An original procedural arcade cabinet and imaginary game, **Orbit Run**. Four scroll-driven acts assemble the cabinet, boot its bowed CRT, let the little geometric game unfold into the room, and frame the cabinet in a neon orbital finale.

## Implementation

- `scene.js` exports `create({ preview })`, a complete assembled gallery model with a custom extruded cabinet profile, luminous edge piping, side graphics, metal fittings, a six-button deck, joystick, coin return, marquee, and convex CRT glass. `createGameWorld` builds the separate dimensional platforms, runner, collectibles, and portals used by the story.
- `story.js` exports four chapters and `createStory()`. Animation is sampled directly from scroll progress. Reversing or restoring scroll positions restores the same transforms and materials; ambient motion freezes for reduced motion.
- `style.css` scopes the arcade typography and subtle scanline backdrop to this world.
- Everything is local procedural Three.js geometry. Text is rendered with the shared canvas-label utility; the artwork uses original geometric motifs and has no external texture or character dependencies.
- The expanding game world is added after the cabinet rig is measured, preserving useful gallery and story framing. Repeated scanlines and spark cubes use instancing.

## Validation

Run `node scripts/check-scenes.mjs insert-coin` for gallery geometry, 122 desktop/mobile scroll poses, reverse scrolling, and reduced-motion state checks. Run `node --check projects/insert-coin/scene.js` and `node --check projects/insert-coin/story.js` for syntax.
