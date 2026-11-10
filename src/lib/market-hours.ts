/** Shown when a live price is asked for while the markets are shut. */
export const MARKETS_CLOSED_MESSAGE =
  "Markets are closed at the weekend, so this live price can't change until Monday";

/**
 * Whether a ticker's live price can't be checked now: it's the weekend and
 * the user already has a live price, which can't have moved since. Without one
 * (nothing saved, or only a typed price) one check is allowed, so nobody
 * waits until Monday for their first price.
 */
export function isClosedFor(
  source: string | undefined,
  now: number | Date = Date.now(),
): boolean {
  return (source === "finnhub" || source === "yahoo") && isMarketWeekend(now);
}

const weekday = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "Europe/London",
});

/**
 * Whether it's Saturday or Sunday in London. That covers both London and New
 * York: New York closes before London's Saturday starts and opens after
 * London's Monday begins.
 */
export function isMarketWeekend(now: number | Date = Date.now()): boolean {
  const day = weekday.format(now);
  return day === "Sat" || day === "Sun";
}
