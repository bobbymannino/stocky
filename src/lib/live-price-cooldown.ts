/**
 * How long (in milliseconds) a live price is reused for everyone, and how long each user waits
 * between live checks of the same ticker. Keeps the price APIs' calls down.
 */
export const LIVE_PRICE_COOLDOWN = 90_000;
