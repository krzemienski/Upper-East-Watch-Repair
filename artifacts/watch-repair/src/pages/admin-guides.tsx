import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  FileText,
  Eye,
  Pencil,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import {
  useListAdminGuides,
  useCreateGuide,
  useUpdateGuide,
  useGetGuideSummary,
  getListAdminGuidesQueryKey,
  getGetGuideSummaryQueryKey,
  getListPublishedGuidesQueryKey,
  type Guide,
  type GuideInput,
} from '@workspace/api-client-react';
import { Button } from '@workspace/upper-east-horology/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/upper-east-horology/components/ui/card';
import { Badge } from '@workspace/upper-east-horology/components/ui/badge';
import { Input } from '@workspace/upper-east-horology/components/ui/input';
import { Textarea } from '@workspace/upper-east-horology/components/ui/textarea';
import { Skeleton } from '@workspace/upper-east-horology/components/ui/skeleton';
import { Separator } from '@workspace/upper-east-horology/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/upper-east-horology/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/upper-east-horology/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/upper-east-horology/components/ui/form';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@workspace/upper-east-horology/components/ui/empty';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/upper-east-horology/components/ui/alert-dialog';
import { toast } from '@workspace/upper-east-horology/hooks/use-toast';
import { cn } from '@workspace/upper-east-horology/lib/utils';
import { AdminShell } from '@/components/admin/AdminShell';
import { renderMarkdown, readingTime } from '@/lib/markdown';

const guideFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only'),
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  body: z.string().min(1, 'Body is required'),
  author: z.string().min(1, 'Author is required'),
  status: z.enum(['draft', 'published']),
  metaDescription: z
    .string()
    .min(1, 'Meta description is required')
    .max(160, 'Keep meta description under 160 characters'),
  ogImage: z.string().optional(),
});

type GuideFormValues = z.infer<typeof guideFormSchema>;

