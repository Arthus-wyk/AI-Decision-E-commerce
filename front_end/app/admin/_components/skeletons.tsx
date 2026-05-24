import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

export function DataTableSkeleton({ title = true }: { title?: boolean }) {
  return (
    <Card>
      {title ? (
        <CardHeader className="gap-3">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border border-blue-100 bg-blue-50/40 p-3 lg:grid-cols-[minmax(220px,1fr)_180px_repeat(3,150px)_auto]">
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock className="h-14" key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-blue-100 pb-5">
        <SkeletonBlock className="h-9 w-44" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </header>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-4 p-4">
              <SkeletonBlock className="h-11 w-11" />
              <div className="grid flex-1 gap-2">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-7 w-16" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
