# Glass Garden

A miniature ecosystem inside a hand-blown glass vessel. All geometry is original and procedural: soil strata, drainage gravel, river stones, moss cushions, branching wood, cupped and veined tropical leaves, seven fern fronds, condensation, and soft glowing fireflies.

## Run

From the repository root, run `npm run dev` and open http://127.0.0.1:4320/projects/glass-garden/.

## Four acts

1. **Room to grow.** An empty reflective vessel in pale botanical daylight.
2. **Good ground.** Gravel, charcoal, soil, and minerals settle into distinct layers.
3. **Life, unfolding.** Moss rises and sculpted leaves unfurl into a lush miniature garden.
4. **Even here, magic.** Midnight blue arrives, dew gathers on the glass, and fireflies drift between the leaves.

Every transform is sampled directly from scroll progress, so reverse scrolling and restored positions reproduce the same composition. Reduced motion freezes leaf sway and firefly drift and uses the shared static chapter poses. Mobile framing follows the shared scene scale and centers the vessel above the copy.

## Files

`scene.js` exports the mature gallery model and individually addressable parts. `story.js` owns the chapter copy, lighting, and deterministic choreography. `index.html` loads the shared scroll shell; `style.css` adds botanical serif art direction. No remote assets or additional dependencies are required.

Pebbles, soil flecks, moss, and droplets use instancing. Glass and droplets do not cast opaque shadows on the plants, and their transparent materials do not write depth. All materials and geometry are released by the shared disposal helper.