const emptyDefaults: GuideFormValues = {
  slug: '',
  title: '',
  excerpt: '',
  body: '# Heading\n\nWrite your guide here using markdown.',
  author: '',
  status: 'draft',
  metaDescription: '',
  ogImage: '',
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/* ---------------- Editor ---------------- */

export default function AdminGuidesPage() {
  const queryClient = useQueryClient();
  const { data: guides, isLoading, isError, refetch } = useListAdminGuides();
  const { data: summary } = useGetGuideSummary();

  const [selectedId, setSelectedId] = useState<number | 'new' | null>(null);

  const selectedGuide = useMemo(
    () =>
      typeof selectedId === 'number'
        ? guides?.find((g) => g.id === selectedId) ?? null
        : null,
    [guides, selectedId]
  );

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: getListAdminGuidesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetGuideSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPublishedGuidesQueryKey() });
  }

  return (
    <AdminShell
      eyebrow="Editor"
      title="Guide management"
      description="Write and publish watch care guides."
      actions={
        <Button onClick={() => setSelectedId('new')} data-testid="button-new-guide">
          <Plus className="h-4 w-4 mr-1" />
          New guide
        </Button>
      }
    >
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: summary?.total },
            { label: 'Published', value: summary?.published },
            { label: 'Drafts', value: summary?.drafts },
          ].map((stat) => (
            <Card key={stat.label} data-testid={`stat-${stat.label.toLowerCase()}`}>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
                <p className="font-serif text-3xl font-semibold text-foreground mt-1">
                  {stat.value ?? '—'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-8">
          {/* List */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70 mb-3">
              All guides
            </h2>

            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-md" />
                ))}
              </div>
            )}

            {isError && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Couldn't load guides.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-list">
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isLoading && !isError && guides && guides.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No guides yet. Create your first one.
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && !isError && guides && guides.length > 0 && (
              <ul className="space-y-2">
                {guides.map((guide) => (
                  <li key={guide.id}>
                    <button
                      onClick={() => setSelectedId(guide.id)}
                      className={cn(
                        'w-full text-left rounded-md border p-4 transition-colors hover-elevate',
                        selectedId === guide.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                      )}
                      data-testid={`guide-item-${guide.slug}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-foreground line-clamp-1">
                          {guide.title}
                        </span>
                        <Badge
                          variant={guide.status === 'published' ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {guide.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        /{guide.slug}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail / editor */}
          <div>
            {selectedId === null ? (
              <Empty className="border border-border rounded-lg h-full min-h-[400px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Pencil className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>Select a guide to edit</EmptyTitle>
                  <EmptyDescription>
                    Choose a guide from the list, or create a new one to get started.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setSelectedId('new')} data-testid="button-empty-new">
                    <Plus className="h-4 w-4 mr-1" />
                    New guide
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <GuideForm
                key={selectedId === 'new' ? 'new' : selectedGuide?.id}
                guide={selectedId === 'new' ? null : selectedGuide}
                onDone={(g) => {
                  invalidateAll();
                  if (g) setSelectedId(g.id);
                }}
                onCancel={() => setSelectedId(null)}
                onAfterMutate={invalidateAll}
              />
            )}
          </div>
        </div>
    </AdminShell>
  );
}


/* ---------------- Form ---------------- */

function GuideForm({
  guide,
  onDone,
  onCancel,
  onAfterMutate,
}: {
  guide: Guide | null;
  onDone: (g: Guide | null) => void;
  onCancel: () => void;
  onAfterMutate: () => void;
}) {
  const isNew = !guide;
  const createGuide = useCreateGuide();
  const updateGuide = useUpdateGuide();
  const [confirmToggle, setConfirmToggle] = useState(false);

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideFormSchema),
    defaultValues: guide
      ? {
          slug: guide.slug,
          title: guide.title,
          excerpt: guide.excerpt,
          body: guide.body,
          author: guide.author,
          status: guide.status,
          metaDescription: guide.metaDescription,
          ogImage: guide.ogImage ?? '',
        }
      : emptyDefaults,
  });

  // Auto-slug from title only for new guides while slug is untouched
  const titleValue = form.watch('title');
  const slugTouched = form.formState.dirtyFields.slug;
  useEffect(() => {
    if (isNew && !slugTouched && titleValue) {
      form.setValue('slug', slugify(titleValue), { shouldValidate: false });
    }
  }, [titleValue, isNew, slugTouched, form]);

  const bodyValue = form.watch('body');
  const previewBlocks = useMemo(() => renderMarkdown(bodyValue || ''), [bodyValue]);

  function toInput(values: GuideFormValues): GuideInput {
    return {
      slug: values.slug,
      title: values.title,
      excerpt: values.excerpt,
      body: values.body,
      author: values.author,
      status: values.status,
      metaDescription: values.metaDescription,
      ogImage: values.ogImage?.trim() ? values.ogImage.trim() : null,
    };
  }

  function onSubmit(values: GuideFormValues) {
    const data = toInput(values);
    if (isNew) {
      createGuide.mutate(
        { data },
        {
          onSuccess: (created) => {
            toast({ title: 'Guide created', description: `"${created.title}" was saved.` });
            onDone(created);
          },
          onError: () => {
            toast({
              title: 'Could not create guide',
              description: 'Please check the fields and try again.',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      updateGuide.mutate(
        { id: guide!.id, data },
        {
          onSuccess: (updated) => {
            toast({ title: 'Guide saved', description: `"${updated.title}" was updated.` });
            onDone(updated);
          },
          onError: () => {
            toast({
              title: 'Could not save guide',
              description: 'Please check the fields and try again.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  }

  function togglePublish() {
    if (!guide) return;
    const nextStatus = guide.status === 'published' ? 'draft' : 'published';
    updateGuide.mutate(
      { id: guide.id, data: { status: nextStatus } },
      {
        onSuccess: (updated) => {
          form.setValue('status', updated.status);
          toast({
            title: updated.status === 'published' ? 'Guide published' : 'Guide unpublished',
            description:
              updated.status === 'published'
                ? 'It is now live in the guide index.'
                : 'It has been moved back to drafts.',
          });
          onAfterMutate();
        },
        onError: () => {
          toast({
            title: 'Could not update status',
            variant: 'destructive',
          });
        },
      }
    );
    setConfirmToggle(false);
  }

  const saving = createGuide.isPending || updateGuide.isPending;
  const isPublished = form.watch('status') === 'published';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{isNew ? 'New guide' : 'Edit guide'}</CardTitle>
            <CardDescription>
              {isNew
                ? 'Draft a new watch care guide.'
                : `Editing "${guide?.title}"`}
            </CardDescription>
          </div>
          {!isNew && guide && (
            <Badge variant={guide.status === 'published' ? 'default' : 'secondary'}>
              {guide.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit" data-testid="tab-edit">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-preview">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Live preview
                </TabsTrigger>
              </TabsList>

              {/* EDIT TAB */}
              <TabsContent value="edit" className="space-y-5 mt-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="How to extend your watch battery life" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="watch-battery-life" {...field} data-testid="input-slug" />
                        </FormControl>
                        <FormDescription>Lowercase, hyphenated. Used in the URL.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author</FormLabel>
                        <FormControl>
                          <Input placeholder="The Watchmaker" {...field} data-testid="input-author" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A short summary shown in the guide index."
                          rows={2}
                          {...field}
                          data-testid="input-excerpt"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="SEO description, under 160 characters."
                          rows={2}
                          {...field}
                          data-testid="input-meta"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length}/160 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ogImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG image URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          {...field}
                          value={field.value ?? ''}
                          data-testid="input-ogimage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body (Markdown)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={16}
                          className="font-mono text-sm"
                          {...field}
                          data-testid="input-body"
                        />
                      </FormControl>
                      <FormDescription>
                        Supports headings, lists, links, bold, italics, quotes, and code.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* PREVIEW TAB */}
              <TabsContent value="preview" className="mt-6">
                <div className="rounded-lg border border-border p-6 sm:p-8 bg-background">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                    Live preview
                  </p>
                  <h1 className="font-serif text-3xl font-semibold text-foreground leading-tight">
                    {form.watch('title') || 'Untitled guide'}
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    {form.watch('excerpt') || 'Your excerpt will appear here.'}
                  </p>
                  <div className="mt-3 text-sm text-muted-foreground">
                    {form.watch('author') || 'Author'} · {readingTime(bodyValue || '')} min read
                  </div>
                  <Separator className="my-6" />
                  <div className="prose prose-watch max-w-none prose-headings:font-serif">
                    {previewBlocks.map((b) => (
                      <div key={b.key} dangerouslySetInnerHTML={{ __html: b.html }} />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving} data-testid="button-save">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1.5" />
                  )}
                  {isNew ? 'Create guide' : 'Save changes'}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel} data-testid="button-cancel">
                  <X className="h-4 w-4 mr-1.5" />
                  Close
                </Button>
              </div>

              {!isNew && guide && (
                <Button
                  type="button"
                  variant={isPublished ? 'outline' : 'default'}
                  onClick={() => setConfirmToggle(true)}
                  disabled={updateGuide.isPending}
                  data-testid="button-toggle-publish"
                >
                  {isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>

      {/* Publish/unpublish confirm */}
      <AlertDialog open={confirmToggle} onOpenChange={setConfirmToggle}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {guide?.status === 'published' ? 'Unpublish this guide?' : 'Publish this guide?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {guide?.status === 'published'
                ? 'It will be removed from the public guide index and moved to drafts.'
                : 'It will become visible in the public guide index immediately.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-toggle">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={togglePublish} data-testid="button-confirm-toggle">
              {guide?.status === 'published' ? 'Unpublish' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
