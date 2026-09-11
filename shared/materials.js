import * as T from 'three';
const textureCache = new Map();
const maps = {
  wood: [
    'dark_wood/dark_wood_diff_1k.jpg',
    'dark_wood/dark_wood_nor_gl_1k.jpg',
    'dark_wood/dark_wood_rough_1k.jpg',
  ],
  leather: [
    'brown_leather/brown_leather_albedo_1k.jpg',
    'brown_leather/brown_leather_nor_gl_1k.png',
    'brown_leather/brown_leather_rough_1k.png',
  ],
  stone: [
    'concrete_wall_007/concrete_wall_007_diff_1k.jpg',
    'concrete_wall_007/concrete_wall_007_nor_gl_1k.jpg',
    'concrete_wall_007/concrete_wall_007_rough_1k.jpg',
  ],
};
export async function surface(
  material,
  name,
  { repeat = [1, 1], strength = 0.35, color = true } = {},
) {
  const textures = await Promise.all(
    maps[name].map(async (file, i) => {
      if (!textureCache.has(file))
        textureCache.set(
          file,
          new T.TextureLoader().loadAsync(
            new URL(`../assets/materials/${file}`, import.meta.url).href,
          ),
        );
      const texture = (await textureCache.get(file)).clone();
      texture.colorSpace = i === 0 ? T.SRGBColorSpace : T.NoColorSpace;
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(...repeat);
      texture.anisotropy = 8;
      return texture;
    }),
  );
  if (color) material.map = textures[0];
  else textures[0].dispose();
  material.normalMap = textures[1];
  material.roughnessMap = textures[2];
  material.normalScale.setScalar(strength);
  material.needsUpdate = true;
  return material;
}
// Tiny object-space roughness variation catches grazing light without an image.
export function microfinish(material, scale = 180, strength = 0.1) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 labSurface;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nlabSurface = position;',
    );
    shader.fragmentShader =
      'varying vec3 labSurface;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      vec3 cell = floor(labSurface * ${Number(scale).toFixed(1)});
      float grain = fract(sin(dot(cell, vec3(12.9898,78.233,39.425))) * 43758.5453);
      roughnessFactor = clamp(roughnessFactor + (grain - 0.5) * ${Number(strength).toFixed(3)}, 0.04, 1.0);`,
    );
  };
  material.customProgramCacheKey = () => `microfinish-${scale}-${strength}`;
  return material;
}
