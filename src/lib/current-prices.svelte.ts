import { LIVE_PRICE_COOLDOWN } from "#lib/live-price-cooldown.js";
import {
  refreshCurrentPrice,
  setCurrentPrice,
} from "#lib/remote/prices.remote.js";

export type PriceSource = "manual" | "finnhub" | "yahoo";

/** A saved price per share in GBP, with when it was last set (epoch ms). */
export type SavedPrice = {
  price: number;
  source: PriceSource;
  updatedAt: number;
};

/** Ticker → saved price, as sent from the server. */
export type SavedPrices = Record<string, SavedPrice>;

/** How long to wait after the user stops typing before saving their price. */
const SAVE_DELAY = 600;

/**
 * Today's price per share for each ticker, saved to the user's account.
 * Create one per page from the server's prices (it's per-user, so never share
 * an instance between requests).
 */
export class CurrentPrices {
  #prices = $state<SavedPrices>({});
  /** Tickers currently fetching a live price. */
  #fetching = $state<Record<string, boolean>>({});
  /** The last problem saving or fetching each ticker's price. */
  #errors = $state<Record<string, string>>({});
  #timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(initial: SavedPrices) {
    this.#prices = initial;
  }

  get(ticker: string): number | undefined {
    return this.#prices[ticker]?.price;
  }

  source(ticker: string): PriceSource | undefined {
    return this.#prices[ticker]?.source;
  }

  /** When the price was last set, in epoch ms. */
  updatedAt(ticker: string): number | undefined {
    return this.#prices[ticker]?.updatedAt;
  }

  /**
   * How many ms until the user can check this ticker's live price again (one
   * check a minute), or 0 if they can now.
   */
  cooldown(ticker: string, now: number): number {
    const saved = this.#prices[ticker];
    if (!saved || saved.source === "manual") return 0;
    return Math.max(0, saved.updatedAt + LIVE_PRICE_COOLDOWN - now);
  }

  isFetching(ticker: string): boolean {
    return this.#fetching[ticker] ?? false;
  }

  error(ticker: string): string | undefined {
    return this.#errors[ticker];
  }

  /** A price the user typed in. Shown straight away, saved once they pause. */
  set(ticker: string, price: number | undefined) {
    if (price === undefined) delete this.#prices[ticker];
    else
      this.#prices[ticker] = { price, source: "manual", updatedAt: Date.now() };
    delete this.#errors[ticker];

    clearTimeout(this.#timers.get(ticker));
    this.#timers.set(
      ticker,
      setTimeout(() => {
        this.#timers.delete(ticker);
        setCurrentPrice({ ticker, price: price ?? null }).catch(() => {
          this.#errors[ticker] = "Couldn't save this price. Please try again.";
        });
      }, SAVE_DELAY),
    );
  }

  /** Replaces the price with the live one (Finnhub, or Yahoo for London). */
  async fetchLive(ticker: string) {
    // a pending typed price would otherwise overwrite the live one when it saves
    clearTimeout(this.#timers.get(ticker));
    this.#timers.delete(ticker);
    this.#fetching[ticker] = true;
    delete this.#errors[ticker];
    try {
      this.#prices[ticker] = await refreshCurrentPrice(ticker);
    } catch (e) {
      this.#errors[ticker] = errorMessage(e);
    } finally {
      this.#fetching[ticker] = false;
    }
  }

  /**
   * Fetches the live price on page load, unless it's still in its cooldown or
   * the user typed their own price (which this would overwrite). Failures stay
   * quiet, since the user didn't ask. Resolves whether a new price arrived.
   */
  async autoFetch(ticker: string): Promise<boolean> {
    if (this.source(ticker) === "manual") return false;
    if (this.cooldown(ticker, Date.now()) > 0) return false;
    if (this.isFetching(ticker)) return false;
    await this.fetchLive(ticker);
    if (!this.#errors[ticker]) return true;
    delete this.#errors[ticker];
    return false;
  }
}

function errorMessage(e: unknown): string {
  // errors thrown with `error()` on the server arrive with a `body.message`
  const message = (e as { body?: { message?: unknown } })?.body?.message;
  return typeof message === "string"
    ? message
    : "Couldn't get the latest price. Please try again.";
}
