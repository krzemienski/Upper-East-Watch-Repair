import { useEffect, useRef, useState } from 'react';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { usePrefersReducedMotion, useIsMobile } from '@/hooks/use-media-preference';
import { WatchPoster } from '@/components/WatchPoster';

const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const VIDEO_MP4_SRC = `${BASE_PATH}media/upper-east-watch-movement-hero.mp4`;
const VIDEO_WEBM_SRC = `${BASE_PATH}media/upper-east-watch-movement-hero.webm`;
const POSTER_SRC = `${BASE_PATH}media/upper-east-watch-movement-poster.jpg`;

interface HeroMediaProps {
  className?: string;
}

/**
 * Cinematic hero background.
 * - Plays a generated 16:9 movement video (autoplay, muted, loop, playsInline, preload=none)
 *   on desktop when motion is allowed.
 * - Falls back to a static poster below 768px OR when reduced motion is preferred.
 * - Moves at 0.4× scroll speed on desktop and pauses when off-screen.
 * - The abstract SVG WatchPoster renders beneath the poster/video as a guaranteed
 *   local fallback so the hero never shows a broken/blank surface before assets load.
 */
export function HeroMedia({ className }: HeroMediaProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const showStatic = reducedMotion || isMobile;
  const [mediaFailed, setMediaFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const motionLayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (showStatic || mediaFailed) return;

    const container = containerRef.current;
    const motionLayer = motionLayerRef.current;
    const video = videoRef.current;
    if (!container || !motionLayer || !video) return;

    let frame = 0;
    let visible = true;

    const updateParallax = () => {
      frame = 0;
      const scrollInsideHero = Math.max(0, -container.getBoundingClientRect().top);
      motionLayer.style.transform = `translate3d(0, ${scrollInsideHero * 0.4}px, 0)`;
    };

    const requestParallaxUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };

    const syncPlayback = () => {
      if (visible) {
        void video.play().catch(() => {
          // Autoplay can be blocked by browser policy; the poster remains visible.
        });
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.01 },
    );

    observer.observe(container);
    video.addEventListener('canplay', syncPlayback);
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    updateParallax();

    return () => {
      observer.disconnect();
      video.removeEventListener('canplay', syncPlayback);
      window.removeEventListener('scroll', requestParallaxUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [mediaFailed, showStatic]);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden bg-background', className)}
      aria-hidden="true"
    >
      {/* Local abstract fallback — always present beneath the media layer */}
      <WatchPoster className="absolute inset-0 w-full h-full" />

      {showStatic && !mediaFailed ? (
        <img
          src={POSTER_SRC}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          onError={() => setMediaFailed(true)}
        />
      ) : !mediaFailed ? (
        <div
          ref={motionLayerRef}
          className="absolute -inset-x-[4%] -top-[15%] h-[130%] w-[108%] will-change-transform"
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={POSTER_SRC}
            onError={() => setMediaFailed(true)}
          >
            <source src={VIDEO_WEBM_SRC} type="video/webm" />
            <source src={VIDEO_MP4_SRC} type="video/mp4" />
          </video>
        </div>
      ) : null}

      {/* Cinematic scrim for legible foreground text */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
    </div>
  );
}
