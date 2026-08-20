import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Redirects visitors to the living design-system preview.
 * This is an external artifact route, so we navigate the browser directly
 * rather than using the wouter router.
 */
export default function DesignSystemRedirect() {
  useEffect(() => {
    window.location.replace('/upper-east-horology/');
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">Opening the design system…</p>
      <a href="/upper-east-horology/" className="text-sm text-primary hover:underline">
        Continue if you are not redirected
      </a>
    </div>
  );
}
