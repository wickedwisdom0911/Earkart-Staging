import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ConsultationCardSkeleton() {
  return (
    <Card className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header skeleton */}
      <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {/* Patient Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        {/* Centre Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Audiologist Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>

      {/* Action Button skeleton */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <Skeleton className="w-full h-10 rounded-lg" />
      </div>
    </Card>
  );
}

export function ConsultationGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ConsultationCardSkeleton key={i} />
      ))}
    </div>
  );
}






