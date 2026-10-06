import { ApiError } from '@workspace/api-client-react';

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'visit_planned',
  'watch_received',
  'estimate_pending',
  'won',
  'lost',
] as const;

export const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: 'diagnosis', label: 'Not sure / diagnosis' },
  { value: 'battery', label: 'Battery replacement' },
  { value: 'mechanical', label: 'Mechanical service' },
  { value: 'crystal_case', label: 'Crystal, crown, or case' },
  { value: 'bracelet', label: 'Bracelet or strap' },
  { value: 'restoration', label: 'Vintage restoration' },
  { value: 'other', label: 'Other' },
];

export const CHANNEL_OPTIONS = [
  { value: 'phone', label: 'Phone call' },
  { value: 'sms', label: 'Text message' },
  { value: 'email', label: 'Email' },
  { value: 'none', label: 'No preference' },
] as const;

export const INTAKE_OPTIONS = [
  { value: 'unsure', label: 'Online request' },
  { value: 'in_store', label: 'In-store' },
  { value: 'mail_in', label: 'Mail-in' },
] as const;

export function serviceLabel(value: string | null | undefined): string {
  if (!value) return 'Not provided';
  return SERVICE_OPTIONS.find((option) => option.value === value)?.label ?? pretty(value);
}

export function channelLabel(value: string | null | undefined): string {
  return CHANNEL_OPTIONS.find((option) => option.value === value)?.label ?? pretty(value);
}

export function intakeLabel(value: string | null | undefined): string {
  return INTAKE_OPTIONS.find((option) => option.value === value)?.label ?? pretty(value);
}

export function pretty(value: unknown): string {
  return String(value || '—')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(value: unknown): string {
  if (!value) return 'Date unavailable';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDay(value: unknown): string {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString([], { dateStyle: 'medium' });
}

/** Human-readable message from an API failure. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const data = error.data as { error?: unknown } | null;
    if (data && typeof data.error === 'string') return data.error;
  }
  return fallback;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 503);
}

export const ADMIN_SESSION_LOST_EVENT = 'uewr:admin-session-lost';

/** Plain fetch for the few admin calls that are not worth a generated hook. */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (response.status === 401) window.dispatchEvent(new Event(ADMIN_SESSION_LOST_EVENT));
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}
