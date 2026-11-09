import type { CurrencyMode } from "#lib/preferences.js";

export { cn } from "cn";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, "children">
  : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

const moneyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "GBP",
});

const signedMoneyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "GBP",
  signDisplay: "exceptZero",
});

const penceFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const signedPenceFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

/**
 * Amounts under £1 (either sign) read better in pence. Decided on the rounded
 * pence so 99.999p doesn't show as "100.00p", and zero stays as £0.00.
 */
function inPence(amount: number): boolean {
  const pence = Math.round(Math.abs(amount) * 10_000) / 100;
  return pence > 0 && pence < 100;
}

/**
 * Formats an amount as GBP in the viewer's locale: `£1,234.50`, and `12.34p`
 * under £1 unless `mode` is `"pounds"`. Components should use `useMoney()`,
 * which passes the user's preference.
 */
export function formatMoney(
  amount: number,
  mode: CurrencyMode = "pence",
): string {
  return mode === "pence" && inPence(amount)
    ? `${penceFormatter.format(amount * 100)}p`
    : moneyFormatter.format(amount);
}

/** Like `formatMoney`, but always shows the sign: `+£12.00`, `-£3.50`, `+12.34p`. */
export function formatSignedMoney(
  amount: number,
  mode: CurrencyMode = "pence",
): string {
  return mode === "pence" && inPence(amount)
    ? `${signedPenceFormatter.format(amount * 100)}p`
    : signedMoneyFormatter.format(amount);
}

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

/** Formats a fraction as a signed percentage, e.g. `0.125` → `+12.5%`. */
export function formatPercent(fraction: number): string {
  return percentFormatter.format(fraction);
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Formats a moment in the viewer's time zone: `today at 14:05`, or `6 Nov 2026, 14:05`. */
export function formatUpdatedAt(ms: number, now = Date.now()): string {
  const sameDay = new Date(ms).toDateString() === new Date(now).toDateString();
  return sameDay
    ? `today at ${timeFormatter.format(ms)}`
    : dateTimeFormatter.format(ms);
}
