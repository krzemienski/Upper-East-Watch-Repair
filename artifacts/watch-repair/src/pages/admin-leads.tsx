import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, RefreshCw, Search, Store, UserRound, Globe } from 'lucide-react';
import {
  getGetRepairLeadQueryKey,
  getGetRepairLeadReportQueryKey,
  getListRepairLeadsQueryKey,
  listRepairLeads,
  useGetRepairLead,
  useGetRepairLeadReport,
  type ListRepairLeadsParams,
  type RepairLead,
} from '@workspace/api-client-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Badge } from '@workspace/upper-east-horology/components/ui/badge';
import { Card, CardContent } from '@workspace/upper-east-horology/components/ui/card';
import { Input } from '@workspace/upper-east-horology/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/upper-east-horology/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/upper-east-horology/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@workspace/upper-east-horology/components/ui/alert';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { AdminShell } from '@/components/admin/AdminShell';
import { LeadDetail } from '@/components/admin/LeadDetail';
import { FunnelSummary } from '@/components/admin/FunnelSummary';
import { FollowUpQueue, usePendingFollowUps } from '@/components/admin/FollowUpQueue';
import { INTAKE_OPTIONS, LEAD_STATUSES, apiErrorMessage, formatDate, intakeLabel, pretty, serviceLabel } from '@/lib/admin';

const PAGE_SIZE = 50;

function readLeadParam(): number | null {
  const value = Number(new URLSearchParams(window.location.search).get('lead'));
  return Number.isInteger(value) && value > 0 ? value : null;
}

