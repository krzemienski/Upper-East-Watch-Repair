import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@workspace/upper-east-horology/components/ui/toaster';
import { TooltipProvider } from '@workspace/upper-east-horology/components/ui/tooltip';
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { SiteLayout } from '@/components/SiteLayout';
import { LocalBusinessJsonLd } from '@/components/LocalBusinessJsonLd';
import { SiteAnalytics } from '@/components/SiteAnalytics';
import HomePage from '@/pages/home';
import ServiceWatchRepairPage from '@/pages/service-watch-repair';
import ServiceBatteryReplacementPage from '@/pages/service-battery-replacement';
import AboutPage from '@/pages/about';
import BookPage from '@/pages/book';
import GuidesIndexPage from '@/pages/guides-index';
import GuideArticlePage from '@/pages/guide-article';
import AdminPage from '@/pages/admin';
import AdminLeadsPage from '@/pages/admin-leads';
import RepairPage from '@/pages/repair';
import RepairIntakePage from '@/pages/repair-intake';
import DesignSystemRedirect from '@/pages/design-system-redirect';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Routes that render inside the public site shell (nav + footer). */
function SiteRoutes() {
  return (
    <SiteLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/services/watch-repair" component={ServiceWatchRepairPage} />
        <Route path="/services/battery-replacement" component={ServiceBatteryReplacementPage} />
        {/* Jewelry repair is no longer offered; keep old links landing on watch repair. */}
        <Route path="/services/jewelry-repair"><Redirect to="/services/watch-repair" replace /></Route>
        <Route path="/guides/jewelry-repair-cost-nyc"><Redirect to="/services/watch-repair" replace /></Route>
        <Route path="/about" component={AboutPage} />
        <Route path="/book" component={BookPage} />
        <Route path="/repair" component={RepairPage} />
        <Route path="/guides" component={GuidesIndexPage} />
        <Route path="/guides/:slug" component={GuideArticlePage} />
        <Route component={NotFound} />
      </Switch>
    </SiteLayout>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Standalone routes without the marketing shell */}
        <Route path="/admin/leads" component={AdminLeadsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/repair/intake/in-store">
          <RepairIntakePage inStore />
        </Route>
        <Route path="/repair/intake">
          <RepairIntakePage />
        </Route>
        <Route path="/design-system" component={DesignSystemRedirect} />
        {/* Everything else uses the public site shell */}
        <Route component={SiteRoutes} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocalBusinessJsonLd />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <SiteAnalytics />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
