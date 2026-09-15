# Deep Blue

An original procedural jellyfish drifting through four scroll-controlled ocean compositions.

1. **A softer kind of life:** translucent scalloped bell, radial canals, and internal horseshoe organs.
2. **Feel the current:** a closer view of six twisting oral arms and twenty long, delicate tentacles.
3. **A drifting bloom:** five smaller companions join the current.
4. **Below the blue:** the ocean darkens and cyan/violet bioluminescence brightens.

The hero preview contains only one jellyfish so camera normalization stays accurate. Story companions share its geometry and materials. Ribbon and tentacle buffers are reused during animation; all positions, material values, and transforms are derived from absolute time and scroll progress. Reduced motion freezes swimming and particle drift. Mobile framing uses the shared story camera and responsive world scale.

All geometry, shaders, particles, and animation are original and local. No external assets or new dependencies.

Validation: `node scripts/check-scenes.mjs deep-blue`.
