import { Card } from "@/components/ui/card";
import { 
  Stethoscope, 
  Calendar, 
  Search,
  FileText
} from "lucide-react";

interface ConsultationEmptyStateProps {
  type?: "active" | "all";
  hasFilters?: boolean;
  onClearFilters?: () => void;
  /** When total > 0 but current page has no results (e.g. audiologist filter) */
  noResultsOnPage?: boolean;
  /** Use when page uses infinite scroll instead of pagination */
  infiniteScroll?: boolean;
  /** When infinite scroll: false = more to load, true = reached end */
  hasMoreToLoad?: boolean;
}

export function ConsultationEmptyState({ 
  type = "all",
  hasFilters = false,
  onClearFilters,
  noResultsOnPage = false,
  infiniteScroll = false,
  hasMoreToLoad = true,
}: ConsultationEmptyStateProps) {
  const isActive = type === "active";

  return (
    <Card className="p-12 bg-gradient-to-br from-primary-50/50 via-white to-primary-50/30 dark:from-primary-950/20 dark:via-gray-800 dark:to-primary-950/10 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-2xl">
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 p-6 rounded-full">
            {isActive ? (
              <Stethoscope className="w-16 h-16 text-primary-600 dark:text-primary-400" />
            ) : (
              <FileText className="w-16 h-16 text-primary-600 dark:text-primary-400" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isActive 
              ? "No Active Consultations" 
              : noResultsOnPage
                ? "No Consultations on This Page"
                : hasFilters 
                  ? "No Consultations Found"
                  : "No Consultations Yet"}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {isActive ? (
              <>
                There are currently no active consultations. New consultations will appear here when they are created.
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 block">
                  Check the "All Consultations" page to view completed sessions.
                </span>
              </>
            ) : noResultsOnPage ? (
              <>
                {infiniteScroll
                  ? hasMoreToLoad
                    ? "No consultations assigned to you in the loaded results. Keep scrolling to load more."
                    : "No consultations assigned to you in the loaded results. You've reached the end."
                  : "No consultations assigned to you on this page. Try browsing other pages to find your consultations."}
              </>
            ) : hasFilters ? (
              <>
                No consultations match your current filters. Try adjusting your date range or audiologist, or clear the filters to see all consultations.
              </>
            ) : (
              <>
                You haven't created any consultations yet. Once consultations are created, they will appear here.
              </>
            )}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="flex items-center gap-2 text-primary-300 dark:text-primary-700 mt-4">
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {isActive ? "Waiting for new consultations..." : noResultsOnPage ? (infiniteScroll ? (hasMoreToLoad ? "Scroll down to load more" : "You've reached the end") : "Use pagination to browse") : "Start creating consultations"}
          </span>
        </div>

        {/* Action button for filtered state */}
        {hasFilters && !noResultsOnPage && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-4 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Search className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>
    </Card>
  );
}

