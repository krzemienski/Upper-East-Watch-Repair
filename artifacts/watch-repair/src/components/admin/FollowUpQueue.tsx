import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, Loader2 } from 'lucide-react';
import {
  getListFollowUpsQueryKey,
  useListFollowUps,
  useUpdateFollowUp,
  type FollowUpTask,
  type FollowUpUpdate,
} from '@workspace/api-client-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import { Badge } from '@workspace/upper-east-horology/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/upper-east-horology/components/ui/card';
import { toast } from '@workspace/upper-east-horology/hooks/use-toast';
import { apiErrorMessage, channelLabel, formatDate } from '@/lib/admin';

const PENDING = { status: 'pending' } as const;

export function usePendingFollowUps() {
  return useListFollowUps(PENDING, { query: { queryKey: getListFollowUpsQueryKey(PENDING) } });
}

export function FollowUpQueue({ leadNames, onOpenLead }: { leadNames: Map<number, string>; onOpenLead: (id: number) => void }) {
  const queryClient = useQueryClient();
  const followUps = usePendingFollowUps();
  const update = useUpdateFollowUp();

  function change(item: FollowUpTask, data: FollowUpUpdate, title: string) {
    update.mutate(
      { id: item.id, data },
      {
        onSuccess: () => {
          toast({ title });
          void queryClient.invalidateQueries({ queryKey: getListFollowUpsQueryKey() });
        },
        onError: (error) => toast({ title: apiErrorMessage(error, 'Could not update follow-up.'), variant: 'destructive' }),
      },
    );
  }

  if (followUps.isLoading) return <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (followUps.isError) return <p className="text-sm text-destructive">Follow-ups could not be loaded.</p>;
  const items = followUps.data ?? [];
  if (!items.length) {
    return <Card><CardContent className="py-12 text-center"><Check className="h-8 w-8 text-primary mx-auto mb-3" /><p className="font-semibold">Follow-up queue is clear</p></CardContent></Card>;
  }
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.id} data-testid={`follow-up-${item.id}`}>
          <CardHeader>
            <div className="flex justify-between gap-2">
              <CardTitle className="text-base">
                <button type="button" className="text-left hover:underline underline-offset-4" onClick={() => onOpenLead(item.leadId)}>
                  {leadNames.get(item.leadId) ?? `Request #${item.leadId}`}
                </button>
              </CardTitle>
              <Badge variant={new Date(item.dueAt) < new Date() ? 'destructive' : 'secondary'}>{formatDate(item.dueAt)}</Badge>
            </div>
            <CardDescription>{channelLabel(item.channel)} follow-up</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" disabled={update.isPending} onClick={() => change(item, { status: 'completed' }, 'Follow-up completed')} data-testid={`button-complete-follow-up-${item.id}`}>
              <Check className="h-4 w-4 mr-1" /> Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={update.isPending}
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() + 1);
                change(item, { status: 'pending', dueAt: date.toISOString() }, 'Follow-up moved to tomorrow');
              }}
            >
              <CalendarClock className="h-4 w-4 mr-1" /> Tomorrow
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
