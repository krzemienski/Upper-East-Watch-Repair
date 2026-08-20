import { cn } from '@workspace/upper-east-horology/lib/utils';
import { usePrefersReducedMotion, useIsMobile } from '@/hooks/use-media-preference';
import { WatchPoster } from '@/components/WatchPoster';

const VIDEO_SRC = '/media/upper-east-watch-movement-hero.mp4';
const POSTER_SRC = '/media/upper-east-watch-movement-poster.jpg';

interface HeroMediaProps {
  className?: string;
}

/**
 * Cinematic hero background.
 * - Plays a generated 16:9 movement video (autoplay, muted, loop, playsInline, preload=none)
 *   on desktop when motion is allowed.
 * - Falls back to a static poster below 768px OR when reduced motion is preferred.
 * - Parallax is intentionally disabled in all cases.
 * - The abstract SVG WatchPoster renders beneath the poster/video as a guaranteed
 *   local fallback so the hero never shows a broken/blank surface before assets load.
 */
export function HeroMedia({ className }: HeroMediaProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const showStatic = reducedMotion || isMobile;

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-background', className)} aria-hidden="true">
      {/* Local abstract fallback — always present beneath the media layer */}
      <WatchPoster className="absolute inset-0 w-full h-full" />

      {showStatic ? (
        <img
          src={POSTER_SRC}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          onError={(e) => {
            // Hide the poster if the asset is not yet present; SVG fallback remains.
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={POSTER_SRC}
          onError={(e) => {
            (e.currentTarget as HTMLVideoElement).style.display = 'none';
          }}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {/* Cinematic scrim for legible foreground text */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
    </div>
  );
}
