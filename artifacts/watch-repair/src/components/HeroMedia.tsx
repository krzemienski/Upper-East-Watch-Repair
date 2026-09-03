import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { usePrefersReducedMotion, useIsMobile } from '@/hooks/use-media-preference';
import { WatchPoster } from '@/components/WatchPoster';

const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

interface HeroVariation {
  id: string;
  mp4: string;
  webm: string;
  poster: string;
}

const HERO_VARIATIONS: HeroVariation[] = [
  {
    id: 'movement',
    mp4: 'upper-east-watch-movement-hero.mp4',
    webm: 'upper-east-watch-movement-hero.webm',
    poster: 'upper-east-watch-movement-poster.jpg',
  },
  {
    id: 'sapphire',
    mp4: 'upper-east-watch-sapphire-hero.mp4',
    webm: 'upper-east-watch-sapphire-hero.webm',
    poster: 'upper-east-watch-sapphire-poster.jpg',
  },
  {
    id: 'metallic',
    mp4: 'upper-east-watch-metallic-hero.mp4',
    webm: 'upper-east-watch-metallic-hero.webm',
    poster: 'upper-east-watch-metallic-poster.jpg',
  },
  {
    id: 'graphite',
    mp4: 'upper-east-watch-graphite-hero.mp4',
    webm: 'upper-east-watch-graphite-hero.webm',
    poster: 'upper-east-watch-graphite-poster.jpg',
  },
].map((variation) => ({
  ...variation,
  mp4: `${BASE_PATH}media/${variation.mp4}`,
  webm: `${BASE_PATH}media/${variation.webm}`,
  poster: `${BASE_PATH}media/${variation.poster}`,
}));

const CROSSFADE_SECONDS = 1;
const CROSSFADE_MS = CROSSFADE_SECONDS * 1000;

function shuffledIndexes(): number[] {
  const indexes = HERO_VARIATIONS.map((_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[swapWith]] = [indexes[swapWith], indexes[index]];
  }
  return indexes;
}

interface HeroMediaProps {
  className?: string;
}

/**
 * Two-slot cinematic hero: only the active and upcoming variations are mounted.
 * The upcoming video starts during the final second and overlaps the active one.
 */
