"use client";

import Link from "next/link";

// Helper: Detect if a segment is a UID (adjust regex as needed)
function isUID(segment: string) {
  // Matches UUIDs with or without dashes, and long hex strings (MongoIDs)
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment
    ) || // UUID v4
    /^[0-9a-f]{24}$/i.test(segment) || // MongoID
    /^[0-9a-fA-F\- ]{12,}$/.test(segment.replace(/ /g, "")) // fallback: long hex with dashes/spaces
  );
}

export function Breadcrumb({ pathname }: { pathname: string | null }) {
  const segments = (pathname ?? "").split("/").filter(Boolean);

  // Only show non-UIDs, and path includes all segments up to and including that non-UID
  const breadcrumbSegments: { label: string; path: string }[] = [];
  segments.forEach((segment, idx) => {
    if (!isUID(segment)) {
      breadcrumbSegments.push({
        label:
          segment.charAt(0).toUpperCase() +
          segment.slice(1).replace(/[-_]/g, " "),
        path: "/" + segments.slice(0, idx + 1).join("/"),
      });
    }
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-neutral-600">
      {breadcrumbSegments.map((item, idx) => (
        <span key={item.path} className="flex items-center">
          {idx !== 0 && <span className="mx-1">/</span>}
          {idx === breadcrumbSegments.length - 1 ? (
            <span className="text-primary-700 font-semibold">{item.label}</span>
          ) : (
            <Link
              href={item.path || "/"}
              className="hover:underline font-medium text-gray-400"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
