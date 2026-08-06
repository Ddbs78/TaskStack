# Brand assets

Drop the four StackTask logo SVGs here:

- `favicon-black.svg` — mark only, black outline (for light backgrounds)
- `favicon-white.svg` — mark only, white outline (for dark backgrounds)
- `wordmark-black.svg` — full lockup, black (for light backgrounds)
- `wordmark-white.svg` — full lockup, white (for dark backgrounds)

Exact filenames don't matter — drop them in with any name and they'll be
wired up from here.

These are the source files. The runtime mark is rendered inline by
`src/components/BrandMark.jsx` so it can recolor per theme and animate
per-cube; `public/favicon.svg` is the static browser-tab copy.
