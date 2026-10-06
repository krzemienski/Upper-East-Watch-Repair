import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole, Store } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Card, CardContent, CardHeader } from '@workspace/upper-east-horology/components/ui/card';
import { Input } from '@workspace/upper-east-horology/components/ui/input';
import { Textarea } from '@workspace/upper-east-horology/components/ui/textarea';
import { Label } from '@workspace/upper-east-horology/components/ui/label';
import { Checkbox } from '@workspace/upper-east-horology/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/upper-east-horology/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@workspace/upper-east-horology/components/ui/alert';
import { PageMeta } from '@/components/PageMeta';
import { getAttribution, trackFunnelEvent } from '@/lib/repair-funnel';
import { trackGoogleEvent } from '@/lib/google-analytics';

type IntakeState = {
  name: string;
  phone: string;
  email: string;
  preferredContact: string;
  serviceCategory: string;
  brand: string;
  symptoms: string;
  urgency: string;
};

type ConfirmationState = {
  reference: string;
  leadId: string | number;
};

const initial: IntakeState = {
  name: '', phone: '', email: '', preferredContact: '', serviceCategory: '',
  brand: '', symptoms: '', urgency: 'flexible',
};

function parseReference(lead: Record<string, unknown>) {
  return String(lead.reference ?? lead.referenceNumber ?? lead.publicId ?? lead.id ?? '');
}

