# Brand assets

Three source files, exported from Illustrator, each ~1.3MB with the usual bloat
(dozens of hidden duplicate `_copy` layers from design history, two embedded
raster previews, Adobe metadata). Only one top-level group per file is ever
actually visible — everything else is `display:none` and safe to discard.

- `mark.svg` — the cube icon alone. Used identically in **every** theme and
  mode; it has no outline, so there is nothing to recolor. This is also the
  browser-tab favicon (`public/favicon.svg` is a straight copy of
  `mark.clean.svg`).
- `wordmark-black.svg` / `wordmark-white.svg` — the full lockup (cubes + the
  "TASKSTACK" wordmark). The cube geometry is byte-identical to `mark.svg` in
  both; only the wordmark's text fill differs, which is why it's still two
  files rather than one recoloured at runtime.

Each has a matching `*.clean.svg` — the stripped, actually-shipped version.
`scripts/` doesn't exist for this; the cleanup was one-off surgery: find the
sole non-`display:none` top-level `<g>`, keep only the CSS classes and
gradient/clipPath `<defs>` it actually references (traced through
`xlink:href` chains), drop the rest. ~1.3MB → 5–8KB per file.

**The `.cube` grouping.** The raw export leaves all 9 face polygons (3 cubes
× 3 faces) as flat siblings, not grouped per cube — so `BrandMark.jsx`'s
tumble easter egg has nothing to rotate independently. The cleanup step
clusters the 9 polygons into 3 groups of 3 by spatial centroid (k-means,
k=3) and wraps each in `<g class="cube">`. `BrandMark.jsx` queries `.cube`
directly; it does not depend on any Illustrator layer id, which will change
on the next re-export.

**If you re-export from Illustrator:** re-run the same extraction — find the
visible group, resolve its referenced defs, cluster its 9 polygons into 3
`.cube` groups by centroid. The `_copy` layer names and internal ids are not
stable across exports; the `.cube` class is the only thing the code depends on.

**Consistency rule (hard requirement):** the mark must render pixel-identical
everywhere it appears — header, both modes, the onboarding sequence, both
guides. It is one component (`BrandMark.jsx`) reading one file; never fork it
per surface.
