import { type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ClipboardList, ExternalLink, FileText, Loader2, LogOut, Users } from 'lucide-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { PageMeta } from '@/components/PageMeta';
import { Logo } from '@/components/Logo';
import { useAdminSession } from './AdminGate';

const NAV = [
  { href: '/admin', label: 'Repair requests', icon: ClipboardList, match: (path: string) => path === '/admin' || path.startsWith('/admin/leads') },
  { href: '/admin/customers', label: 'Customers', icon: Users, match: (path: string) => path.startsWith('/admin/customers') },
  { href: '/admin/guides', label: 'Guides', icon: FileText, match: (path: string) => path.startsWith('/admin/guides') },
];

export function AdminShell({
  title,
  eyebrow,
  description,
  actions,
  children,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [location] = useLocation();
  const { signOut, signingOut } = useAdminSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta title={`${title} | Shop admin`} description="Protected Upper East Watch Repair shop workspace." />
      <header className="border-b border-border bg-card">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-3 min-w-0" aria-label="Shop admin home">
            <Logo className="h-7 w-auto shrink-0" />
            <span className="hidden sm:inline text-xs uppercase tracking-[.2em] text-primary font-semibold">Shop admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4 mr-1" /> View site</Button>
            </a>
            <Button variant="outline" size="sm" onClick={signOut} disabled={signingOut} data-testid="button-admin-sign-out">
              {signingOut ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <LogOut className="h-4 w-4 mr-1" />}
              Sign out
            </Button>
          </div>
        </div>
        <nav aria-label="Admin sections" className="max-w-[1500px] mx-auto px-2 sm:px-4 flex gap-1 overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(location);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                data-testid={`nav-admin-${label.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 -mb-px',
                  active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-primary font-semibold">{eyebrow}</p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
