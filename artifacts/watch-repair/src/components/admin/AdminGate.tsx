import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, LockKeyhole, ShieldAlert } from 'lucide-react';
import {
  ApiError,
  getGetAdminSessionQueryKey,
  useAdminLogin,
  useAdminLogout,
  useGetAdminSession,
} from '@workspace/api-client-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/upper-east-horology/components/ui/card';
import { Input } from '@workspace/upper-east-horology/components/ui/input';
import { Label } from '@workspace/upper-east-horology/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@workspace/upper-east-horology/components/ui/alert';
import { toast } from '@workspace/upper-east-horology/hooks/use-toast';
import { PageMeta } from '@/components/PageMeta';
import { Logo } from '@/components/Logo';
import { ADMIN_SESSION_LOST_EVENT, apiErrorMessage } from '@/lib/admin';

interface AdminSessionContextValue {
  signOut: () => void;
  signingOut: boolean;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSession(): AdminSessionContextValue {
  const value = useContext(AdminSessionContext);
  if (!value) throw new Error('useAdminSession must be used inside AdminGate');
  return value;
}

/** Shows the password screen until the browser holds a valid admin session. */
export function AdminGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useGetAdminSession({ query: { queryKey: getGetAdminSessionQueryKey(), retry: false, staleTime: 60_000 } });
  const logout = useAdminLogout();

  // Any admin request that comes back 401 means the session expired or was revoked.
  useEffect(() => {
    const recheck = () => void queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
    window.addEventListener(ADMIN_SESSION_LOST_EVENT, recheck);
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const error = event.query.state.error;
      if (event.type === 'updated' && error instanceof ApiError && error.status === 401) recheck();
    });
    return () => {
      window.removeEventListener(ADMIN_SESSION_LOST_EVENT, recheck);
      unsubscribe();
    };
  }, [queryClient]);

  function signOut() {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries({ predicate: (query) => String(query.queryKey[0] ?? '').startsWith('/api/admin') && query.queryKey[0] !== '/api/admin/session' });
        void queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
        toast({ title: 'Signed out' });
      },
      onError: () => toast({ title: 'Could not sign out. Please try again.', variant: 'destructive' }),
    });
  }

  if (session.isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center" role="status" aria-label="Checking admin session">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (session.isError) {
    return (
      <GateCard title="Admin unavailable" description="The admin panel could not be reached.">
        <Button className="w-full" onClick={() => session.refetch()}>Try again</Button>
      </GateCard>
    );
  }

  if (!session.data?.configured) {
    return (
      <GateCard title="Admin access not configured" description="An admin password has not been set for this site, so access is locked.">
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Locked</AlertTitle>
          <AlertDescription>Add the admin password in the project secrets, then reload this page.</AlertDescription>
        </Alert>
      </GateCard>
    );
  }

  if (!session.data.authenticated) return <PasswordForm />;

  return (
    <AdminSessionContext.Provider value={{ signOut, signingOut: logout.isPending }}>
      {children}
    </AdminSessionContext.Provider>
  );
}

function PasswordForm() {
  const queryClient = useQueryClient();
  const login = useAdminLogin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      setError('Enter the admin password.');
      return;
    }
    setError('');
    login.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          setPassword('');
          queryClient.setQueryData(getGetAdminSessionQueryKey(), data);
        },
        onError: (caught) => {
          setPassword('');
          setError(apiErrorMessage(caught, 'Could not sign in. Try again.'));
        },
      },
    );
  }

  return (
    <GateCard title="Shop admin" description="Enter the admin password to view repair requests and customers.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'admin-password-error' : undefined}
            data-testid="input-admin-password"
          />
          {error && (
            <p id="admin-password-error" role="alert" className="text-sm text-destructive" data-testid="text-login-error">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={login.isPending} data-testid="button-admin-sign-in">
          {login.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
          Sign in
        </Button>
      </form>
    </GateCard>
  );
}

function GateCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background grid place-items-center px-4 py-12">
      <PageMeta title={`${title} | Upper East Watch Repair`} description="Restricted shop workspace." />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo className="h-9 w-auto mx-auto mb-4" />
          <div className="h-11 w-11 bg-primary/10 rounded-md mx-auto grid place-items-center">
            <LockKeyhole className="h-5 w-5 text-primary" />
          </div>
          <CardTitle role="heading" aria-level={1}>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
