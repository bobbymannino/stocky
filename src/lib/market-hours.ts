/** Shown when a live price is asked for while the markets are shut. */
export const MARKETS_CLOSED_MESSAGE =
  "Markets are closed at the weekend, so live prices can't be checked until Monday";

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