export default function AdminLeadsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [intake, setIntake] = useState('all');
  const [tab, setTab] = useState('requests');
  const [selectedId, setSelectedId] = useState<number | null>(readLeadParam);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Keep ?lead= in the address bar so a request can be linked to and survives reloads.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set('lead', String(selectedId));
    else url.searchParams.delete('lead');
    window.history.replaceState(window.history.state, '', url);
  }, [selectedId]);

  const filters: ListRepairLeadsParams = {
    ...(debouncedSearch ? { search: debouncedSearch.slice(0, 200) } : {}),
    ...(status !== 'all' ? { status: status as ListRepairLeadsParams['status'] } : {}),
    ...(intake !== 'all' ? { intakeMode: intake as ListRepairLeadsParams['intakeMode'] } : {}),
  };

  const leads = useInfiniteQuery({
    queryKey: [...getListRepairLeadsQueryKey(), 'paged', filters],
    queryFn: ({ pageParam }) => listRepairLeads({ ...filters, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined),
  });
  const report = useGetRepairLeadReport({ query: { queryKey: getGetRepairLeadReportQueryKey() } });
  const followUps = usePendingFollowUps();
  const detail = useGetRepairLead(selectedId ?? 0, {
    query: { queryKey: getGetRepairLeadQueryKey(selectedId ?? 0), enabled: selectedId !== null, retry: false },
  });

  const rows = useMemo(() => leads.data?.pages.flat() ?? [], [leads.data]);
  const leadNames = useMemo(() => new Map(rows.map((lead) => [lead.id, lead.name])), [rows]);

  function openLead(id: number) {
    setSelectedId(id);
    setTab('requests');
  }

  return (
    <AdminShell
      eyebrow="Shop workspace"
      title="Repair requests"
      description="Online and in-store intake submissions, newest first."
      actions={
        <Button variant="outline" size="sm" onClick={() => { void leads.refetch(); void report.refetch(); void followUps.refetch(); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="requests" data-testid="tab-requests">Requests</TabsTrigger>
          <TabsTrigger value="follow-ups" data-testid="tab-follow-ups">
            Follow-ups <Badge variant="secondary" className="ml-2">{followUps.data?.length ?? 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="funnel" data-testid="tab-funnel">Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-5">
          <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-5">
            <section aria-label="Request list" className={cn(selectedId && 'hidden lg:block')}>
              <div className="relative mb-3">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email, watch…" aria-label="Search requests" data-testid="input-search-leads" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger aria-label="Filter by status" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {LEAD_STATUSES.map((item) => <SelectItem key={item} value={item}>{pretty(item)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={intake} onValueChange={setIntake}>
                  <SelectTrigger aria-label="Filter by intake type" data-testid="select-filter-intake"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Online & in-store</SelectItem>
                    {INTAKE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {leads.isError && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTitle>Requests unavailable</AlertTitle>
                  <AlertDescription>{apiErrorMessage(leads.error, 'Could not load repair requests.')}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-1" data-testid="list-leads">
                {leads.isLoading && <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
                {!leads.isLoading && !leads.isError && rows.length === 0 && (
                  <Card><CardContent className="pt-6 text-sm text-muted-foreground text-center">No requests match these filters.</CardContent></Card>
                )}
                {rows.map((lead) => <LeadRow key={lead.id} lead={lead} active={lead.id === selectedId} onSelect={() => setSelectedId(lead.id)} />)}
                {leads.hasNextPage && (
                  <Button variant="outline" className="w-full" onClick={() => void leads.fetchNextPage()} disabled={leads.isFetchingNextPage}>
                    {leads.isFetchingNextPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Load more
                  </Button>
                )}
              </div>
            </section>

            <section aria-label="Request details" className={cn(!selectedId && 'hidden lg:block')}>
              {selectedId && (
                <Button variant="ghost" size="sm" className="mb-3 lg:hidden" onClick={() => setSelectedId(null)} data-testid="button-back-to-list">
                  <ArrowLeft className="h-4 w-4 mr-1" /> All requests
                </Button>
              )}
              {!selectedId && (
                <Card className="min-h-96 grid place-items-center">
                  <CardContent className="text-center">
                    <UserRound className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="font-semibold">Select a repair request</p>
                    <p className="text-sm text-muted-foreground mt-1">Contact details, watch, photos, notes and history appear here.</p>
                  </CardContent>
                </Card>
              )}
              {selectedId && detail.isLoading && <Card className="min-h-96 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>}
              {selectedId && detail.isError && (
                <Alert variant="destructive">
                  <AlertTitle>Request unavailable</AlertTitle>
                  <AlertDescription>{apiErrorMessage(detail.error, 'This request could not be loaded.')}</AlertDescription>
                </Alert>
              )}
              {selectedId && detail.data && <LeadDetail key={detail.data.lead.id} detail={detail.data} />}
            </section>
          </div>
        </TabsContent>

        <TabsContent value="follow-ups" className="mt-5">
          <FollowUpQueue leadNames={leadNames} onOpenLead={openLead} />
        </TabsContent>

        <TabsContent value="funnel" className="mt-5">
          {report.isError ? <p className="text-sm text-destructive">The funnel report could not be loaded.</p> : <FunnelSummary report={report.data} />}
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function LeadRow({ lead, active, onSelect }: { lead: RepairLead; active: boolean; onSelect: () => void }) {
  const inStore = lead.intakeMode === 'in_store';
  const IntakeIcon = inStore ? Store : Globe;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      data-testid={`lead-row-${lead.id}`}
      className={cn('w-full rounded-md border p-4 text-left bg-card hover-elevate', active ? 'border-primary' : 'border-border')}
    >
      <div className="flex justify-between gap-3">
        <span className="font-semibold truncate">{lead.name}</span>
        <Badge variant={lead.status === 'new' ? 'default' : 'secondary'} className="shrink-0">{pretty(lead.status)}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-1 truncate">
        {[lead.watchBrand, lead.watchModel, lead.serviceNeeded ? serviceLabel(lead.serviceNeeded) : null].filter(Boolean).join(' · ') || 'Watch details pending'}
      </p>
      <div className="flex items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><IntakeIcon className="h-3.5 w-3.5" /> {intakeLabel(lead.intakeMode)}</span>
        <span>{formatDate(lead.createdAt)}</span>
      </div>
    </button>
  );
}
