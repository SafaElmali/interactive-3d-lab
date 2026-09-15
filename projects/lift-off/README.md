# Lift Off

A fictional Aster 01 launch vehicle moves from the pad to a satellite's first view of Earth. An original procedural Three.js model, built for Object Lab's shared four-act scroll shell.

## Four acts

1. **Lift Off:** cream and vermilion rocket, engine bell, fins, riveted stage joints, service lines, launch gantry and striped pad.
2. **Go for Launch:** ignition reveals a layered orange exhaust and low-poly smoke while the launch structure drops out of frame.
3. **Let Go:** the booster drifts away, the upper engine appears and the two fairing shells open.
4. **Wide Open:** a gold satellite expands into the frame, its two cobalt solar arrays unfold and a curved, cloud-streaked Earth fills the horizon.

`scene.js` exports the assembled gallery model and named movable parts. `story.js` exports the story copy, palette and scroll choreography. Each pose is derived directly from progress; reverse scrolling and restored positions require no playback history. The only time-driven motion is engine flicker, frozen for reduced motion. Shared mobile framing and chapter-level reduced motion remain in effect.

All geometry, landforms, clouds, lettering and materials are created locally. Repeated fasteners, solar cells and smoke use instancing. No external models, images, fonts or runtime requests were added. This is a visual fiction, not a physical launch simulation.
