import { NextRequest, NextResponse } from "next/server";
import type { ElexonFuelHHRecord, DataPoint } from "@/types";
import { getCached, setCache } from "@/lib/cache";

const ELEXON_FUELHH_URL =
  "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream";

/** Earliest allowed settlement date */
const MIN_DATE = "2025-01-01";

/**
 * Extracts the YYYY-MM-DD date portion from an ISO datetime string.
 * Falls back to the raw string if it's already a date.
 */
function toSettlementDate(isoDatetime: string): string {
  // Handle both "2025-01-08T08:00:00Z" and "2025-01-08" formats
  return isoDatetime.slice(0, 10);
}

/**
 * GET /api/actuals
 *
 * Proxies and transforms Elexon BMRS FUELHH data, filtering for WIND fuel type.
 *
 * Query params:
 *   - from (required): ISO 8601 datetime start
 *   - to   (required): ISO 8601 datetime end
 *
 * Returns: DataPoint[] sorted ascending by time
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // ── Validate query params ──────────────────────────────────
    if (!from || !to) {
      return NextResponse.json(
        {
          error: "MISSING_PARAMS",
          message:
            "Both 'from' and 'to' query parameters are required (ISO 8601 datetime).",
        },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        {
          error: "INVALID_DATES",
          message:
            "Both 'from' and 'to' must be valid ISO 8601 datetime strings.",
        },
        { status: 400 }
      );
    }

    if (fromDate >= toDate) {
      return NextResponse.json(
        { error: "INVALID_RANGE", message: "'from' must be before 'to'." },
        { status: 400 }
      );
    }

    const settlementFrom = toSettlementDate(from);
    const settlementTo = toSettlementDate(to);

    if (settlementFrom < MIN_DATE) {
      return NextResponse.json(
        {
          error: "DATE_TOO_EARLY",
          message: `'from' must be on or after ${MIN_DATE}. Received: ${settlementFrom}`,
        },
        { status: 400 }
      );
    }

    // ── Check cache ────────────────────────────────────────────
    const cacheKey = `actuals:${settlementFrom}:${settlementTo}`;
    const cached = getCached<DataPoint[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // ── Fetch from Elexon BMRS ─────────────────────────────────
    // FUELHH uses settlementDateFrom/To (YYYY-MM-DD) + fuelType filter
    const url = new URL(ELEXON_FUELHH_URL);
    url.searchParams.set("settlementDateFrom", settlementFrom);
    url.searchParams.set("settlementDateTo", settlementTo);
    url.searchParams.set("fuelType", "WIND");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "UPSTREAM_ERROR",
          message: `Elexon BMRS API returned ${response.status}: ${response.statusText}`,
        },
        { status: 502 }
      );
    }

    // FUELHH returns a flat array (not { data: [...] })
    const rawData: ElexonFuelHHRecord[] = await response.json();

    // ── Filter for WIND (belt-and-suspenders) and transform ────
    const windRecords = rawData.filter((r) => r.fuelType === "WIND");

    // Deduplicate by startTime (take latest publishTime per startTime)
    const byStartTime = new Map<string, ElexonFuelHHRecord>();
    for (const record of windRecords) {
      const existing = byStartTime.get(record.startTime);
      if (
        !existing ||
        new Date(record.publishTime) > new Date(existing.publishTime)
      ) {
        byStartTime.set(record.startTime, record);
      }
    }

    // Filter to only include records within the requested datetime range
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    const result: DataPoint[] = Array.from(byStartTime.values())
      .filter((r) => {
        const startMs = new Date(r.startTime).getTime();
        return startMs >= fromMs && startMs <= toMs;
      })
      .map((r) => ({
        time: r.startTime,
        actual: r.generation,
      }))
      .sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );

    // ── Cache and return ───────────────────────────────────────
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/actuals] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          "An unexpected error occurred while fetching actual wind generation data.",
      },
      { status: 500 }
    );
  }
}
