import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '@workspace/replit-auth-web';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ClipboardList,
  Image,
  Loader2,
  LogIn,
  LogOut,
  MessageSquarePlus,
  MousePointerClick,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  UserRound,
  Watch,
} from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Badge } from '@workspace/upper-east-horology/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/upper-east-horology/components/ui/card';
import { Input } from '@workspace/upper-east-horology/components/ui/input';
import { Textarea } from '@workspace/upper-east-horology/components/ui/textarea';
import { Label } from '@workspace/upper-east-horology/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/upper-east-horology/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/upper-east-horology/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@workspace/upper-east-horology/components/ui/alert';
import { Separator } from '@workspace/upper-east-horology/components/ui/separator';
import { PageMeta } from '@/components/PageMeta';
import { Logo } from '@/components/Logo';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { toast } from '@workspace/upper-east-horology/hooks/use-toast';

type AnyRecord = Record<string, any>;
type Lead = AnyRecord & { id: string | number };

const statuses = ['new', 'contacted', 'visit_planned', 'watch_received', 'estimate_pending', 'won', 'lost'];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function records(value: unknown, keys: string[]): AnyRecord[] {
  if (Array.isArray(value)) return value;
  const object = value as AnyRecord | null;
  for (const key of keys) if (Array.isArray(object?.[key])) return object[key];
  return [];
}

export default function AdminLeadsPage() {
  const { isLoading, isAuthenticated, user, login, logout } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-background grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!isAuthenticated || !user) return <AdminGate title="Repair lead sign in" description="Sign in with an authorized Replit account to access customer repair requests." action={<Button className="w-full" onClick={login}><LogIn className="h-4 w-4 mr-2" /> Log in</Button>} />;
  if (!user.isAdmin) return <AdminGate title="Admin access required" description="This signed-in account is not on the shop admin allowlist." action={<Button className="w-full" variant="outline" onClick={logout}><LogOut className="h-4 w-4 mr-2" /> Log out</Button>} />;

  return <LeadWorkspace userName={user.firstName ?? user.email ?? 'Admin'} onLogout={logout} />;
}

function AdminGate({ title, description, action }: { title: string; description: string; action: ReactNode }) {
  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <PageMeta title={`${title} | Upper East Watch Repair`} description="Restricted shop workspace." />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo className="h-9 w-auto mx-auto mb-4" />
          <div className="h-11 w-11 bg-primary/10 rounded-md mx-auto grid place-items-center"><ShieldAlert className="h-5 w-5 text-primary" /></div>
          <CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{action}</CardContent>
      </Card>
    </div>
  );
}

