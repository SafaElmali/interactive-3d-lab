// Scroll choreography: lineup → featured can → back label → full lineup.
export const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const smoothstep = (from, to, value) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
export const easeOut = (t) => 1 - (1 - clamp(t)) ** 3;
export const easeInOut = (t) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
export const selectedIndex = (offset) => clamp(3 - Math.round(offset), 0, 6);

export function canPose({
  index,
  selected,
  offset,
  progress,
  time,
  mobile,
  frontRotation,
  backRotation,
  cameraZ,
  fov,
  velocity,
}) {
  const focus = easeInOut(smoothstep(0.21, 0.4, progress));
  const back = easeInOut(smoothstep(0.48, 0.64, progress));
  const shrink = easeOut(smoothstep(0.68, 0.8, progress));
  const regroup = easeOut(smoothstep(0.76, 0.94, progress));
  const relative = index - 3 + offset;
  const spread = index - selected;
  const active = index === selected;
  const startX = relative * (mobile ? 2.62 : 2.78);
  const startY = -0.45 + Math.cos(relative * 0.8) * 0.38;
  const startZ = -Math.abs(relative) * 0.2;
  const focusZ = mobile ? 0.3 : 0.5;
  const fit =
    (2 * (cameraZ - focusZ) * Math.tan((fov * Math.PI) / 360) * 0.68) / 3.62;
  const front = frontRotation + Math.PI / 18 + Math.sin(index * 1.7) * 0.025;
  let x = active
    ? lerp(startX, mobile ? 0.72 : 2.65, focus)
    : startX + (spread < 0 ? -1 : 1) * (mobile ? 8 : 12) * focus;
  let y = active
    ? lerp(startY, -0.1, focus)
    : startY + Math.abs(relative) * 0.35 * focus;
  let z = active ? lerp(startZ, focusZ, focus) : startZ - focus * 3;
  let scale = active
    ? lerp(1, Math.min(mobile ? 1.12 : 1.38, fit), focus)
    : lerp(1, 0.7, focus);
  let rx = Math.sin(relative * 0.9) * 0.14;
  let ry = front;
  let rz = relative * -0.13;
  if (active) {
    ry =
      lerp(ry, frontRotation + Math.PI * 4, focus) +
      Math.sin(time * 0.7) * 0.018 * focus * (1 - regroup);
    ry = lerp(ry, backRotation + Math.PI * 4, back);
    rx = lerp(lerp(rx, -0.12, focus), 0.06, back) + velocity * 0.0015;
    rz =
      lerp(lerp(rz, 0.11, focus), -0.1, back) +
      Math.sin(time * 1.2) * 0.015 * focus * (1 - regroup);
    y += Math.sin(time * 1.35) * 0.045 * focus;
  }
  if (regroup > 0) {
    x = lerp(x, spread * (mobile ? 2.05 : 2.55), regroup);
    y = lerp(y, -0.72 + Math.abs(spread) * (mobile ? 0.14 : 0.1), regroup);
    z = lerp(z, 0, regroup);
    rx = lerp(rx, 0, regroup);
    ry = lerp(ry, front + Math.PI * 4, regroup);
    rz = lerp(rz, spread * 0.055, regroup);
  }
  scale = lerp(scale, mobile ? 0.54 : 0.82, shrink);
  scale *= 1 + Math.sin(time * 0.9 + index) * 0.004;
  const opacity = Math.max(
    active ? 1 : 1 - smoothstep(0.24, 0.34, progress),
    smoothstep(0.74, 0.9, progress),
  );
  return {
    x,
    y,
    z,
    rx,
    ry,
    rz,
    scale,
    opacity,
    labelFocus: back * (1 - regroup),
  };
}
