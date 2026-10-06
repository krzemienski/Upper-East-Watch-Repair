import { ClipboardList, MousePointerClick, Send, Watch } from 'lucide-react';
import type { LeadReport } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/upper-east-horology/components/ui/card';
import { pretty } from '@/lib/admin';

/** Compact acquisition funnel: clicks → submissions → watches received → won. */
export function FunnelSummary({ report }: { report: LeadReport | undefined }) {
  const metrics = report?.metrics;
  const stats = [
    ['CTA clicks', metrics?.ctaClicks, MousePointerClick],
    ['Calls', metrics?.callClicks, MousePointerClick],
    ['Directions', metrics?.directionsClicks, MousePointerClick],
    ['Submissions', metrics?.intakeSubmissions ?? report?.total, Send],
    ['Watches received', metrics?.watchesReceived, Watch],
    ['Won', metrics?.wonRepairs, ClipboardList],
  ] as const;
  const breakdowns = [
    ['Source', report?.bySource],
    ['Campaign', report?.byCampaign],
    ['Variant', report?.byVariant],
    ['Service', report?.byServiceNeeded],
  ] as const;

  return (
    <section aria-labelledby="funnel-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="funnel-heading" className="font-serif text-xl font-semibold">Repair funnel</h2>
        <p className="text-sm text-muted-foreground">
          Request-to-won rate <span className="font-semibold text-foreground">{formatPercent(report?.conversionRate)}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map(([label, value, Icon]) => (
          <Card key={label}>
            <CardContent className="pt-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="font-serif text-2xl sm:text-3xl font-semibold mt-1 tabular-nums">{value ?? '—'}</p>
              </div>
              <Icon className="h-5 w-5 text-primary shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {breakdowns.map(([label, values]) => <BreakdownCard key={label} label={label} values={values ?? {}} />)}
      </div>
    </section>
  );
}

function BreakdownCard({ label, values }: { label: string; values: Record<string, number> }) {
  const entries = Object.entries(values)
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wide">{label}</CardTitle></CardHeader>
      <CardContent>
        {entries.length === 0 ? <p className="text-sm text-muted-foreground">No attributed data yet.</p> : (
          <div className="space-y-3">
            {entries.map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-muted-foreground">{pretty(key || 'unknown')}</span>
                  <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatPercent(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(1)}%` : '—';
}
