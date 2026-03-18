import type { DataPoint, ForecastPoint } from "@/types";

/**
 * Fetches actual wind generation data from our proxy API.
 * @param from - Start datetime (ISO 8601)
 * @param to - End datetime (ISO 8601)
 * @returns Array of DataPoint sorted by time ascending
 * @throws Error if the API request fails
 */
export async function fetchActuals(
  from: string,
  to: string
): Promise<DataPoint[]> {
  const params = new URLSearchParams({ from, to });
  const response = await fetch(`/api/actuals?${params.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(
      body.message ?? `Failed to fetch actuals: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Fetches forecast wind generation data from our proxy API.
 * @param from - Start datetime (ISO 8601)
 * @param to - End datetime (ISO 8601)
 * @param horizon - Forecast horizon in hours (0–48, default 4)
 * @returns Array of ForecastPoint sorted by time ascending
 * @throws Error if the API request fails
 */
export async function fetchForecasts(
  from: string,
  to: string,
  horizon: number = 4
): Promise<ForecastPoint[]> {
  const params = new URLSearchParams({
    from,
    to,
    horizon: horizon.toString(),
  });
  const response = await fetch(`/api/forecasts?${params.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(
      body.message ?? `Failed to fetch forecasts: ${response.status}`
    );
  }

  return response.json();
}
