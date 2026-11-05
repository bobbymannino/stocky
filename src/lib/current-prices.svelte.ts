const STORAGE_KEY = "stocky:current-prices";

/**
 * Today's price per share for each ticker, entered by the user.
 * Kept only in sessionStorage, so it's cleared when the tab is closed.
 */
class CurrentPrices {
  #prices = $state<Record<string, number>>({});

  get(ticker: string): number | undefined {
    return this.#prices[ticker];
  }

  set(ticker: string, price: number | undefined) {
    if (price === undefined) delete this.#prices[ticker];
    else this.#prices[ticker] = price;
    this.#save();
  }

  /** Read saved prices. Call from the browser only (e.g. in `onMount`). */
  load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return;

      const prices: Record<string, number> = {};
      for (const [ticker, price] of Object.entries(parsed)) {
        if (typeof price === "number" && Number.isFinite(price) && price >= 0)
          prices[ticker] = price;
      }
      this.#prices = prices;
    } catch {
      // storage blocked or corrupt; start empty
    }
  }

  #save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.#prices));
    } catch {
      // storage blocked; prices still work for this page view
    }
  }
}

export const currentPrices = new CurrentPrices();
