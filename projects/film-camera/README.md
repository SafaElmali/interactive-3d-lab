# Light / Leak

An original procedural 35 mm camera in warm silver, black textured grip, brass, and coated optical glass. The machined lens rings, knurled dials, eight aperture blades, rangefinder windows, shutter release, winding lever, and perforated film are modeled with local Three.js geometry.

## Run

From the repository root, run `npm run dev` and open http://127.0.0.1:4320/projects/film-camera/.

## Four acts

1. **Light / Leak:** a complete camera portrait against rust red.
2. **Look closer:** the lens separates into a suspended optical stack.
3. **Let it in:** an enlarged eight-blade iris opens onto warm light.
4. **Keep the feeling:** five geometric miniature exposures unfurl on perforated amber film: dunes, skyline, lakeside tree, arches, and a sailboat.

Every transform and aperture vertex derives from scroll progress, so restored positions and reverse scrolling reconstruct the same scene. Reduced motion freezes ambient motion and uses the shared chapter compositions. Mobile uses the shared world scale and narrower horizontal offsets.

## Files

- `scene.js`: assembled gallery model, reusable optical parts, aperture geometry, and original film miniatures.
- `story.js`: four-act copy and deterministic choreography.
- `index.html`: standalone route using the shared story renderer.
- `style.css`: local editorial type treatment.

No remote assets or extra dependencies. Fonts and renderer environment use the collection's existing local resources. All camera and miniature artwork is original procedural geometry.