export function HeroMedia({ className }: HeroMediaProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const initialOrder = useMemo(shuffledIndexes, []);
  const [activeIndex, setActiveIndex] = useState(initialOrder[0]);
  const [nextIndex, setNextIndex] = useState(initialOrder[1]);
  const [transitioning, setTransitioning] = useState(false);
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const motionLayerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef(new Map<number, HTMLVideoElement>());
  const visibleRef = useRef(true);
  const transitionTimerRef = useRef<number | undefined>(undefined);
  const orderRef = useRef(initialOrder);
  const cursorRef = useRef(2);

  const getNextIndex = useCallback((current: number, unavailable: Set<number>) => {
    const available = HERO_VARIATIONS
      .map((_, index) => index)
      .filter((index) => index !== current && !unavailable.has(index));
    if (!available.length) return null;

    for (let attempts = 0; attempts < HERO_VARIATIONS.length * 2; attempts += 1) {
      if (cursorRef.current >= orderRef.current.length) {
        const reshuffled = shuffledIndexes();
        if (reshuffled[0] === current && reshuffled.length > 1) {
          [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
        }
        orderRef.current = reshuffled;
        cursorRef.current = 0;
      }
      const candidate = orderRef.current[cursorRef.current];
      cursorRef.current += 1;
      if (candidate !== current && !unavailable.has(candidate)) return candidate;
    }

    return available[0];
  }, []);

  const finishTransition = useCallback(() => {
    setTransitioning(false);
    setActiveIndex(nextIndex);
    const replacement = getNextIndex(nextIndex, failed);
    if (replacement !== null) setNextIndex(replacement);
  }, [failed, getNextIndex, nextIndex]);

  const beginTransition = useCallback(() => {
    if (transitioning || !visibleRef.current) return;
    const upcoming = videoRefs.current.get(nextIndex);
    if (!upcoming || upcoming.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;

    void upcoming.play().then(() => {
      setTransitioning(true);
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = window.setTimeout(finishTransition, CROSSFADE_MS);
    }).catch(() => {
      // The active loop restarts if browser autoplay policy blocks the overlap.
    });
  }, [finishTransition, nextIndex, transitioning]);

  const handleTimeUpdate = (index: number) => {
    if (index !== activeIndex || transitioning) return;
    const video = videoRefs.current.get(index);
    if (video && video.duration - video.currentTime <= CROSSFADE_SECONDS + 0.15) {
      beginTransition();
    }
  };

  const handleEnded = (index: number) => {
    if (index !== activeIndex || transitioning) return;
    const video = videoRefs.current.get(index);
    if (!video) return;
    video.currentTime = 0;
    if (visibleRef.current) void video.play().catch(() => undefined);
  };

  const handleFailure = (index: number) => {
    const updated = new Set(failed).add(index);
    setFailed(updated);
    if (index === nextIndex) {
      const replacement = getNextIndex(activeIndex, updated);
      if (replacement !== null) setNextIndex(replacement);
      return;
    }
    if (index === activeIndex) {
      window.clearTimeout(transitionTimerRef.current);
      setTransitioning(false);
      const replacement = getNextIndex(index, updated);
      if (replacement !== null) {
        setActiveIndex(replacement);
        const following = getNextIndex(replacement, updated);
        if (following !== null) setNextIndex(following);
      }
    }
  };

  useEffect(() => {
    if (reducedMotion || failed.size === HERO_VARIATIONS.length) return;
    const container = containerRef.current;
    const motionLayer = motionLayerRef.current;
    if (!container || !motionLayer) return;

    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      if (isMobile) {
        motionLayer.style.transform = 'translate3d(0, 0, 0)';
        return;
      }
      const scrollInsideHero = Math.max(0, -container.getBoundingClientRect().top);
      motionLayer.style.transform = `translate3d(0, ${scrollInsideHero * 0.4}px, 0)`;
    };
    const requestParallaxUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };
    const syncPlayback = () => {
      videoRefs.current.forEach((video, index) => {
        if (visibleRef.current && index === activeIndex) {
          void video.play().catch(() => undefined);
        } else if (!(transitioning && index === nextIndex)) {
          video.pause();
        }
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.01 });

    observer.observe(container);
    if (!isMobile) window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    updateParallax();
    syncPlayback();

    return () => {
      observer.disconnect();
      if (!isMobile) window.removeEventListener('scroll', requestParallaxUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [activeIndex, failed.size, isMobile, nextIndex, reducedMotion, transitioning]);

  useEffect(() => () => window.clearTimeout(transitionTimerRef.current), []);

  const noPlayableMedia = failed.size === HERO_VARIATIONS.length;
  const activeVariation = HERO_VARIATIONS[activeIndex];

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden bg-background', className)}
      aria-hidden="true"
    >
      <WatchPoster className="absolute inset-0 h-full w-full" />

      {reducedMotion && !failed.has(0) ? (
        <img
          src={HERO_VARIATIONS[0].poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      ) : !noPlayableMedia ? (
        <div
          ref={motionLayerRef}
          className="absolute -inset-x-[4%] -top-[15%] h-[130%] w-[108%] will-change-transform"
        >
          {[activeIndex, nextIndex].map((index) => {
            const variation = HERO_VARIATIONS[index];
            const isActive = index === activeIndex;
            const isIncoming = index === nextIndex;
            return (
              <video
                key={variation.id}
                ref={(node) => {
                  if (node) videoRefs.current.set(index, node);
                  else videoRefs.current.delete(index);
                }}
                className={cn(
                  'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out',
                  isActive && !transitioning ? 'opacity-100' : 'opacity-0',
                  isIncoming && transitioning && 'opacity-100',
                )}
                autoPlay={isActive}
                muted
                playsInline
                preload="auto"
                poster={variation.poster}
                onTimeUpdate={() => handleTimeUpdate(index)}
                onEnded={() => handleEnded(index)}
                onError={() => handleFailure(index)}
              >
                <source src={variation.webm} type="video/webm" />
                <source src={variation.mp4} type="video/mp4" />
              </video>
            );
          })}
          <img
            src={activeVariation.poster}
            alt=""
            className="-z-10 absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
    </div>
  );
}