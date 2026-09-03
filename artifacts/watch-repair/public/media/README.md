# Site-wide cinematic media inventory

The public site uses a fixed-viewport collection of four silent, seamless
1920×1080 mechanical-watch loops. The page scrolls over this persistent layer,
so the movement remains subtly visible beyond the homepage hero. Each delivery
has an H.264 MP4 fallback, a VP9 WebM primary source, and a matched eager-display
JPEG poster.

| Variation | Source / treatment | MP4 | WebM | Poster | Direction |
| --- | --- | --- | --- | --- | --- |
| Movement | Original 8-second generated macro movement master; first 0.75 seconds removed and final 0.75 seconds crossfaded into the opening | `upper-east-watch-movement-hero.mp4` — H.264 High, 1920×1080, 24fps, 7.25s, 1.44 MB | `upper-east-watch-movement-hero.webm` — VP9, 1920×1080, 24fps, 7.25s, 1.36 MB | `upper-east-watch-movement-poster.jpg` — JPEG, 1920×1080, 224 KB | Brand-base turquoise, silver, and black |
| Sapphire | Movement delivery re-timed to open 1.65 seconds later, with restrained blue/cyan balance and cooler highlights | `upper-east-watch-sapphire-hero.mp4` — H.264 High, 1920×1080, 24fps, 7.25s, 2.07 MB | `upper-east-watch-sapphire-hero.webm` — VP9, 1920×1080, 24fps, 7.25s, 2.25 MB | `upper-east-watch-sapphire-poster.jpg` — JPEG, 1920×1080, 272 KB | Cool sapphire |
| Metallic | Movement delivery re-timed to open 3.35 seconds later, with warmer red/gold highlights and reduced saturation | `upper-east-watch-metallic-hero.mp4` — H.264 High, 1920×1080, 24fps, 7.25s, 2.34 MB | `upper-east-watch-metallic-hero.webm` — VP9, 1920×1080, 24fps, 7.25s, 2.11 MB | `upper-east-watch-metallic-poster.jpg` — JPEG, 1920×1080, 280 KB | Warm metallic |
| Graphite | Movement delivery re-timed to open 5.10 seconds later, with deeper blacks, higher contrast, and near-monochrome color | `upper-east-watch-graphite-hero.mp4` — H.264 High, 1920×1080, 24fps, 7.25s, 2.30 MB | `upper-east-watch-graphite-hero.webm` — VP9, 1920×1080, 24fps, 7.25s, 2.21 MB | `upper-east-watch-graphite-poster.jpg` — JPEG, 1920×1080, 269 KB | Deep graphite |

All assets are silent and carry no brand marks. The re-timed deliveries wrap the
already seamless source, so their final and opening frames remain continuous.
MP4 files use `yuv420p`, H.264 High Profile, and fast-start metadata. WebM files
use VP9 with row-based multithreading. Posters are JPEG quality level 3.

`HeroMedia.tsx` shuffles the initial order, maintains a no-immediate-repeat
shuffle bag, and mounts/preloads only the active and upcoming video. Both video
layers share the same geometry, preventing layout shift or black frames during
the one-second opacity crossfade.
Playback pauses when the browser tab is hidden. Desktop applies a restrained
oscillating vertical drift as the document scrolls while the oversized media
layer stays fixed behind the full public site; mobile remains fixed and uses
muted inline autoplay. Public content surfaces use token-based translucency so
motion remains present without compromising legibility.

For `prefers-reduced-motion`, no video is mounted: the original movement poster
is shown without rotation or parallax. The token-driven `WatchPoster` remains
beneath every asset as the final local fallback. A failed video is removed from
the shuffle bag for the visit, allowing the collection to continue rather than
blanking the hero.