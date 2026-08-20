// TODO(brand): replace interim SVG when client logo is provided

interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  /** Controls the fill color for the text. Defaults to currentColor. */
  color?: string;
}

export function Logo({ className, variant = 'full', color = 'currentColor' }: LogoProps) {
  if (variant === 'mark') {
    // Watch face mark with hands at 10:10
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Upper East Watch Repair"
        role="img"
      >
        <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="20" r="1.5" fill={color} />
        {/* Hour hand at 10 o'clock */}
        <line x1="20" y1="20" x2="11.7" y2="9.3" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* Minute hand at 2 o'clock */}
        <line x1="20" y1="20" x2="28.3" y2="9.3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        {/* Hour markers */}
        <line x1="20" y1="3" x2="20" y2="5.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="20" y1="34.5" x2="20" y2="37" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="3" y1="20" x2="5.5" y2="20" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="34.5" y1="20" x2="37" y2="20" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 220 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Upper East Watch Repair"
      role="img"
    >
      {/* Watch face mark */}
      <circle cx="28" cy="28" r="24" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="28" cy="28" r="2" fill={color} />
      {/* Hour hand at 10 */}
      <line x1="28" y1="28" x2="17.4" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Minute hand at 2 */}
      <line x1="28" y1="28" x2="38.6" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Hour markers */}
      <line x1="28" y1="5" x2="28" y2="8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="47.5" x2="28" y2="51" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="28" x2="8.5" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="47.5" y1="28" x2="51" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />

      {/* Wordmark */}
      {/* UPPER EAST — tracking wide, small caps feel */}
      <text
        x="62"
        y="23"
        fill={color}
        fontFamily="Space Grotesk, sans-serif"
        fontSize="13"
        fontWeight="600"
        letterSpacing="4"
      >
        UPPER EAST
      </text>
      {/* Thin rule */}
      <line x1="62" y1="30" x2="218" y2="30" stroke={color} strokeWidth="0.5" opacity="0.5" />
      {/* WATCH REPAIR — lighter weight */}
      <text
        x="62"
        y="45"
        fill={color}
        fontFamily="Space Grotesk, sans-serif"
        fontSize="11"
        fontWeight="400"
        letterSpacing="5.5"
      >
        WATCH REPAIR
      </text>
    </svg>
  );
}
