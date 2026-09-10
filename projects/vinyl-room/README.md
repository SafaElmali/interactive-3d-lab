# Side A

An original procedural turntable with a grooved record, rotating platter, moving tonearm, and local audio playback.

## Run

From the repository root, run `npm run dev` and open http://127.0.0.1:4320/projects/vinyl-room/.

## Interaction

Play the synthesized loop, select an audio file, set platter speed, and change the plinth finish. Audio files remain on the device.

## Files

`index.html` is the standalone entry point. `scene.js` owns this project’s model, controls, and animation. Shared rendering and interface code lives in `../../shared/`.

Model and font attribution is recorded in the root `CREDITS.md`.
