// Render during interaction and its settling motion; leave the last frame on
// screen when idle. A 120/144 Hz display should not double the GPU workload.
export function createRenderLoop(
  render,
  {
    reduced = () => false,
    visible = () => !document.hidden,
    clock = {
      now: () => performance.now(),
      request: (callback) => requestAnimationFrame(callback),
      cancel: (id) => cancelAnimationFrame(id),
    },
  } = {},
) {
  const interval = 1000 / 60;
  let request = 0,
    previous = null,
    deadline = null,
    activeUntil = 0,
    disposed = false;

  function schedule() {
    if (!request && !disposed && visible()) request = clock.request(frame);
  }

  function stop() {
    if (request) clock.cancel(request);
    request = 0;
    previous = deadline = null;
  }

  function frame(now) {
    request = 0;
    if (disposed || !visible()) return stop();
    if (deadline !== null && now < deadline - 0.5) return schedule();
    const dt =
      previous === null ? 1 / 60 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    deadline =
      deadline === null
        ? now + interval
        : now + interval - (Math.max(0, now - deadline) % interval);
    const settling = render(dt);
    if (!reduced() && (now < activeUntil || settling)) schedule();
    else previous = deadline = null;
  }

  return {
    invalidate: () => {
      activeUntil = clock.now() + (reduced() ? 0 : 1000);
      schedule();
    },
    stop,
    dispose() {
      stop();
      disposed = true;
    },
  };
}
