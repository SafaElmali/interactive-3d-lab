# Side A

An original procedural turntable with a grooved record, rotating platter, moving tonearm, and levitating discs.

## Run

From the repository root, run `npm run dev` and open http://127.0.0.1:4320/projects/vinyl-room/.

## Scroll story

Scroll to move through four animated compositions. The experience follows document scroll and reverses naturally. No customization controls are required. Reduced motion uses static chapter poses.

## Files

`index.html` is the standalone entry point. `scene.js` owns the model; `story.js` owns the art direction, chapter copy, and scroll choreography. Shared rendering and interface code lives in `../../shared/`.

Model and font attribution is recorded in the root `CREDITS.md`.
