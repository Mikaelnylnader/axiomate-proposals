import { TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded bg-accent animate-pulse" />
          <div className="h-4 w-24 rounded bg-accent animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 rounded-full bg-accent animate-pulse" />
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
