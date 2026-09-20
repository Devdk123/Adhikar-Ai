/**
 * Simple in-memory rate limiter for API routes.
 * Not suitable for multi-instance deployments — use Redis-backed solution for that.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited.
 * @returns `null` if allowed, or `{ retryAfter: number }` if blocked
 */
export function rateLimit(
  key: string,
  { maxRequests = 20, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {}
): { retryAfter: number } | null {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { retryAfter };
  }

  return null;
}

/**
 * Extract a rate limit key from request (IP-based).
 */
export function getRateLimitKey(req: Request, prefix: string): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:${ip}`;
}
