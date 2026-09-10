let context;
export function keySound(kind = 'soft') {
  context ??= new AudioContext();
  context.resume();
  const length = kind === 'clicky' ? 0.08 : 0.055;
  const buffer = context.createBuffer(
    1,
    Math.round(context.sampleRate * length),
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++)
    samples[i] = (Math.random() * 2 - 1) * Math.exp((-i / samples.length) * 7);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value =
    kind === 'clicky' ? 3200 : kind === 'thocky' ? 450 : 1000;
  filter.Q.value = 0.7;
  const gain = context.createGain();
  gain.gain.value = 0.12;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
}
