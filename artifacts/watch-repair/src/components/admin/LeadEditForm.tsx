import { useState, type FormEvent, type ReactNode } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import type { LeadUpdate, RepairLead } from '@workspace/api-client-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Input } from '@workspace/upper-east-horology/components/ui/input';
import { Textarea } from '@workspace/upper-east-horology/components/ui/textarea';
import { Label } from '@workspace/upper-east-horology/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/upper-east-horology/components/ui/select';
import { Alert, AlertDescription } from '@workspace/upper-east-horology/components/ui/alert';
import { CHANNEL_OPTIONS, INTAKE_OPTIONS, SERVICE_OPTIONS, serviceLabel } from '@/lib/admin';

interface Values {
  name: string;
  phone: string;
  email: string;
  preferredChannel: string;
  serviceNeeded: string;
  watchBrand: string;
  description: string;
  intakeMode: string;
  adminOwner: string;
  adminSummary: string;
}

const NO_SERVICE = '__none__';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toValues(lead: RepairLead): Values {
  return {
    name: lead.name ?? '',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    preferredChannel: lead.preferredChannel ?? 'none',
    serviceNeeded: lead.serviceNeeded ?? '',
    watchBrand: lead.watchBrand ?? '',
    description: lead.description ?? '',
    intakeMode: lead.intakeMode ?? 'unsure',
    adminOwner: lead.adminOwner ?? '',
    adminSummary: lead.adminSummary ?? '',
  };
}

function validate(values: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};
  const phone = values.phone.trim();
  const email = values.email.trim();
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.description.trim()) errors.description = 'Describe the repair.';
  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  if (phone && phone.replace(/\D/g, '').length < 5) errors.phone = 'Enter a full phone number.';
  if (!phone && !email) errors.phone = 'Keep at least a phone number or an email address.';
  if (values.preferredChannel === 'email' && !email) errors.preferredChannel = 'Email follow-up needs an email address.';
  if ((values.preferredChannel === 'phone' || values.preferredChannel === 'sms') && !phone) {
    errors.preferredChannel = 'Phone or text follow-up needs a phone number.';
  }
  return errors;
}

/** Only send fields that changed. */
function diff(lead: RepairLead, values: Values): LeadUpdate {
  const original = toValues(lead);
  const patch: Record<string, unknown> = {};
  const nullable = new Set(['phone', 'email', 'serviceNeeded', 'watchBrand', 'adminOwner', 'adminSummary']);
  for (const key of Object.keys(values) as (keyof Values)[]) {
    const next = values[key].trim();
    if (next === original[key].trim()) continue;
    patch[key] = nullable.has(key) && !next ? null : next;
  }
  return patch as LeadUpdate;
}

export function LeadEditForm({
  lead,
  saving,
  serverError,
  onSave,
  onCancel,
}: {
  lead: RepairLead;
  saving: boolean;
  serverError: string;
  onSave: (patch: LeadUpdate) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Values>(() => toValues(lead));
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [unchanged, setUnchanged] = useState(false);

  const set = (key: keyof Values) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setUnchanged(false);
  };

  const legacyService = values.serviceNeeded && !SERVICE_OPTIONS.some((option) => option.value === values.serviceNeeded);

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const patch = diff(lead, values);
    if (!Object.keys(patch).length) {
      setUnchanged(true);
      return;
    }
    onSave(patch);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="form-edit-lead">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription role="alert">{serverError}</AlertDescription>
        </Alert>
      )}
      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="font-semibold mb-3">Customer</legend>
        <Field id="edit-name" label="Name" error={errors.name}>
          <Input id="edit-name" value={values.name} onChange={(e) => set('name')(e.target.value)} maxLength={160} aria-invalid={!!errors.name} data-testid="input-edit-name" />
        </Field>
        <Field id="edit-phone" label="Phone" error={errors.phone}>
          <Input id="edit-phone" type="tel" value={values.phone} onChange={(e) => set('phone')(e.target.value)} maxLength={40} aria-invalid={!!errors.phone} data-testid="input-edit-phone" />
        </Field>
        <Field id="edit-email" label="Email" error={errors.email}>
          <Input id="edit-email" type="email" value={values.email} onChange={(e) => set('email')(e.target.value)} maxLength={320} aria-invalid={!!errors.email} data-testid="input-edit-email" />
        </Field>
        <Field id="edit-channel" label="Preferred contact" error={errors.preferredChannel}>
          <Select value={values.preferredChannel} onValueChange={set('preferredChannel')}>
            <SelectTrigger id="edit-channel" aria-invalid={!!errors.preferredChannel} data-testid="select-edit-channel"><SelectValue /></SelectTrigger>
            <SelectContent>{CHANNEL_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </fieldset>

      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="font-semibold mb-3">Repair</legend>
        <Field id="edit-service" label="Service needed">
          <Select value={values.serviceNeeded || NO_SERVICE} onValueChange={(value) => set('serviceNeeded')(value === NO_SERVICE ? '' : value)}>
            <SelectTrigger id="edit-service" data-testid="select-edit-service"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SERVICE}>Not provided</SelectItem>
              {legacyService && <SelectItem value={values.serviceNeeded}>{serviceLabel(values.serviceNeeded)} (older option)</SelectItem>}
              {SERVICE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field id="edit-brand" label="Watch brand">
          <Input id="edit-brand" value={values.watchBrand} onChange={(e) => set('watchBrand')(e.target.value)} maxLength={120} data-testid="input-edit-brand" />
        </Field>
        <Field id="edit-intake" label="Intake type">
          <Select value={values.intakeMode} onValueChange={set('intakeMode')}>
            <SelectTrigger id="edit-intake" data-testid="select-edit-intake"><SelectValue /></SelectTrigger>
            <SelectContent>{INTAKE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field id="edit-owner" label="Assigned to">
          <Input id="edit-owner" value={values.adminOwner} onChange={(e) => set('adminOwner')(e.target.value)} maxLength={160} placeholder="Staff name" data-testid="input-edit-owner" />
        </Field>
        <Field id="edit-description" label="Customer description" error={errors.description} wide>
          <Textarea id="edit-description" rows={5} value={values.description} onChange={(e) => set('description')(e.target.value)} maxLength={5000} aria-invalid={!!errors.description} data-testid="input-edit-description" />
        </Field>
        <Field id="edit-summary" label="Internal summary" wide>
          <Textarea id="edit-summary" rows={3} value={values.adminSummary} onChange={(e) => set('adminSummary')(e.target.value)} maxLength={5000} placeholder="Diagnosis, estimate, next step…" data-testid="input-edit-summary" />
        </Field>
      </fieldset>

      {unchanged && <p className="text-sm text-muted-foreground" role="status">No changes to save.</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving} data-testid="button-save-lead">
          {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
          Save changes
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving} data-testid="button-cancel-edit">
          <X className="h-4 w-4 mr-1.5" /> Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({ id, label, error, wide, children }: { id: string; label: string; error?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? 'sm:col-span-2 space-y-2' : 'space-y-2'}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
