import { cn } from '@workspace/upper-east-horology/lib/utils';

interface WatchPosterProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Static SVG horology illustration — abstract watch movement / gear motif.
 * Used as the hero poster where no licensed video/photo is available.
 */
export function WatchPoster({ className, children }: WatchPosterProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Abstract SVG: overlapping gears and watch hands on dark field */}
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background */}
        <rect width="800" height="600" fill="hsl(214 64.9% 11.2%)" />

        {/* Subtle gradient overlay */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="45%" r="55%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(174 72.2% 56.3%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(214 64.9% 11.2%)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow2" cx="30%" cy="60%" r="40%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(175 68.8% 39%)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="hsl(214 64.9% 11.2%)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="600" fill="url(#glow)" />
        <rect width="800" height="600" fill="url(#glow2)" />

        {/* Large background gear — right */}
        <g transform="translate(620, 300)" opacity="0.06">
          <circle cx="0" cy="0" r="210" stroke="hsl(216 15.5% 81%)" strokeWidth="1" fill="none" />
          <circle cx="0" cy="0" r="195" stroke="hsl(216 15.5% 81%)" strokeWidth="0.5" fill="none" />
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const r1 = 195;
            const r2 = 215;
            return (
              <line
                key={i}
                x1={Math.cos(angle) * r1}
                y1={Math.sin(angle) * r1}
                x2={Math.cos(angle) * r2}
                y2={Math.sin(angle) * r2}
                stroke="hsl(216 15.5% 81%)"
                strokeWidth="6"
                strokeLinecap="square"
              />
            );
          })}
          <circle cx="0" cy="0" r="80" stroke="hsl(216 15.5% 81%)" strokeWidth="0.5" fill="none" />
          <circle cx="0" cy="0" r="4" fill="hsl(216 15.5% 81%)" />
        </g>

        {/* Medium gear — left */}
        <g transform="translate(160, 420)" opacity="0.08">
          <circle cx="0" cy="0" r="130" stroke="hsl(216 15.5% 81%)" strokeWidth="1" fill="none" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const r1 = 130;
            const r2 = 145;
            return (
              <line
                key={i}
                x1={Math.cos(angle) * r1}
                y1={Math.sin(angle) * r1}
                x2={Math.cos(angle) * r2}
                y2={Math.sin(angle) * r2}
                stroke="hsl(216 15.5% 81%)"
                strokeWidth="5"
                strokeLinecap="square"
              />
            );
          })}
          <circle cx="0" cy="0" r="50" stroke="hsl(216 15.5% 81%)" strokeWidth="0.5" fill="none" />
          <circle cx="0" cy="0" r="3" fill="hsl(216 15.5% 81%)" />
        </g>

        {/* Main watch face — center */}
        <g transform="translate(400, 280)">
          {/* Outer ring */}
          <circle cx="0" cy="0" r="160" stroke="hsl(175 68.8% 39%)" strokeWidth="1" fill="none" opacity="0.3" />
          <circle cx="0" cy="0" r="152" stroke="hsl(216 15.5% 81%)" strokeWidth="0.5" fill="none" opacity="0.2" />
          <circle cx="0" cy="0" r="140" stroke="hsl(216 15.5% 81%)" strokeWidth="0.5" fill="none" opacity="0.15" />

          {/* Hour markers */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180 - Math.PI / 2;
            const r1 = 128;
            const r2 = i % 3 === 0 ? 140 : 134;
            return (
              <line
                key={i}
                x1={Math.cos(angle) * r1}
                y1={Math.sin(angle) * r1}
                x2={Math.cos(angle) * r2}
                y2={Math.sin(angle) * r2}
                stroke="hsl(216 15.5% 81%)"
                strokeWidth={i % 3 === 0 ? 2 : 1}
                strokeLinecap="round"
                opacity="0.5"
              />
            );
          })}

          {/* Minute markers */}
          {Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 === 0) return null;
            const angle = (i * 6 * Math.PI) / 180 - Math.PI / 2;
            return (
              <line
                key={i}
                x1={Math.cos(angle) * 131}
                y1={Math.sin(angle) * 131}
                x2={Math.cos(angle) * 136}
                y2={Math.sin(angle) * 136}
                stroke="hsl(216 15.5% 81%)"
                strokeWidth="0.5"
                strokeLinecap="round"
                opacity="0.2"
              />
            );
          })}

          {/* Hour hand — 10 o'clock */}
          <line
            x1="0" y1="0"
            x2={Math.cos(-Math.PI / 2 + (-60 * Math.PI) / 180) * 80}
            y2={Math.sin(-Math.PI / 2 + (-60 * Math.PI) / 180) * 80}
            stroke="hsl(216 15.5% 81%)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Minute hand — 2 o'clock */}
          <line
            x1="0" y1="0"
            x2={Math.cos(-Math.PI / 2 + (60 * Math.PI) / 180) * 110}
            y2={Math.sin(-Math.PI / 2 + (60 * Math.PI) / 180) * 110}
            stroke="hsl(216 15.5% 81%)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Seconds hand */}
          <line
            x1={Math.cos(-Math.PI / 2 + Math.PI) * 25}
            y1={Math.sin(-Math.PI / 2 + Math.PI) * 25}
            x2={Math.cos(-Math.PI / 2) * 125}
            y2={Math.sin(-Math.PI / 2) * 125}
            stroke="hsl(174 72.2% 56.3%)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Center dot */}
          <circle cx="0" cy="0" r="5" fill="hsl(216 15.5% 81%)" opacity="0.8" />
          <circle cx="0" cy="0" r="2" fill="hsl(174 72.2% 56.3%)" opacity="0.9" />
        </g>

        {/* Small oscillation wheels */}
        <g transform="translate(290, 120)" opacity="0.12">
          <circle cx="0" cy="0" r="55" stroke="hsl(216 15.5% 81%)" strokeWidth="0.8" fill="none" />
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 22.5 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={Math.cos(angle) * 45}
                y1={Math.sin(angle) * 45}
                x2={Math.cos(angle) * 58}
                y2={Math.sin(angle) * 58}
                stroke="hsl(216 15.5% 81%)"
                strokeWidth="4"
                strokeLinecap="square"
              />
            );
          })}
          <circle cx="0" cy="0" r="2" fill="hsl(216 15.5% 81%)" />
        </g>

        <g transform="translate(520, 130)" opacity="0.1">
          <circle cx="0" cy="0" r="40" stroke="hsl(216 15.5% 81%)" strokeWidth="0.8" fill="none" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={Math.cos(angle) * 33}
                y1={Math.sin(angle) * 33}
                x2={Math.cos(angle) * 44}
                y2={Math.sin(angle) * 44}
                stroke="hsl(216 15.5% 81%)"
                strokeWidth="3.5"
                strokeLinecap="square"
              />
            );
          })}
          <circle cx="0" cy="0" r="2" fill="hsl(216 15.5% 81%)" />
        </g>
      </svg>

      {/* Content overlay */}
      {children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
}
