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

/** Formats an amount as GBP in the viewer's locale, e.g. `£1,234.50`. */
export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

const signedMoneyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "GBP",
  signDisplay: "exceptZero",
});

/** Like `formatMoney`, but always shows the sign, e.g. `+£12.00` / `-£3.50`. */
export function formatSignedMoney(amount: number): string {
  return signedMoneyFormatter.format(amount);
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
