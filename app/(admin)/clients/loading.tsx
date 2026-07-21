import { TableSkeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 rounded bg-accent animate-pulse" />
          <div className="h-4 w-24 rounded bg-accent animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 rounded-full bg-accent animate-pulse" />
      </div>
      <TableSkeleton rows={6} cols={3} />
    </div>
  );
}
