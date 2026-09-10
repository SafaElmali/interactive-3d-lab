# Asset and design attribution

Original experience, layout, text, label artwork, and choreography reference: [CAN/DO by fka.dev](https://blog.fka.dev/can/). The new implementation keeps this design credit in the page footer.

## 3D model

“Soda Can” by Jeremy, via [Poly Pizza](https://poly.pizza/m/cNjAaDY27fQ), licensed under [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/).

Downloaded from https://blog.fka.dev/can/assets/soda-can.glb. The model is rescaled and combined with label sleeves, rim geometry, lid geometry, and new materials at runtime.

## Can labels

Downloaded unchanged from the reference's `https://blog.fka.dev/can/assets/brands/` directory:

- coca-cola.jpg
- 7up.jpg
- dr-pepper.jpg
- sprite.jpg
- fanta.jpg
- pepsi.jpg
- mtn-dew.jpg

No separate license for these label images is stated on the reference page. Brand names and marks belong to their respective owners. Nutrition panels are demonstration artwork from the reference, drawn over the wraps at runtime. No textures were generated with ImageGen; the original files were available.

## Fonts

Barlow Condensed, DM Mono, and Playfair Display, downloaded from Google Fonts and hosted locally. Their SIL Open Font License notices are in `assets/fonts/`.

## Library

Three.js 0.179.1, GLTFLoader, and BufferGeometryUtils are vendored from the official Three.js npm package via jsDelivr. Three.js is MIT licensed; see `vendor/THREE-LICENSE.txt`. The loader's relative utility import was adjusted for this directory structure.
