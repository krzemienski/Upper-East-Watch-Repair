# Hero video production specification

## Generated source

The hero uses a real AI-generated video created through Replit's supported
`generateVideo` service in high-quality mode.

- Source master: `attached_assets/generated_videos/upper-east-watch-movement-hero-master.mp4`
- Source dimensions: 1920×1080
- Aspect ratio: 16:9
- Source duration: 8.00 seconds
- Source codec: H.264 High Profile, 24 fps, no audio
- Person generation: disabled

### Authored prompt

> An eight-second single continuous cinematic macro shot traveling slowly
> through the interior of an unbranded Swiss mechanical wristwatch movement.
> Precision brushed-silver bridges, polished steel gears, ruby jewels, and a
> hypnotic balance wheel move with physically convincing micro-mechanical detail
> against a completely flat black surrounding field. Restrained turquoise
> reflections skim the metal edges like cool atelier light; silver remains the
> dominant material and the scene never becomes bright or white. The camera
> performs an extremely slow, stable forward drift with subtle parallax between
> foreground gears and deeper movement layers. Compose for a luxury watch-repair
> website hero: generous dark negative space in the left-center for headline
> legibility, the most intricate mechanism weighted to the right third, shallow
> depth of field but readable craftsmanship. The motion at the final second
> should closely echo the opening camera position and gear rhythm so the clip
> crossfades into a seamless calm loop. No cuts, no speed ramps, no dramatic
> reveal, no sound-dependent action. Photoreal, editorial, understated, precise,
> high-end macro cinematography.

### Negative prompt

> people, hands, faces, text, letters, numbers, logos, brand names, watermarks,
> white background, white flash, bright studio cyclorama, excessive gold,
> fantasy machinery, impossible gear intersections, melted metal, warped watch
> parts, jitter, camera shake, cuts, jump cuts, fast camera motion, strobing,
> flicker, exposure pumping, smoke, dust storm, sparks, product packaging

## Web delivery files

All files live in `artifacts/watch-repair/public/media/`.

| File | Format | Dimensions | Duration | Size |
| --- | --- | ---: | ---: | ---: |
| `upper-east-watch-movement-hero.webm` | VP9 | 1920×1080 | 7.25 s | 1.4 MB |
| `upper-east-watch-movement-hero.mp4` | H.264 High | 1920×1080 | 7.25 s | 1.5 MB |
| `upper-east-watch-movement-poster.jpg` | JPEG | 1920×1080 | static | 224 KB |

Combined public hero media is 3.17 MB, below the 5 MB budget. The generated
8-second master is kept outside the public app so visitors never download it.

## Loop construction

The delivery files start at source time 0.75 seconds. Their final 0.75 seconds
crossfade into source time 0.00–0.75. The output therefore ends on the same
source moment where it begins, producing a calm seamless loop without a white
flash or hard edit.

The browser loads WebM first and keeps MP4 as the Safari-compatible fallback.
The element is `autoplay`, `muted`, `loop`, `playsInline`, and `preload="none"`.

## Parallax and accessibility

- Desktop, motion allowed: the media layer translates at 0.4× scroll speed via
  one `requestAnimationFrame`-throttled listener.
- Off-screen: `IntersectionObserver` pauses playback and resumes it when the
  hero returns.
- Below 768 px: the video element is not rendered; the static poster is used.
- `prefers-reduced-motion: reduce`: the video element is not rendered and there
  is no parallax.
- Failure fallback: a local token-driven SVG watch motif remains behind every
  media layer.
- The video is decorative and hidden from assistive technology. All meaning is
  carried by the foreground heading and call to action.

## Re-encoding

If the source is replaced, retain the exact public filenames. Recreate the
0.75-second end-to-start crossfade, export a WebM and MP4, extract a representative
JPEG poster, and keep combined public media below 5 MB. Verify dimensions and
duration with `ffprobe` before publishing.