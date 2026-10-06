import { useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { History, Image, Loader2, Mail, MessageSquarePlus, Pencil, Phone, Watch } from 'lucide-react';
import {
  getGetRepairLeadQueryKey,
  getListCustomersQueryKey,
  getListFollowUpsQueryKey,
  getListRepairLeadsQueryKey,
  useAddRepairLeadNote,
  useUpdateRepairLead,
  type LeadEvent,
  type LeadUpdate,
  type RepairLeadDetail,
} from '@workspace/api-client-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Badge } from '@workspace/upper-east-horology/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/upper-east-horology/components/ui/card';
import { Textarea } from '@workspace/upper-east-horology/components/ui/textarea';
import { Label } from '@workspace/upper-east-horology/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/upper-east-horology/components/ui/select';
import { Separator } from '@workspace/upper-east-horology/components/ui/separator';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { toast } from '@workspace/upper-east-horology/hooks/use-toast';
import { LEAD_STATUSES, apiErrorMessage, channelLabel, formatDate, intakeLabel, pretty, serviceLabel } from '@/lib/admin';
import { LeadEditForm } from './LeadEditForm';

const ATTRIBUTION_FIELDS: [string, string][] = [
  ['selectedCta', 'Started from'],
  ['source', 'Source'],
  ['utmSource', 'UTM source'],
  ['utmMedium', 'UTM medium'],
  ['utmCampaign', 'UTM campaign'],
  ['utmTerm', 'UTM term'],
  ['utmContent', 'UTM content'],
  ['variant', 'Variant'],
  ['landingPage', 'Landing page'],
  ['referrer', 'Referrer'],
];

const FIELD_LABELS: Record<string, string> = {
  name: 'name', email: 'email', phone: 'phone', preferredChannel: 'preferred contact',
  serviceNeeded: 'service', watchBrand: 'watch brand', description: 'description',
  intakeMode: 'intake type', adminOwner: 'assignee', adminSummary: 'internal summary',
};

export function LeadDetail({ detail }: { detail: RepairLeadDetail }) {
  const queryClient = useQueryClient();
  const { lead, attachments, events, followUps } = detail;
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [note, setNote] = useState('');
  const update = useUpdateRepairLead();
  const addNote = useAddRepairLeadNote();
  const record = lead as unknown as Record<string, unknown>;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: getGetRepairLeadQueryKey(lead.id) });
    void queryClient.invalidateQueries({ queryKey: getListRepairLeadsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListFollowUpsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: ['/api/admin/leads/report'] });
  }

  function save(patch: LeadUpdate, successTitle = 'Request updated') {
    setSaveError('');
    update.mutate(
      { id: lead.id, data: patch },
      {
        onSuccess: () => {
          toast({ title: successTitle });
          setEditing(false);
          refresh();
        },
        onError: (error) => {
          const message = apiErrorMessage(error, 'Could not save changes.');
          if (editing) setSaveError(message);
          else toast({ title: message, variant: 'destructive' });
        },
      },
    );
  }

  function submitNote(event: FormEvent) {
    event.preventDefault();
    const text = note.trim();
    if (!text) return;
    addNote.mutate(
      { id: lead.id, data: { note: text } },
      {
        onSuccess: () => {
          setNote('');
          toast({ title: 'Internal note added' });
          refresh();
        },
        onError: (error) => toast({ title: apiErrorMessage(error, 'Could not add note.'), variant: 'destructive' }),
      },
    );
  }

  const notes = events.filter((event) => event.type === 'note' && event.note);
  const history = events.filter((event) => event.type !== 'note');
  const attribution = ATTRIBUTION_FIELDS.filter(([key]) => record[key]);
  const pendingFollowUps = followUps.filter((item) => item.status === 'pending');

  return (
    <Card data-testid={`lead-detail-${lead.id}`}>
      <CardHeader>
        <div className="flex flex-wrap justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="font-serif text-2xl break-words" data-testid="text-lead-name">{lead.name}</CardTitle>
            <CardDescription>
              Request #{lead.id} · {intakeLabel(lead.intakeMode)} · Submitted {formatDate(lead.createdAt)}
            </CardDescription>
          </div>
          <div className="flex items-start gap-2">
            <Badge>{pretty(lead.status)}</Badge>
            {!editing && (
              <Button size="sm" variant="outline" onClick={() => { setSaveError(''); setEditing(true); }} data-testid="button-edit-lead">
                <Pencil className="h-4 w-4 mr-1" /> Edit details
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {editing ? (
          <LeadEditForm
            lead={lead}
            saving={update.isPending}
            serverError={saveError}
            onSave={(patch) => save(patch, 'Changes saved')}
            onCancel={() => { setEditing(false); setSaveError(''); }}
          />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info label="Phone" value={lead.phone ? <a className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-1" href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" />{lead.phone}</a> : null} />
              <Info label="Email" value={lead.email ? <a className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-1 break-all" href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5 shrink-0" />{lead.email}</a> : null} />
              <Info label="Preferred contact" value={channelLabel(lead.preferredChannel)} />
              <Info label="Assigned to" value={lead.adminOwner} />
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Watch & request</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Info label="Watch brand" value={lead.watchBrand} />
                {lead.watchModel && <Info label="Model (older requests)" value={lead.watchModel} />}
                <Info label="Service" value={serviceLabel(lead.serviceNeeded)} />
                <Info label="Intake type" value={intakeLabel(lead.intakeMode)} />
                <Info label="Customer description" value={lead.description} wide />
                <Info label="Internal summary" value={lead.adminSummary} wide />
              </div>
            </div>
          </>
        )}
        <Separator />
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="lead-status">Status</Label>
            <Select value={lead.status} onValueChange={(value) => save({ status: value as LeadUpdate['status'] }, 'Status updated')} disabled={update.isPending}>
              <SelectTrigger id="lead-status" data-testid="select-lead-status"><SelectValue /></SelectTrigger>
              <SelectContent>{LEAD_STATUSES.map((item) => <SelectItem key={item} value={item}>{pretty(item)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className={cn('rounded-md border p-3 flex flex-wrap items-center justify-between gap-3', lead.status === 'watch_received' ? 'border-primary/60 bg-primary/5' : 'border-border')}>
            <p className="text-sm">{lead.status === 'watch_received' ? 'Watch recorded as received' : 'Watch not yet received'}</p>
            <Button size="sm" variant={lead.status === 'watch_received' ? 'outline' : 'default'} disabled={update.isPending} onClick={() => save({ status: lead.status === 'watch_received' ? 'contacted' : 'watch_received' }, 'Status updated')}>
              <Watch className="h-4 w-4 mr-1.5" /> {lead.status === 'watch_received' ? 'Undo' : 'Mark received'}
            </Button>
          </div>
        </div>
        <Separator />
        <div className="grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Contact consent</h3>
            <p className="text-xs text-muted-foreground mb-2">Recorded at submission; not editable.</p>
            <ul className="space-y-1">
              <li>Email: {lead.emailConsent ? 'Yes' : 'No'}</li>
              <li>Phone calls: {lead.phoneConsent ? 'Yes' : 'No'}</li>
              <li>Text messages: {lead.smsConsent ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Attribution</h3>
            {attribution.length === 0 ? <p className="text-muted-foreground">No attribution recorded.</p> : (
              <dl className="space-y-1">
                {attribution.map(([key, label]) => (
                  <div key={key} className="flex gap-2 min-w-0"><dt className="text-muted-foreground shrink-0">{label}:</dt><dd className="truncate" title={String(record[key])}>{String(record[key])}</dd></div>
                ))}
              </dl>
            )}
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold flex items-center"><Image className="h-4 w-4 mr-2 text-primary" /> Private photos</h3>
          {attachments.length === 0 ? <p className="text-sm text-muted-foreground mt-2">No photos attached.</p> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {attachments.map((item, i) => {
                const src = `${import.meta.env.BASE_URL}api/admin/leads/${lead.id}/attachments/${item.id}`;
                return (
                  <a key={item.id} href={src} target="_blank" rel="noreferrer" className="aspect-square rounded-md border border-border overflow-hidden bg-muted">
                    <img src={src} alt={`Customer photo ${i + 1}: ${item.originalName}`} className="w-full h-full object-cover" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold">Internal notes</h3>
          <div className="space-y-2 mt-3">
            {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
            {notes.map((item) => (
              <div key={item.id} className="rounded-md bg-muted/50 border border-border p-3 text-sm" data-testid={`note-${item.id}`}>
                <p className="whitespace-pre-wrap">{item.note}</p>
                <p className="text-xs text-muted-foreground mt-1">Staff · {formatDate(item.createdAt)}</p>
              </div>
            ))}
          </div>
          <form onSubmit={submitNote} className="mt-3 space-y-2">
            <Label htmlFor="lead-note" className="sr-only">New internal note</Label>
            <Textarea id="lead-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a private staff note…" rows={3} maxLength={5000} data-testid="input-lead-note" />
            <Button size="sm" type="submit" disabled={addNote.isPending || !note.trim()} data-testid="button-add-note">
              {addNote.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageSquarePlus className="h-4 w-4 mr-1" />} Add note
            </Button>
          </form>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold flex items-center"><History className="h-4 w-4 mr-2 text-primary" /> History</h3>
          {pendingFollowUps.length > 0 && (
            <p className="text-sm mt-2">Follow-up due {formatDate(pendingFollowUps[0]!.dueAt)} by {channelLabel(pendingFollowUps[0]!.channel).toLowerCase()}.</p>
          )}
          <ol className="mt-3 space-y-2 text-sm border-l border-border pl-4">
            {history.map((event) => (
              <li key={event.id}>
                <p>{describeEvent(event)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

function describeEvent(event: LeadEvent): string {
  if (event.type === 'submitted') return 'Request submitted';
  if (event.type === 'status_changed') return `Status changed from ${pretty(event.fromStatus)} to ${pretty(event.toStatus)}`;
  if (event.type === 'details_edited') {
    const fields = (event.metadata as { fields?: unknown } | null | undefined)?.fields;
    const list = Array.isArray(fields) ? fields.map((field) => FIELD_LABELS[String(field)] ?? String(field)).join(', ') : '';
    return list ? `Details edited: ${list}` : 'Details edited';
  }
  return pretty(event.type);
}

function Info({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 whitespace-pre-wrap break-words">{value || 'Not provided'}</div>
    </div>
  );
}