export default function RepairIntakePage({ inStore = false }: { inStore?: boolean }) {
  const [, navigate] = useLocation();
  const [values, setValues] = useState(initial);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const formStarted = useRef(false);
  const formComplete = useRef(false);
  const formId = inStore ? 'in_store_repair' : 'online_repair';
  function measureForm(event: string, properties: Record<string, string | number | boolean> = {}) {
    trackGoogleEvent(event, { form_id: formId, in_store: inStore, ...properties });
  }
  function startForm() {
    if (formStarted.current) return;
    formStarted.current = true;
    measureForm('repair_form_started');
  }

  useEffect(() => {
    let reported = false;
    const reportExit = () => {
      if (!reported && formStarted.current && !formComplete.current) {
        reported = true;
        trackGoogleEvent('repair_form_abandoned', { form_id: formId, in_store: inStore });
      }
    };
    window.addEventListener('pagehide', reportExit);
    return () => {
      window.removeEventListener('pagehide', reportExit);
      reportExit();
    };
  }, [formId, inStore]);

  useEffect(() => {
    trackFunnelEvent(inStore ? 'in_store_intake_started' : 'repair_intake_started');
    if (new URLSearchParams(window.location.search).get('contact') === 'phone') {
      setValues((current) => ({ ...current, preferredContact: 'phone' }));
    }
  }, [inStore]);

  const canSubmit = useMemo(
    () => values.name.trim() && (values.phone.trim() || values.email.trim()) &&
      values.preferredContact && (values.preferredContact !== 'email' || values.email.trim()) &&
      (!['phone', 'sms'].includes(values.preferredContact) || values.phone.trim()) &&
      values.serviceCategory && values.symptoms.trim() && consent,
    [values, consent],
  );

  function set(name: keyof IntakeState, value: string) {
    startForm();
    if (name === 'serviceCategory') measureForm('repair_service_selected', { service_type: value });
    if (name === 'preferredContact') measureForm('repair_contact_method_selected', { contact_method: value });
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || confirmation) return;
    measureForm('repair_form_submit_attempt');
    setError('');
    if (!canSubmit) {
      measureForm('repair_form_validation_error', { error_type: 'required_fields' });
      setError('Complete the required fields, provide phone or email, and confirm contact consent.');
      return;
    }
    setSubmitting(true);
    try {
      const attribution = getAttribution();
      const description = [
        values.symptoms,
        values.urgency && `Urgency: ${values.urgency}`,
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
          description,
          intakeMode: inStore ? 'in_store' : 'unsure',
          ...attribution,
        }),
      });
      if (!response.ok) throw new Error('We could not submit your request. Please check the form and try again.');
      const result = await response.json() as { lead: Record<string, unknown> };
      const reference = parseReference(result.lead);
      const created: ConfirmationState = {
        reference,
        leadId: result.lead.id as string | number,
      };
      setConfirmation(created);
      formComplete.current = true;
      measureForm('generate_lead', { service_type: values.serviceCategory, contact_method: values.preferredContact });
      trackFunnelEvent('repair_intake_submitted', { leadId: created.leadId, inStore });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      measureForm('repair_form_submit_failed', { error_type: 'submission_failed' });
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
            <div className="mt-6 rounded-md border border-border bg-muted/40 p-4 text-left text-sm text-muted-foreground space-y-2">
              <p>1. A team member reviews your watch details.</p>
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
        title={`${inStore ? 'In-Store ' : ''}Start Repair Quote | Upper East Watch Repair`}
        description="Share a few details about your watch to start a repair quote with Upper East Watch Repair."
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
          <p className="text-xs uppercase tracking-[.2em] text-primary font-semibold">{inStore ? 'In-store intake' : 'Start repair quote'}</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold mt-2">Tell us about your watch</h1>
          <p className="text-muted-foreground mt-4">Required fields are marked with an asterisk. Details can be approximate.</p>
        </div>
        <form onSubmit={submit} onChangeCapture={startForm} onInvalidCapture={() => measureForm('repair_form_validation_error', { error_type: 'invalid_field' })} className="space-y-6">
          <FormCard title="Your contact details">
            <Field label="Name *" htmlFor="repair-name"><Input id="repair-name" value={values.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" required /></Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Phone" htmlFor="repair-phone"><Input id="repair-phone" value={values.phone} onChange={(e) => set('phone', e.target.value)} type="tel" autoComplete="tel" /></Field>
              <Field label="Email" htmlFor="repair-email"><Input id="repair-email" value={values.email} onChange={(e) => set('email', e.target.value)} type="email" autoComplete="email" /></Field>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">At least one of phone or email is required.</p>
            <Field label="Preferred contact *" htmlFor="repair-preferred-contact">
              <Select value={values.preferredContact} onValueChange={(v) => set('preferredContact', v)}>
                <SelectTrigger id="repair-preferred-contact" aria-labelledby="repair-preferred-contact-label" aria-required="true"><SelectValue placeholder="Choose phone, text, or email" /></SelectTrigger>
                <SelectContent><SelectItem value="phone">Phone call</SelectItem><SelectItem value="sms">Text message</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent>
              </Select>
            </Field>
          </FormCard>

          <FormCard title="Watch and service">
            <Field label="Service category *" htmlFor="repair-service-category">
              <Select value={values.serviceCategory} onValueChange={(v) => set('serviceCategory', v)}>
                <SelectTrigger id="repair-service-category" aria-labelledby="repair-service-category-label" aria-required="true"><SelectValue placeholder="What does your watch need?" /></SelectTrigger>
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
            <Field label="Brand" htmlFor="repair-brand"><Input id="repair-brand" value={values.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Rolex, Omega, Seiko…" data-testid="input-brand" /></Field>
            <Field label="Symptoms *" htmlFor="repair-symptoms"><Textarea id="repair-symptoms" rows={4} value={values.symptoms} onChange={(e) => set('symptoms', e.target.value)} placeholder="What is happening, and when did it begin?" required /></Field>
            <Field label="Urgency" htmlFor="repair-urgency">
              <Select value={values.urgency} onValueChange={(v) => set('urgency', v)}>
                <SelectTrigger id="repair-urgency" aria-labelledby="repair-urgency-label"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="flexible">Flexible</SelectItem><SelectItem value="two_weeks">Within two weeks</SelectItem><SelectItem value="one_week">Within one week</SelectItem><SelectItem value="urgent">Urgent / event date</SelectItem></SelectContent>
              </Select>
            </Field>
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
            {submitting ? 'Submitting…' : 'Start repair quote'}
          </Button>
        </form>
      </main>
    </div>
  );
}

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return <Card><CardHeader><h2 className="font-serif text-2xl font-semibold leading-none tracking-tight">{title}</h2></CardHeader><CardContent className="space-y-5">{children}</CardContent></Card>;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return <div className="space-y-2"><Label id={`${htmlFor}-label`} htmlFor={htmlFor}>{label}</Label>{children}</div>;
}