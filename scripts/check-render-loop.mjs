import assert from 'node:assert/strict';
import { createRenderLoop } from '../shared/render-loop.js';

function harness(hz = 120) {
  let now = 0,
    id = 0,
    reduced = false,
    visible = true,
    settling = false;
  const callbacks = new Map(),
    frames = [];
  const loop = createRenderLoop(
    (dt) => {
      frames.push({ now, dt });
      return settling;
    },
    {
      reduced: () => reduced,
      visible: () => visible,
      clock: {
        now: () => now,
        request(callback) {
          callbacks.set(++id, callback);
          return id;
        },
        cancel(key) {
          callbacks.delete(key);
        },
      },
    },
  );
  function advance(ms, interact = false) {
    const end = now + ms;
    while (now + 1000 / hz <= end + 0.0001) {
      now += 1000 / hz;
      if (interact) loop.invalidate();
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(now));
    }
  }
  return {
    loop,
    frames,
    callbacks,
    advance,
    reduced(value) {
      reduced = value;
    },
    visible(value) {
      visible = value;
    },
    settling(value) {
      settling = value;
    },
  };
}

for (const hz of [60, 120, 144]) {
  const h = harness(hz);
  h.advance(2000, true);
  assert.ok(
    h.frames.length >= 118 && h.frames.length <= 121,
    `${hz} Hz: expected about 120 renders in two seconds, got ${h.frames.length}`,
  );
  h.advance(2000);
  assert.equal(
    h.callbacks.size,
    0,
    'Idle must have no pending animation callbacks',
  );
  const count = h.frames.length;
  h.advance(60000);
  assert.equal(h.frames.length, count, 'Idle must not redraw');
  h.loop.invalidate();
  h.advance(1000 / hz);
  assert.equal(
    h.frames.length,
    count + 1,
    'Input must wake the canvas immediately',
  );
  assert.ok(
    h.frames.at(-1).dt <= 1 / 60,
    'Resuming must not jump animation time',
  );
}

const h = harness();
h.settling(true);
h.loop.invalidate();
h.advance(2500);
assert.equal(
  h.callbacks.size,
  1,
  'Keep rendering while a scroll transition settles',
);
h.settling(false);
h.advance(30);
assert.equal(h.callbacks.size, 0);
h.visible(false);
h.loop.invalidate();
h.advance(1000);
assert.equal(h.callbacks.size, 0, 'Hidden pages must not wake');
h.visible(true);
h.loop.invalidate();
h.advance(30);
h.loop.stop();
assert.equal(h.callbacks.size, 0, 'Page hide must cancel pending work');
const stopped = h.frames.length;
h.advance(1000);
assert.equal(h.frames.length, stopped);
h.loop.invalidate();
h.advance(30);
assert.ok(
  h.frames.length > stopped,
  'Back/forward restore must be able to resume',
);
h.reduced(true);
h.loop.invalidate();
const beforeReduced = h.frames.length;
h.advance(2000);
assert.equal(
  h.frames.length,
  beforeReduced + 1,
  'Reduced motion only draws an updated pose',
);
assert.equal(h.callbacks.size, 0);
h.loop.dispose();
h.loop.invalidate();
assert.equal(h.callbacks.size, 0, 'Disposed pages cannot restart');
console.log(
  'Render scheduling: 60/120/144 Hz, idle, settling, hidden, restore and reduced motion passed.',
);
