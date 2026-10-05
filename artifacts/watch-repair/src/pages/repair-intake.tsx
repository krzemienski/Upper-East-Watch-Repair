import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, LockKeyhole, Store, X } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/upper-east-horology/components/ui/card';
import { Input } from '@workspace/upper-east-horology/components/ui/input';
import { Textarea } from '@workspace/upper-east-horology/components/ui/textarea';
import { Label } from '@workspace/upper-east-horology/components/ui/label';
import { Checkbox } from '@workspace/upper-east-horology/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/upper-east-horology/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@workspace/upper-east-horology/components/ui/alert';
import { PageMeta } from '@/components/PageMeta';
import { getAttribution, trackFunnelEvent } from '@/lib/repair-funnel';

type IntakeState = {
  name: string;
  phone: string;
  email: string;
  preferredContact: string;
  serviceCategory: string;
  brand: string;
  model: string;
  reference: string;
  movement: string;
  symptoms: string;
  urgency: string;
  estimatedValue: string;
  insuranceNotes: string;
  appointmentRef: string;
  notes: string;
};

type SelectedImage = {
  file: File;
  clientUploadId: string;
};

type ConfirmationState = {
  reference: string;
  leadId: string | number;
  uploadToken?: string;
  files: SelectedImage[];
  photoStatus: 'not_needed' | 'uploading' | 'warning' | 'complete';
  photoError?: string;
};

const initial: IntakeState = {
  name: '', phone: '', email: '', preferredContact: '', serviceCategory: '',
  brand: '', model: '', reference: '', movement: '', symptoms: '', urgency: 'flexible',
  estimatedValue: '', insuranceNotes: '', appointmentRef: '', notes: '',
};

function parseReference(lead: Record<string, unknown>) {
  return String(lead.reference ?? lead.referenceNumber ?? lead.publicId ?? lead.id ?? '');
}

