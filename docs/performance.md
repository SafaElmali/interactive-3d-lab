# Performance check — 12 September 2026

The project pages were continuously rendering on a 120 Hz screen even without
interaction. They now render at up to 60 fps during interaction, keep rendering
until the scroll/selection transition settles, then retain their last frame.
Ambient motion resumes on the next interaction. Hidden pages pause, and reduced
motion draws updated static poses without running an idle animation loop.

The city's repeated windows, frames and sills now use instanced drawing within
each building. Their geometry, materials, shadows, placement and day/night
changes are preserved. Model resolution, textures, shadow resolution and pixel
ratio limits are unchanged.

## Measurements

Six-second samples in the Codex Chromium browser on the same computer. The
matched city scrolling comparison used a 1280 × 720 viewport, device pixel ratio
2 and a 120 Hz animation clock. Input was 80 small wheel events about 60 ms apart.
The sampling window includes the final settling frames.

| Measurement                                    |    Before |     After |
| ---------------------------------------------- | --------: | --------: |
| City, idle rendered frames in 6 seconds        |       719 |         0 |
| Car, idle rendered frames in 6 seconds         |       720 |         0 |
| CAN/DO, idle rendered frames in 6 seconds      |       719 |         0 |
| City, scrolling renders per second             |     120.0 |      59.7 |
| City, draw calls per rendered frame            |     1,412 |       336 |
| City, submitted triangles per rendered frame   | 1,390,664 | 1,390,664 |
| City, median render-callback CPU time          |    2.1 ms |    1.3 ms |
| City, 95th-percentile render-callback CPU time |    2.3 ms |    1.8 ms |

The gallery already produced zero renders and zero animation callbacks in an
idle sample. No additional gallery rendering changes were needed in this pass.
The earlier gallery scrolling fix is included in the published source.

Draw calls and triangles were counted at the WebGL draw methods, including
shadow passes. Render timing wraps animation callbacks; it measures CPU work,
not GPU completion time. Idle samples were taken after loading and transitions
settled. The city idle after-sample used the browser's native 919 × 863 viewport
at DPR 2; draw-count and timing comparisons used the matched viewport above.

These are single-machine measurements, not GPU utilization, watts, battery-life
results or a physical-phone benchmark. Active scenes still use detailed models,
physical materials and shadows. Slower devices may remain limited by that work.

## Validation

- Scheduler checks at 60, 120 and 144 Hz: frame cap, idle sleep, input wake,
  transition settling, hidden state, stop/resume, disposal and reduced motion.
- Instance checks preserve each original transform, geometry, material and shadow
  flags; scene bounds remain equivalent in the test fixture.
- All nine scene checks and 122 poses per scroll story, including reverse scroll,
  mobile framing and reduced motion.
- Browser checks of city day/night, car scrolling, CAN/DO selection and pointer
  input, and a 390 × 844 layout with reduced motion. No horizontal overflow in
  the checked mobile city layout.

Run the automated checks with `npm run check` and build with `npm run build`.
