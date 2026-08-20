import { cn } from '@workspace/upper-east-horology/lib/utils';

const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';

interface AdSlotProps {
  slot: string;
  className?: string;
}

/**
 * Advertising placeholder controlled by VITE_ADS_ENABLED.
 * When ads are disabled the slot renders nothing so article layout stays clean.
 */
export function AdSlot({ slot, className }: AdSlotProps) {
  if (!ADS_ENABLED) return null;

  return (
    <div
      className={cn(
        'my-8 rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-center',
        className
      )}
      data-testid={`ad-slot-${slot}`}
      aria-label="Advertisement"
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        Advertisement
      </p>
      {/* TODO(ads): wire ad network unit for slot "{slot}" when provider is configured */}
    </div>
  );
}
