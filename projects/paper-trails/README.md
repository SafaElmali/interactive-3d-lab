# Paper Trails

A vermilion square folds into an origami crane, then a small flock lifts into a pale blue sky.

## Four acts

1. **A square of possibility.** An uncut square of paper, with a subtle crease pattern.
2. **Mountain meets valley.** Four triangular sections rotate about their crease axes while the center forms a raised fold.
3. **The shape of a thought.** The same mesh resolves into a faceted body, articulated neck and beak, pointed tail and broad wings.
4. **Good things take flight.** Seven smaller cranes emerge with staggered wingbeats and a gentle vertical drift.

All geometry is original and procedural, built locally with Three.js. The folding sequence is an artistic study, not a physical origami simulation. No remote models, textures or fonts are needed beyond the collection's bundled assets.

`scene.js` exports the folded crane gallery preview and reusable paper geometry. `story.js` samples every transform and animated vertex directly from scroll progress and time. Reverse scrolling restores the exact state. Reduced motion freezes time-based wingbeats and floating; mobile uses the collection's shared camera scaling with tighter flock spacing. Every companion owns cloned geometry, and preview mode omits the flock entirely so gallery bounds stay tight.

Run `node scripts/check-scenes.mjs paper-trails` from the repository root to verify the preview, all 122 desktop/mobile scroll samples and exact reverse-scroll restoration.