export default function RepairIntakePage({ inStore = false }: { inStore?: boolean }) {
  const [, navigate] = useLocation();
  const [values, setValues] = useState(initial);
  const [consent, setConsent] = useState(false);
  const [files, setFiles] = useState<SelectedImage[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [photosUploading, setPhotosUploading] = useState(false);

  useEffect(() => {
    trackFunnelEvent(inStore ? 'in_store_intake_started' : 'repair_intake_started');
    if (new URLSearchParams(window.location.search).get('contact') === 'phone') {
      setValues((current) => ({ ...current, preferredContact: 'phone' }));
    }
  }, [inStore]);

  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const canSubmit = useMemo(
    () => values.name.trim() && (values.phone.trim() || values.email.trim()) &&
      values.preferredContact && (values.preferredContact !== 'email' || values.email.trim()) &&
      (!['phone', 'sms'].includes(values.preferredContact) || values.phone.trim()) &&
      values.serviceCategory && values.symptoms.trim() && consent,
    [values, consent],
  );

  function set(name: keyof IntakeState, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const invalid = incoming.find((file) => !allowed.includes(file.type) || file.size > 8 * 1024 * 1024);
    if (invalid) {
      setError('Each photo must be a JPG, PNG, or WebP file no larger than 8 MB.');
      event.target.value = '';
      return;
    }
    setError('');
    const next = [...files, ...incoming.map((file) => ({ file, clientUploadId: crypto.randomUUID() }))].slice(0, 5);
    previews.forEach(URL.revokeObjectURL);
    setFiles(next);
    setPreviews(next.map(({ file }) => URL.createObjectURL(file)));
    event.target.value = '';
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setPreviews(next.map(({ file }) => URL.createObjectURL(file)));
  }

  async function uploadImages(created: ConfirmationState) {
    if (photosUploading) return;
    if (!created.uploadToken) {
      setConfirmation((current) => current ? {
        ...current,
        photoStatus: 'warning',
        photoError: 'Your repair request was saved, but photos could not be uploaded. Please try again later.',
      } : current);
      return;
    }
    setPhotosUploading(true);
    setConfirmation((current) => current ? { ...current, photoStatus: 'uploading', photoError: undefined } : current);
    try {
      for (const { file, clientUploadId } of created.files) {
      const request = await fetch(`/api/leads/${created.leadId}/uploads/request-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Lead-Upload-Token': created.uploadToken },
        body: JSON.stringify({ name: file.name, contentType: file.type, size: file.size, clientUploadId }),
      });
      if (!request.ok) throw new Error('Your request was saved, but a photo could not be uploaded.');
      const upload = await request.json() as Record<string, unknown>;
      const rawUrl = upload.uploadURL ?? upload.uploadUrl ?? upload.presignedUrl ?? upload.url;
      if (!rawUrl) throw new Error('Your request was saved, but the photo upload URL was missing.');
      const url = String(rawUrl);
      const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) throw new Error('Your request was saved, but a photo could not be uploaded.');
      const attachment = await fetch(`/api/leads/${created.leadId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Lead-Upload-Token': created.uploadToken },
        body: JSON.stringify({
          name: file.name,
          contentType: file.type,
          size: file.size,
           clientUploadId,
          objectPath: upload.objectPath ?? upload.key ?? upload.objectKey,
        }),
      });
      if (!attachment.ok) throw new Error('Your request was saved, but a photo could not be attached.');
      }
      setConfirmation((current) => current ? { ...current, photoStatus: 'complete', photoError: undefined } : current);
      trackFunnelEvent('repair_photos_attached', { inStore, imageCount: created.files.length });
    } catch {
      trackFunnelEvent('repair_photos_failed', { inStore, imageCount: created.files.length });
      setConfirmation((current) => current ? {
        ...current,
        photoStatus: 'warning',
        photoError: 'Your repair request was saved, but one or more photos could not be attached. You can retry the photos without resubmitting your request.',
      } : current);
    } finally {
      setPhotosUploading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!canSubmit) {
      setError('Complete the required fields, provide phone or email, and confirm contact consent.');
      return;
    }
    setSubmitting(true);
    try {
      const attribution = getAttribution();
      const description = [
        values.symptoms,
        values.reference && `Watch reference: ${values.reference}`,
        values.movement && `Movement: ${values.movement}`,
        values.urgency && `Urgency: ${values.urgency}`,
        values.estimatedValue && `Estimated value: $${values.estimatedValue}`,
        values.insuranceNotes && `Insurance/appraisal: ${values.insuranceNotes}`,
        values.appointmentRef && `Appointment reference: ${values.appointmentRef}`,
        values.notes && `Additional notes: ${values.notes}`,
      ].filter(Boolean).join('\n');
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          ...(values.phone ? { phone: values.phone } : {}),
          ...(values.email ? { email: values.email } : {}),
          preferredChannel: values.preferredContact,
          emailConsent: values.preferredContact === 'email',
          phoneConsent: values.preferredContact === 'phone',
          smsConsent: values.preferredContact === 'sms',
          serviceNeeded: values.serviceCategory,
          watchBrand: values.brand || undefined,
          watchModel: values.model || undefined,
          description,
          intakeMode: inStore ? 'in_store' : 'unsure',
          ...attribution,
        }),
      });
      if (!response.ok) throw new Error('We could not submit your request. Please check the form and try again.');
      const result = await response.json() as { lead: Record<string, unknown>; uploadToken?: string };
      const reference = parseReference(result.lead);
       const created: ConfirmationState = {
         reference,
         leadId: result.lead.id as string | number,
         uploadToken: result.uploadToken,
         files,
         photoStatus: files.length ? 'uploading' : 'not_needed',
       };
       setConfirmation(created);
       trackFunnelEvent('repair_intake_submitted', { leadId: created.leadId, inStore, imageCount: files.length });
      window.scrollTo({ top: 0, behavior: 'smooth' });
       if (files.length) void uploadImages(created);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit your request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="min-h-[75vh] bg-background px-4 py-16 flex items-center justify-center">
        <PageMeta title="Repair Request Received | Upper East Watch Repair" description="Your repair request has been received." />
        <Card className="max-w-xl w-full border-primary/40">
          <CardContent className="pt-8 text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <p className="text-xs uppercase tracking-[.2em] text-primary font-semibold mt-6">Request received</p>
            <h1 className="font-serif text-3xl font-semibold mt-2">We will review the details</h1>
            <p className="text-muted-foreground mt-4">Reference</p>
             <p className="font-mono text-xl font-semibold mt-1">{confirmation.reference}</p>
             {confirmation.photoStatus === 'uploading' && (
               <Alert className="mt-6 text-left">
                 <Loader2 className="h-4 w-4 animate-spin" />
                 <AlertTitle>Adding your photos</AlertTitle>
                 <AlertDescription>Your repair request is saved. We are securely attaching your selected photos now.</AlertDescription>
               </Alert>
             )}
             {confirmation.photoStatus === 'warning' && (
               <Alert className="mt-6 text-left border-amber-500/50 bg-amber-500/5">
                 <AlertTitle>Photos still need attention</AlertTitle>
                 <AlertDescription>
                   <p>{confirmation.photoError}</p>
                    <Button className="mt-3" size="sm" type="button" onClick={() => {
                      trackFunnelEvent('repair_photos_retry_clicked', { inStore, imageCount: confirmation.files.length });
                      void uploadImages(confirmation);
                    }} disabled={!confirmation.uploadToken || photosUploading}>
                     Retry photos
                   </Button>
                 </AlertDescription>
               </Alert>
             )}
             {confirmation.photoStatus === 'complete' && (
               <Alert className="mt-6 text-left border-primary/40 bg-primary/5">
                 <CheckCircle2 className="h-4 w-4 text-primary" />
                 <AlertTitle>Photos attached</AlertTitle>
                 <AlertDescription>All selected photos were securely added to your repair request.</AlertDescription>
               </Alert>
             )}
            <div className="mt-6 rounded-md border border-border bg-muted/40 p-4 text-left text-sm text-muted-foreground space-y-2">
              <p>1. A team member reviews your watch details and photos.</p>
              <p>2. We contact you using your preferred method to discuss next steps.</p>
              <p>3. No repair begins until the watch is received, inspected, and you approve a quote.</p>
            </div>
            {inStore && <p className="mt-4 text-sm font-medium">Please show this reference to a staff member. This form does not record custody of your watch.</p>}
            <Button className="mt-7" onClick={() => navigate('/')}>Return home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${inStore ? 'In-Store ' : ''}Repair Intake | Upper East Watch Repair`}
        description="Share details about your watch and request a repair assessment."
      />
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center gap-4">
          <Link href="/repair" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Repair options
          </Link>
          <span className="flex items-center text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5 mr-1" /> Private & secure</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {inStore && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <Store className="h-4 w-4" />
            <AlertTitle>In-store iPad intake</AlertTitle>
            <AlertDescription>
              Customer information only. Submitting this form does not mean the shop has taken possession of the watch. A staff member must separately record receipt.
            </AlertDescription>
          </Alert>
        )}
        <div className="max-w-2xl mb-8">
          <p className="text-xs uppercase tracking-[.2em] text-primary font-semibold">{inStore ? 'In-store intake' : 'Repair request'}</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold mt-2">Tell us about your watch</h1>
          <p className="text-muted-foreground mt-4">Required fields are marked with an asterisk. Details can be approximate.</p>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <FormCard title="Your contact details">
            <Field label="Name *"><Input value={values.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" required /></Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Phone"><Input value={values.phone} onChange={(e) => set('phone', e.target.value)} type="tel" autoComplete="tel" /></Field>
              <Field label="Email"><Input value={values.email} onChange={(e) => set('email', e.target.value)} type="email" autoComplete="email" /></Field>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">At least one of phone or email is required.</p>
            <Field label="Preferred contact *">
              <Select value={values.preferredContact} onValueChange={(v) => set('preferredContact', v)}>
                <SelectTrigger><SelectValue placeholder="Choose phone, text, or email" /></SelectTrigger>
                <SelectContent><SelectItem value="phone">Phone call</SelectItem><SelectItem value="sms">Text message</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent>
              </Select>
            </Field>
          </FormCard>

          <FormCard title="Watch and service">
            <Field label="Service category *">
              <Select value={values.serviceCategory} onValueChange={(v) => set('serviceCategory', v)}>
                <SelectTrigger><SelectValue placeholder="What does your watch need?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diagnosis">Not sure / diagnosis</SelectItem>
                  <SelectItem value="battery">Battery replacement</SelectItem>
                  <SelectItem value="mechanical">Mechanical service</SelectItem>
                  <SelectItem value="crystal_case">Crystal, crown, or case</SelectItem>
                  <SelectItem value="bracelet">Bracelet or strap</SelectItem>
                  <SelectItem value="restoration">Vintage restoration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Brand"><Input value={values.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Rolex, Omega, Seiko…" /></Field>
              <Field label="Model"><Input value={values.model} onChange={(e) => set('model', e.target.value)} /></Field>
              <Field label="Reference number"><Input value={values.reference} onChange={(e) => set('reference', e.target.value)} /></Field>
              <Field label="Movement">
                <Select value={values.movement} onValueChange={(v) => set('movement', v)}>
                  <SelectTrigger><SelectValue placeholder="If known" /></SelectTrigger>
                  <SelectContent><SelectItem value="automatic">Automatic</SelectItem><SelectItem value="manual">Manual wind</SelectItem><SelectItem value="quartz">Quartz</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Symptoms *"><Textarea rows={4} value={values.symptoms} onChange={(e) => set('symptoms', e.target.value)} placeholder="What is happening, and when did it begin?" required /></Field>
            <Field label="Urgency">
              <Select value={values.urgency} onValueChange={(v) => set('urgency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="flexible">Flexible</SelectItem><SelectItem value="two_weeks">Within two weeks</SelectItem><SelectItem value="one_week">Within one week</SelectItem><SelectItem value="urgent">Urgent / event date</SelectItem></SelectContent>
              </Select>
            </Field>
          </FormCard>

          <FormCard title="Value, context, and photos">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Estimated value (USD)"><Input type="number" min="0" value={values.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} /></Field>
              <Field label="Appointment reference (optional)"><Input value={values.appointmentRef} onChange={(e) => set('appointmentRef', e.target.value)} /></Field>
            </div>
            <Field label="Insurance or appraisal notes"><Textarea rows={2} value={values.insuranceNotes} onChange={(e) => set('insuranceNotes', e.target.value)} /></Field>
            <Field label="Anything else"><Textarea rows={3} value={values.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
            <div>
              <Label htmlFor="watch-images">Photos (up to 5)</Label>
              <label htmlFor="watch-images" className="mt-2 border border-dashed border-border rounded-md min-h-28 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors">
                <ImagePlus className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium">Choose watch photos</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP · 8 MB maximum each</span>
              </label>
              <input id="watch-images" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} disabled={files.length >= 5} />
              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                  {previews.map((src, i) => (
                    <div key={src} className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted">
                      <img src={src} alt={`Selected watch ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} aria-label={`Remove image ${i + 1}`} className="absolute top-1 right-1 bg-background/90 rounded-full p-1"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormCard>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} />
                <Label htmlFor="consent" className="font-normal leading-relaxed cursor-pointer">
                  I consent to Upper East Watch Repair contacting me about this request using my preferred method. Message or call rates may apply. I can opt out at any time. *
                </Label>
              </div>
              {inStore && <p className="text-xs text-muted-foreground mt-4">This submission creates a lead only. It does not acknowledge possession, custody, or condition of the watch.</p>}
            </CardContent>
          </Card>
          {error && <Alert variant="destructive"><AlertTitle>Check your request</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          <Button size="lg" type="submit" disabled={submitting || !canSubmit} className="w-full sm:w-auto min-w-52">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit repair request'}
          </Button>
        </form>
      </main>
    </div>
  );
}

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return <Card><CardHeader><CardTitle className="font-serif text-2xl">{title}</CardTitle></CardHeader><CardContent className="space-y-5">{children}</CardContent></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}