function LeadWorkspace({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [report, setReport] = useState<AnyRecord>({});
  const [followUps, setFollowUps] = useState<AnyRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      if (status !== 'all') params.set('status', status);
      const [leadData, reportData, followData] = await Promise.all([
        api<unknown>(`/api/admin/leads?${params}`),
        api<AnyRecord>('/api/admin/leads/report'),
        api<unknown>('/api/admin/follow-ups?status=pending'),
      ]);
      const next = records(leadData, ['leads', 'items', 'data']) as Lead[];
      setLeads(next);
      setReport((reportData as AnyRecord)?.report ?? reportData);
      setFollowUps(records(followData, ['followUps', 'items', 'data']));
      if (selectedId && !next.some((lead) => String(lead.id) === String(selectedId))) setSelectedId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load repair leads.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [query, status]);

  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    void api<AnyRecord>(`/api/admin/leads/${selectedId}`)
      .then((data) => setSelected(data.lead ? { ...data.lead, attachments: data.attachments, notes: data.events, followUps: data.followUps } as Lead : data as Lead))
      .catch(() => toast({ title: 'Could not load lead detail', variant: 'destructive' }));
  }, [selectedId, detailVersion]);

  const stats = useMemo(() => [
    ['CTA clicks', metric(report, ['ctaClicks', 'totalCtaClicks'], 0), MousePointerClick],
    ['Submissions', metric(report, ['submissions', 'totalSubmissions', 'total'], leads.length), Send],
    ['Watches received', metric(report, ['watchesReceived', 'received'], report.byStatus?.watch_received ?? 0), Watch],
    ['Won', metric(report, ['won', 'wonLeads'], report.byStatus?.won ?? 0), ClipboardList],
  ] as const, [report, leads, followUps]);

  const breakdowns = useMemo(() => [
    ['Source', firstBreakdown(report, ['bySource', 'sources'])],
    ['Campaign', firstBreakdown(report, ['byCampaign', 'byUtmCampaign', 'campaigns'])],
    ['Variant', firstBreakdown(report, ['byVariant', 'variants'])],
    ['Service', firstBreakdown(report, ['byService', 'byServiceNeeded', 'services'])],
  ] as const, [report]);

  async function patchLead(id: string | number, patch: AnyRecord) {
    try {
      const result = await api<AnyRecord>(`/api/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      const updated = (result.lead ?? result) as Lead;
      setSelected(updated);
      setLeads((current) => current.map((lead) => String(lead.id) === String(id) ? { ...lead, ...updated } : lead));
      toast({ title: 'Lead updated' });
      void load();
    } catch {
      toast({ title: 'Could not update lead', variant: 'destructive' });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta title="Repair Leads | Upper East Watch Repair" description="Protected repair lead workspace." />
      <header className="border-b border-border bg-card">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-primary font-semibold">Shop workspace</p>
            <h1 className="font-serif text-2xl font-semibold">Repair leads</h1>
            <p className="text-xs text-muted-foreground mt-1">Signed in as {userName}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Guide editor</Button></Link>
            <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4 mr-1" /> Log out</Button>
          </div>
        </div>
      </header>
      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 py-7">
        {error && <Alert variant="destructive" className="mb-6"><AlertTitle>Lead data unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-primary font-semibold">Customer acquisition</p>
            <h2 className="font-serif text-2xl font-semibold mt-1">Repair funnel performance</h2>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lead-to-won rate</p>
            <p className="font-serif text-2xl font-semibold">{formatPercent(report.conversionRate)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {stats.map(([label, value, Icon]) => <Card key={label}><CardContent className="pt-5 flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p><p className="font-serif text-3xl font-semibold mt-1">{String(value ?? '—')}</p></div><Icon className="h-5 w-5 text-primary" /></CardContent></Card>)}
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-7">
          {breakdowns.map(([label, values]) => <BreakdownCard key={label} label={label} values={values} />)}
        </div>

        <Tabs defaultValue="leads">
          <TabsList><TabsTrigger value="leads">All leads</TabsTrigger><TabsTrigger value="follow-ups">Follow-ups <Badge variant="secondary" className="ml-2">{followUps.length}</Badge></TabsTrigger></TabsList>
          <TabsContent value="leads" className="mt-5">
            <div className="grid lg:grid-cols-[370px_minmax(0,1fr)] gap-5">
              <section>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1"><Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, watch…" aria-label="Search leads" /></div>
                  <Button variant="outline" size="icon" onClick={load} aria-label="Refresh leads"><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <Select value={status} onValueChange={setStatus}><SelectTrigger className="mb-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((item) => <SelectItem key={item} value={item}>{pretty(item)}</SelectItem>)}</SelectContent></Select>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                  {loading && <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
                  {!loading && leads.length === 0 && <Card><CardContent className="pt-6 text-sm text-muted-foreground text-center">No leads match these filters.</CardContent></Card>}
                  {leads.map((lead) => (
                    <button key={lead.id} onClick={() => setSelectedId(lead.id)} className={cn('w-full rounded-md border p-4 text-left bg-card hover-elevate', String(selectedId) === String(lead.id) ? 'border-primary' : 'border-border')}>
                      <div className="flex justify-between gap-3"><span className="font-semibold truncate">{lead.name ?? lead.customerName ?? 'Unnamed lead'}</span><Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>{pretty(lead.status ?? 'new')}</Badge></div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{[lead.watchBrand, lead.watchModel, lead.serviceNeeded].filter(Boolean).join(' · ') || 'Watch details pending'}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(lead.createdAt)}</p>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                {!selectedId && <Card className="min-h-96 grid place-items-center"><CardContent className="text-center"><UserRound className="h-8 w-8 text-primary mx-auto mb-3" /><p className="font-semibold">Select a repair lead</p><p className="text-sm text-muted-foreground mt-1">Contact, watch, photos, notes, and controls appear here.</p></CardContent></Card>}
                {selectedId && !selected && <Card className="min-h-96 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>}
                {selected && <LeadDetail lead={selected} onPatch={(patch) => patchLead(selected.id, patch)} onReload={() => { setSelected(null); setDetailVersion((value) => value + 1); }} />}
              </section>
            </div>
          </TabsContent>
          <TabsContent value="follow-ups" className="mt-5"><FollowUpQueue items={followUps} onRefresh={load} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function LeadDetail({ lead, onPatch, onReload }: { lead: Lead; onPatch: (patch: AnyRecord) => void; onReload: () => void }) {
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const attachments = records(lead.attachments, ['attachments', 'items']);
  const notes = records(lead.notes, ['notes', 'items']).filter((item) => item.note || item.body || item.text);

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await api(`/api/admin/leads/${lead.id}/notes`, { method: 'POST', body: JSON.stringify({ body: note.trim(), note: note.trim() }) });
      setNote('');
      toast({ title: 'Internal note added' });
      onReload();
    } catch {
      toast({ title: 'Could not add note', variant: 'destructive' });
    } finally { setSavingNote(false); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between gap-3">
          <div><CardTitle className="font-serif text-2xl">{lead.name ?? lead.customerName ?? 'Unnamed lead'}</CardTitle><CardDescription>Reference {lead.reference ?? lead.referenceNumber ?? lead.publicId ?? lead.id}</CardDescription></div>
          <Badge>{pretty(lead.status ?? 'new')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <Info label="Phone" value={lead.phone} />
          <Info label="Email" value={lead.email} />
          <Info label="Preferred contact" value={pretty(lead.preferredChannel)} />
          <Info label="Consent" value={lead.emailConsent || lead.phoneConsent || lead.smsConsent ? 'Recorded' : 'Not recorded'} />
        </div>
        <Separator />
        <div><h3 className="font-semibold mb-3">Watch & request</h3><div className="grid sm:grid-cols-2 gap-4 text-sm">
          <Info label="Watch" value={[lead.watchBrand, lead.watchModel].filter(Boolean).join(' ') || 'Not provided'} />
          <Info label="Reference / movement" value={[lead.referenceNumber ?? lead.watchReference, lead.movement].filter(Boolean).join(' · ')} />
          <Info label="Service" value={pretty(lead.serviceNeeded)} />
          <Info label="Intake mode" value={pretty(lead.intakeMode)} />
          <Info label="Customer description" value={lead.description} wide />
        </div></div>
        <Separator />
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Status</Label><Select value={lead.status ?? 'new'} onValueChange={(value) => onPatch({ status: value })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{pretty(item)}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Assigned to</Label><Input className="mt-2" defaultValue={lead.adminOwner ?? ''} placeholder="Staff name" onBlur={(event) => { if (event.target.value !== (lead.adminOwner ?? '')) onPatch({ adminOwner: event.target.value || null }); }} /></div>
        </div>
        <div className={cn('rounded-md border p-4 flex flex-wrap items-center justify-between gap-4', lead.status === 'watch_received' ? 'border-primary/60 bg-primary/5' : 'border-border')}>
          <div><p className="font-semibold">Watch possession</p><p className="text-sm text-muted-foreground">{lead.status === 'watch_received' ? 'Explicitly recorded as received' : 'Not recorded as received'}</p></div>
          <Button variant={lead.status === 'watch_received' ? 'outline' : 'default'} onClick={() => onPatch({ status: lead.status === 'watch_received' ? 'contacted' : 'watch_received' })}>
            <Watch className="h-4 w-4 mr-2" /> {lead.status === 'watch_received' ? 'Undo received' : 'Mark watch received'}
          </Button>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold flex items-center"><Image className="h-4 w-4 mr-2 text-primary" /> Private photos</h3>
          {attachments.length === 0 ? <p className="text-sm text-muted-foreground mt-2">No photos attached.</p> : <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">{attachments.map((item, i) => { const src = `/api/admin/leads/${lead.id}/attachments/${item.id}`; return <a key={item.id ?? i} href={src} target="_blank" rel="noreferrer" className="aspect-square rounded-md border border-border overflow-hidden bg-muted"><img src={src} alt={`Private watch attachment ${i + 1}`} className="w-full h-full object-cover" /></a>; })}</div>}
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold">Internal notes</h3>
          <div className="space-y-2 mt-3">{notes.map((item, i) => <div key={item.id ?? i} className="rounded-md bg-muted/50 border border-border p-3 text-sm"><p>{item.body ?? item.note ?? item.text}</p><p className="text-xs text-muted-foreground mt-1">{item.authorName ?? item.author ?? 'Staff'} · {formatDate(item.createdAt)}</p></div>)}</div>
          <form onSubmit={addNote} className="mt-3 space-y-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a private staff note…" rows={3} /><Button size="sm" type="submit" disabled={savingNote || !note.trim()}><MessageSquarePlus className="h-4 w-4 mr-1" /> Add note</Button></form>
        </div>
      </CardContent>
    </Card>
  );
}

function FollowUpQueue({ items, onRefresh }: { items: AnyRecord[]; onRefresh: () => void }) {
  async function update(item: AnyRecord, patch: AnyRecord) {
    try {
      await api(`/api/admin/follow-ups/${item.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      toast({ title: patch.status === 'completed' ? 'Follow-up completed' : 'Follow-up rescheduled' });
      onRefresh();
    } catch { toast({ title: 'Could not update follow-up', variant: 'destructive' }); }
  }
  if (!items.length) return <Card><CardContent className="py-12 text-center"><Check className="h-8 w-8 text-primary mx-auto mb-3" /><p className="font-semibold">Follow-up queue is clear</p></CardContent></Card>;
  return <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{items.map((item) => <Card key={item.id}><CardHeader><div className="flex justify-between gap-2"><CardTitle className="text-base">{item.lead?.name ?? item.leadName ?? `Lead #${item.leadId}`}</CardTitle><Badge variant="secondary">{formatDate(item.dueAt)}</Badge></div><CardDescription>{item.reason ?? item.note ?? `${pretty(item.channel)} follow-up`}</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button size="sm" onClick={() => update(item, { status: 'completed' })}><Check className="h-4 w-4 mr-1" /> Complete</Button><Button size="sm" variant="outline" onClick={() => { const date = new Date(); date.setDate(date.getDate() + 1); update(item, { status: 'pending', dueAt: date.toISOString() }); }}><CalendarClock className="h-4 w-4 mr-1" /> Tomorrow</Button></CardContent></Card>)}</div>;
}

function Info({ label, value, wide }: { label: string; value: unknown; wide?: boolean }) {
  return <div className={wide ? 'sm:col-span-2' : ''}><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 whitespace-pre-wrap">{String(value || 'Not provided')}</p></div>;
}

function BreakdownCard({ label, values }: { label: string; values: Record<string, number> }) {
  const entries = Object.entries(values)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 6);
  const max = Math.max(1, ...entries.map(([, value]) => Number(value)));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uppercase tracking-wide">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attributed data yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-muted-foreground">{pretty(key || 'unknown')}</span>
                  <span className="font-semibold tabular-nums">{Number(value).toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (Number(value) / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function metric(report: AnyRecord, keys: string[], fallback: number) {
  for (const source of [report, report.metrics, report.funnel]) {
    for (const key of keys) {
      const value = source?.[key];
      if (typeof value === 'number') return value;
    }
  }
  return fallback;
}

function firstBreakdown(report: AnyRecord, keys: string[]): Record<string, number> {
  for (const source of [report, report.breakdowns, report.acquisition]) {
    for (const key of keys) {
      const value = source?.[key];
      if (value && !Array.isArray(value) && typeof value === 'object') {
        return value as Record<string, number>;
      }
      if (Array.isArray(value)) {
        return Object.fromEntries(value.map((item) => [
          String(item.key ?? item.name ?? item.label ?? 'unknown'),
          Number(item.value ?? item.count ?? 0),
        ]));
      }
    }
  }
  return {};
}

function formatPercent(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(1)}%` : '—';
}

function pretty(value: unknown) { return String(value || '—').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
function formatDate(value: unknown) { if (!value) return 'Date unavailable'; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }