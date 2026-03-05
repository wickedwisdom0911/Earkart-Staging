import { NextRequest, NextResponse } from "next/server";
import getAllConsultations from "@/actions/consultations/get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import { startOfDay, endOfDay } from "date-fns";

/**
 * GET /api/consultation-stats?year=2025
 * Returns total consultations for January and February of the given year.
 * Requires auth (cookies).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") ?? "2025", 10);

    const result = await getAllConsultations();
    const consultations = extractConsultations(result?.data ?? []);

    const getDate = (c: { createdAt?: string | null; session?: { createdAt?: string }; date?: string }) => {
      const dateStr = c.createdAt ?? c.session?.createdAt ?? c.date;
      return dateStr ? new Date(dateStr) : null;
    };

    const janStart = startOfDay(new Date(year, 0, 1)); // Jan 1
    const janEnd = endOfDay(new Date(year, 0, 31)); // Jan 31
    const febStart = startOfDay(new Date(year, 1, 1)); // Feb 1
    const febLastDay = new Date(year, 2, 0); // Last day of Feb (28 or 29)
    const febEnd = endOfDay(febLastDay);

    let janCount = 0;
    let febCount = 0;

    for (const c of consultations) {
      const d = getDate(c);
      if (!d || isNaN(d.getTime())) continue;
      if (d >= janStart && d <= janEnd) janCount++;
      else if (d >= febStart && d <= febEnd) febCount++;
    }

    return NextResponse.json({
      success: true,
      year,
      january: janCount,
      february: febCount,
      total: janCount + febCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
