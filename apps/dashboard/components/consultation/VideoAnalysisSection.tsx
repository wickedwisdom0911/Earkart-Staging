"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideoAnalysis } from "@/hooks/consultation/use-video-analysis";
import { VideoAnalysisDisplay } from "@/components/report/VideoAnalysisDisplay";

interface VideoAnalysisSectionProps {
  consultationId: string;
}

export function VideoAnalysisSection({ consultationId }: VideoAnalysisSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const {
    data: videoAnalysis,
    isLoading: analysisLoading,
    error: analysisError,
  } = useVideoAnalysis(consultationId, { enabled: isInView });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsInView(true);
      },
      { rootMargin: "100px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <FileText className="w-5 h-5" />
            Video Call Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {!isInView && (
            <p className="text-center py-6 text-gray-500">Scroll to load analysis...</p>
          )}
          {isInView && analysisLoading && (
            <p className="text-center py-6 text-gray-500">Loading analysis...</p>
          )}
          {isInView && analysisError && (
            <p className="text-center py-6 text-amber-600">Failed to load analysis</p>
          )}
          {isInView && !analysisLoading && !videoAnalysis && !analysisError && (
            <p className="text-center py-6 text-gray-500">No analysis available</p>
          )}
          {isInView && videoAnalysis && (
            <VideoAnalysisDisplay content={videoAnalysis} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
