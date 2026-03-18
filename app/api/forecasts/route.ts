import { NextRequest, NextResponse } from "next/server";
import type { ElexonWindForRecord, ForecastPoint } from "@/types";
import { getCached, setCache } from "@/lib/cache";

const ELEXON_WINDFOR_URL =
  "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream";

/** January 1, 2025 as the earliest allowed startTime */
const JAN_2025_EPOCH = new Date("2025-01-01T00:00:00Z").getTime();

/** Maximum allowed forecast horizon in hours (0–72) */
const MAX_HORIZON_HOURS = 72;

/**
 * GET /api/forecasts
 *
 * Proxies and transforms Elexon BMRS WINDFOR data with critical horizon filtering.
 *
 * Query params:
 *   - from    (required): ISO 8601 datetime start
 *   - to      (required): ISO 8601 datetime end
 *   - horizon (optional): Integer hours (0–48, default 4).
 *                         For each startTime, selects the LATEST publishTime
 *                         such that (startTime - publishTime) >= horizon hours.
 *
 * Returns: ForecastPoint[] sorted ascending by time
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const horizonStr = searchParams.get("horizon");

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

    const horizon = horizonStr ? parseInt(horizonStr, 10) : 4;
    if (isNaN(horizon) || horizon < 0 || horizon > MAX_HORIZON_HOURS) {
      return NextResponse.json(
        {
          error: "INVALID_HORIZON",
          message: `'horizon' must be an integer between 0 and ${MAX_HORIZON_HOURS}.`,
        },
        { status: 400 }
      );
    }

    // ── Check cache ────────────────────────────────────────────
    const cacheKey = `forecasts:${from}:${to}:${horizon}`;
    const cached = getCached<ForecastPoint[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // ── Fetch from Elexon BMRS ─────────────────────────────────
    // We need forecasts that were PUBLISHED before the target times,
    // so we fetch a wider publishTime range to capture older forecasts.
    // We offset the from by (horizon + buffer) hours to get qualifying forecasts.
    const publishFrom = new Date(
      fromDate.getTime() - (horizon + 48) * 60 * 60 * 1000
    );

    const url = new URL(ELEXON_WINDFOR_URL);
    url.searchParams.set("publishDateTimeFrom", publishFrom.toISOString());
    url.searchParams.set("publishDateTimeTo", to);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
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

    const rawData: ElexonWindForRecord[] = await response.json();

    // ── Apply filters ──────────────────────────────────────────
    const horizonMs = horizon * 60 * 60 * 1000;
    const maxLeadMs = MAX_HORIZON_HOURS * 60 * 60 * 1000;
    const fromMs = fromDate.getTime();
    const toMs = toDate.getTime();

    // Step 1: Filter to startTime >= Jan 2025 and within requested range
    // Step 2: Filter forecast_horizon (startTime - publishTime) between 0–48 hours
    const filtered = rawData.filter((r) => {
      const startMs = new Date(r.startTime).getTime();
      const publishMs = new Date(r.publishTime).getTime();
      const leadTimeMs = startMs - publishMs;

      return (
        startMs >= JAN_2025_EPOCH &&
        startMs >= fromMs &&
        startMs <= toMs &&
        leadTimeMs >= 0 &&
        leadTimeMs <= maxLeadMs
      );
    });

    // Step 3: Group by startTime
    const byStartTime = new Map<string, ElexonWindForRecord[]>();
    for (const record of filtered) {
      const group = byStartTime.get(record.startTime) ?? [];
      group.push(record);
      byStartTime.set(record.startTime, group);
    }

    // Step 4: For each startTime group, apply the horizon filter:
    //   - Only keep records where (startTime - publishTime) >= horizon hours
    //   - Pick the LATEST publishTime from those (most recent qualifying forecast)
    //   - If no record qualifies → omit this startTime entirely
    const result: ForecastPoint[] = [];

    const startTimeKeys = Array.from(byStartTime.keys());
    for (const startTime of startTimeKeys) {
      const records = byStartTime.get(startTime)!;
      const startMs = new Date(startTime).getTime();

      // Filter to only forecasts published at least `horizon` hours before startTime
      const qualifying = records.filter((r) => {
        const publishMs = new Date(r.publishTime).getTime();
        return startMs - publishMs >= horizonMs;
      });

      if (qualifying.length === 0) continue; // No qualifying forecast → omit

      // Pick the latest publishTime among qualifying forecasts
      qualifying.sort(
        (a, b) =>
          new Date(b.publishTime).getTime() -
          new Date(a.publishTime).getTime()
      );

      const best = qualifying[0];
      const bestPublishMs = new Date(best.publishTime).getTime();
      result.push({
        time: best.startTime,
        forecast: best.generation,
        publishTime: best.publishTime,
        horizonHours: (startMs - bestPublishMs) / 3_600_000,
      });
    }

    // Sort ascending by time
    result.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // ── Cache and return ───────────────────────────────────────
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/forecasts] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          "An unexpected error occurred while fetching wind forecast data.",
      },
      { status: 500 }
    );
  }
}
