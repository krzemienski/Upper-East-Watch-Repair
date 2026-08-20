# Hero media

The home hero (`src/components/HeroMedia.tsx`) expects two assets in this folder:

- `upper-east-watch-movement-hero.mp4` — a generated 16:9 watch-movement video.
  Played on desktop with `autoplay muted loop playsInline preload="none"`.
- `upper-east-watch-movement-poster.jpg` — a static poster frame shown below
  768px, when the user prefers reduced motion, and as the video poster.

Until these assets are added, the hero falls back gracefully to the local
abstract SVG horology motif (`WatchPoster`). Parallax is intentionally disabled
in all cases. Drop the files here with the exact names above to activate them.
