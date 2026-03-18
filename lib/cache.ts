/**
 * Simple in-memory TTL cache for API responses.
 * Prevents hammering the external Elexon BMRS API with repeated identical requests.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Default TTL in milliseconds (5 minutes) */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Retrieves a cached value if it exists and hasn't expired.
 * @param key - Cache key (typically derived from request params)
 * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
 * @returns The cached data or undefined if not found/expired
 */
export function getCached<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  const age = Date.now() - entry.timestamp;
  if (age > ttlMs) {
    cache.delete(key);
    return undefined;
  }

  return entry.data as T;
}

/**
 * Stores a value in the cache with a timestamp.
 * @param key - Cache key
 * @param data - Data to cache
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}
