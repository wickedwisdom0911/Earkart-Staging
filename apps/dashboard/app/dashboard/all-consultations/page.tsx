"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { Role } from "@/models/enums";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetConsultationsInfinite } from "@/hooks/consultation/use-get-consultations-infinite";
import {
  User,
  Filter,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { exportConsultationsToExcel } from "@/lib/export-consultations-excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ConsultationGridSkeleton } from "@/components/ui/consultation-skeleton";
import { ConsultationEmptyState } from "@/components/ui/consultation-empty-state";
import { ConsultationCard } from "@/components/consultation/ConsultationCard";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import getConsultation from "@/actions/consultations/get_consultation";

const PAGE_SIZE = 20;

function AllConsultationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: user } = useGetUser();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const isAudiologist =
    user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;
  const isHeadAudiologist = user?.role === Role.HEAD_AUDIOLOGIST;

  const {
    consultations: allConsultations,
    total,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetConsultationsInfinite({
    limit: PAGE_SIZE,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Client-side filter for audiologists and date range
  // HEAD_AUDIOLOGIST: see all consultations
  // AUDIOLOGIST: see unassigned (no audiologist) + their own (audiologist.userId === user.id)
  const filteredConsultations = allConsultations.filter((c) => {
    if (isAudiologist && !isHeadAudiologist && user?.id) {
      if (c.audiologist?.userId && c.audiologist.userId !== user.id)
        return false;
    }
    if (startDate && new Date(c.createdAt || "") < new Date(startDate))
      return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(c.createdAt || "") > end) return false;
    }
    return true;
  });

  const handleViewDetails = useCallback(
    (consultationId: string) => {
      setNavigatingTo(consultationId);
      router.push(`/dashboard/consultation-details/${consultationId}`);
    },
    [router]
  );

  const handlePrefetchConsultation = useCallback(
    (consultationId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["consultation", consultationId],
        queryFn: () => getConsultation(consultationId),
        staleTime: 3 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  // Infinite scroll: load more when loadMoreRef becomes visible
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const consultations = filteredConsultations;
  const loadedCount = allConsultations.length;

  // Scroll to consultation when returning from details page
  const scrollToId = searchParams.get("scrollTo");
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (!scrollToId || consultations.length === 0 || hasScrolledRef.current) return;
    const el = document.getElementById(`consultation-${scrollToId}`);
    if (el) {
      hasScrolledRef.current = true;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      router.replace("/dashboard/all-consultations", { scroll: false });
    }
  }, [scrollToId, consultations, router]);

  return (
    <DashboardBodyWrapper>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isAudiologist ? "My Session History" : "Session History"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAudiologist
                ? "Browse and filter your past consultation records"
                : "Browse and filter all consultation records"}
            </p>
            {isAudiologist && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                <User className="w-4 h-4" />
                <span>Showing only your consultations</span>
              </div>
            )}
          </div>
          {consultations.length > 0 && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                exportConsultationsToExcel(consultations);
                toast.success(
                  `Exported ${consultations.length} consultation${consultations.length !== 1 ? "s" : ""} to Excel`
                );
              }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </Button>
          )}
        </div>

        <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {total > 0
              ? `Loaded ${loadedCount} of ${total} consultation${total !== 1 ? "s" : ""} — scroll for more`
              : loadedCount > 0
                ? `Showing ${consultations.length} consultation${consultations.length !== 1 ? "s" : ""}`
                : "No consultations"}
          </p>
        </div>

        {isLoading && (
          <div className="w-full">
            <ConsultationGridSkeleton count={4} />
          </div>
        )}

        {isError && (
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <p className="font-semibold">
                  {error instanceof Error && (error as any).isRateLimit
                    ? "Too Many Requests"
                    : "Failed to load consultations"}
                </p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error instanceof Error && (error as any).isRateLimit
                  ? "The server is receiving too many requests. Please wait a moment and try again."
                  : error instanceof Error
                    ? error.message
                    : "Please try again later."}
              </p>
              {error instanceof Error && (error as any).isRateLimit && (
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-2 w-fit"
                  variant="outline"
                >
                  Retry
                </Button>
              )}
            </div>
          </Card>
        )}

        {!isLoading && !isError && (
          <>
            {consultations.length === 0 ? (
              <ConsultationEmptyState
                type="all"
                hasFilters={!!(startDate || endDate)}
                onClearFilters={clearFilters}
                noResultsOnPage={
                  total > 0 && !(startDate || endDate) && isAudiologist
                }
                infiniteScroll
                hasMoreToLoad={hasNextPage ?? false}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {consultations.map((consultation) => (
                    <ConsultationCard
                      key={consultation.id}
                      consultation={consultation}
                      onViewDetails={handleViewDetails}
                      isNavigating={navigatingTo === consultation.id}
                      onHover={handlePrefetchConsultation}
                    />
                  ))}
                </div>

                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="min-h-[120px] flex items-center justify-center py-8">
                  {isFetchingNextPage && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading more...
                      </p>
                    </div>
                  )}
                  {!hasNextPage && loadedCount > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You&apos;ve reached the end
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {navigatingTo && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-4 shadow-xl">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Loading consultation details...
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}

export default function AllConsultationsPage() {
  return (
    <Suspense fallback={<ConsultationGridSkeleton count={4} />}>
      <AllConsultationsContent />
    </Suspense>
  );
}
