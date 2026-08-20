# Hero media

The home hero (`src/components/HeroMedia.tsx`) uses three production assets:

- `upper-east-watch-movement-hero.webm` — 1920×1080 VP9, 7.25 seconds, 1.4 MB.
- `upper-east-watch-movement-hero.mp4` — 1920×1080 H.264, 7.25 seconds, 1.5 MB.
- `upper-east-watch-movement-poster.jpg` — a static poster frame shown below
  768px, when the user prefers reduced motion, and as the video poster
  (1920×1080, 224 KB).

The source master is an 8-second, high-quality 1920×1080 generation. Delivery
files remove the first 0.75 seconds from the main timeline and crossfade the
final 0.75 seconds into that opening segment. The resulting 7.25-second files
begin and end on the same source moment for a calm seamless loop.

On desktop the generated media uses `autoplay muted loop playsInline
preload="none"` and translates at 0.4× scroll speed. IntersectionObserver pauses
the video off-screen. Below 768px and under `prefers-reduced-motion`, the video
element is not rendered, so no video file is requested; the poster is static.
The local token-driven `WatchPoster` remains underneath as a failure fallback.

Combined public hero media is 3.17 MB, below the 5 MB budget.
