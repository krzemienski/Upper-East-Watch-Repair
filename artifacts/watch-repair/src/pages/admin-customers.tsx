import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ChevronRight, Loader2, Mail, Phone, Search, Users } from 'lucide-react';
import { getListCustomersQueryKey, useListCustomers, type Customer } from '@workspace/api-client-react';
import { Badge } from '@workspace/upper-east-horology/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/upper-east-horology/components/ui/card';
import { Input } from '@workspace/upper-east-horology/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@workspace/upper-east-horology/components/ui/alert';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiErrorMessage, channelLabel, formatDate, formatDay, intakeLabel, pretty, serviceLabel } from '@/lib/admin';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim().slice(0, 200)), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = debounced ? { search: debounced } : undefined;
  const customers = useListCustomers(params, { query: { queryKey: getListCustomersQueryKey(params) } });
  const list = customers.data ?? [];

  return (
    <AdminShell
      eyebrow="Shop workspace"
      title="Customers"
      description="Everyone who has sent a repair request, grouped by phone number and email."
    >
      <div className="relative max-w-md mb-5">
        <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone or email…" aria-label="Search customers" data-testid="input-search-customers" />
      </div>
      {customers.isLoading && <div className="py-16 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      {customers.isError && (
        <Alert variant="destructive">
          <AlertTitle>Customers unavailable</AlertTitle>
          <AlertDescription>{apiErrorMessage(customers.error, 'Could not load customers.')}</AlertDescription>
        </Alert>
      )}
      {customers.isSuccess && (
        <>
          <p className="text-sm text-muted-foreground mb-3" role="status">
            {list.length === 1 ? '1 customer' : `${list.length} customers`}{debounced ? ` matching “${debounced}”` : ''}
          </p>
          {list.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Users className="h-8 w-8 text-primary mx-auto mb-3" /><p className="font-semibold">No customers found</p></CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4" data-testid="list-customers">
              {list.map((customer) => <CustomerCard key={customer.key} customer={customer} />)}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  const otherNames = customer.names.filter((name) => name !== customer.name);
  return (
    <Card data-testid={`customer-${customer.key}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="font-serif text-xl break-words">{customer.name}</CardTitle>
            {otherNames.length > 0 && <CardDescription>Also submitted as {otherNames.join(', ')}</CardDescription>}
          </div>
          <Badge variant="secondary" className="self-start" data-testid="text-request-count">
            {customer.requestCount === 1 ? '1 request' : `${customer.requestCount} requests`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
            {customer.phones.length === 0 ? <p className="mt-1">Not provided</p> : customer.phones.map((phone) => (
              <a key={phone} href={`tel:${phone}`} className="mt-1 flex items-center gap-1 text-primary hover:underline underline-offset-4"><Phone className="h-3.5 w-3.5" />{phone}</a>
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
            {customer.emails.length === 0 ? <p className="mt-1">Not provided</p> : customer.emails.map((email) => (
              <a key={email} href={`mailto:${email}`} className="mt-1 flex items-center gap-1 text-primary hover:underline underline-offset-4 break-all"><Mail className="h-3.5 w-3.5 shrink-0" />{email}</a>
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Prefers</p>
            <p className="mt-1">{channelLabel(customer.preferredChannel)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer since</p>
            <p className="mt-1">{formatDay(customer.firstRequestAt)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Request history</p>
          <ul className="divide-y divide-border rounded-md border border-border">
            {customer.requests.map((request) => (
              <li key={request.id}>
                <Link href={`/admin?lead=${request.id}`} className="flex items-center gap-3 p-3 hover-elevate" data-testid={`link-customer-request-${request.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {[request.watchBrand, request.watchModel, request.serviceNeeded ? serviceLabel(request.serviceNeeded) : null].filter(Boolean).join(' · ') || request.description}
                    </p>
                    <p className="text-xs text-muted-foreground">#{request.id} · {intakeLabel(request.intakeMode)} · {formatDate(request.createdAt)}</p>
                  </div>
                  <Badge variant={request.status === 'new' ? 'default' : 'outline'} className="shrink-0">{pretty(request.status)}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
