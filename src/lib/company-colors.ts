/**
 * Accent colours a company can be given. These are Catppuccin palette names,
 * so they adapt to light/dark mode. Anything that reads as red or green
 * (red, maroon, rosewater, flamingo, green, teal) is left out so it's never
 * confused with gains and losses.
 */
export const COMPANY_COLORS = [
  "pink",
  "mauve",
  "peach",
  "yellow",
  "sky",
  "sapphire",
  "blue",
  "lavender",
] as const;

export type CompanyColor = (typeof COMPANY_COLORS)[number];

/** Ticker → accent colour for the signed-in user's companies. */
export type CompanyColors = Record<string, CompanyColor>;

export function randomCompanyColor(): CompanyColor {
  return COMPANY_COLORS[Math.floor(Math.random() * COMPANY_COLORS.length)];
}

/** CSS colour value for a company, with a neutral fallback if it has none yet. */
export function companyColorVar(color: CompanyColor | undefined): string {
  return color ? `var(--color-ctp-${color})` : "var(--color-muted-foreground)";
}
