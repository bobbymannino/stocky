<script lang="ts">
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import {
    companyColorVar,
    type CompanyColor,
    type CompanyColors,
  } from "#lib/company-colors.js";
  import CompanySwatch from "#lib/components/company-swatch.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import type { CurrentPrices } from "#lib/current-prices.svelte.js";
  import { purchaseCosts, type Purchase } from "#lib/purchases.js";
  import {
    cn,
    formatMoney,
    formatPercent,
    formatSignedMoney,
  } from "#lib/utils.js";

  let {
    purchases,
    colors,
    prices,
  }: {
    purchases: Purchase[];
    colors: CompanyColors;
    prices: CurrentPrices;
  } = $props();

  /** A faint wash of the company colour, strongest at the bottom of the card. */
  function accentGradient(color: CompanyColor | undefined) {
    const tint = `color-mix(in oklab, ${companyColorVar(color)} 20%, transparent)`;
    return `linear-gradient(to top, ${tint}, transparent)`;
  }

  let holdings = $derived.by(() => {
    const byTicker = new Map<
      string,
      {
        ticker: string;
        companyName: string;
        shares: number;
        /** total paid excluding tax, for the average share price */
        spent: number;
        /** total paid including tax */
        cost: number;
      }
    >();
    // purchases are newest first, so the first name seen is the latest
    for (const p of purchases) {
      const { shares, total, totalIncTax } = purchaseCosts(p);
      const h = byTicker.get(p.ticker);
      if (h) {
        h.shares += shares;
        h.spent += total;
        h.cost += totalIncTax;
      } else {
        byTicker.set(p.ticker, {
          ticker: p.ticker,
          companyName: p.companyName,
          shares,
          spent: total,
          cost: totalIncTax,
        });
      }
    }
    return [...byTicker.values()].toSorted((a, b) =>
      a.ticker.localeCompare(b.ticker),
    );
  });

  function onPriceInput(ticker: string, e: Event) {
    const raw = (e.currentTarget as HTMLInputElement).value;
    const price = raw === "" ? undefined : Number(raw);
    prices.set(
      ticker,
      price !== undefined && Number.isFinite(price) && price >= 0
        ? price
        : undefined,
    );
  }
</script>

{#if holdings.length === 0}
  <p class="text-sm text-muted-foreground">
    Add a purchase to see your holdings.
  </p>
{:else}
  <div class="grid gap-4 sm:grid-cols-2">
    {#each holdings as h (h.ticker)}
      {@const price = prices.get(h.ticker)}
      {@const fetching = prices.isFetching(h.ticker)}
      {@const priceError = prices.error(h.ticker)}
      {@const value = price === undefined ? undefined : price * h.shares}
      {@const gain = value === undefined ? undefined : value - h.cost}
      <div
        class="flex flex-col gap-3 rounded-lg border bg-background p-4 shadow-tile inset-shadow-highlight transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-tile-raised motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        style:background-image={accentGradient(colors[h.ticker])}
      >
        <div class="min-w-0">
          <p class="flex items-center gap-2 font-mono font-medium">
            <CompanySwatch color={colors[h.ticker]} />
            {h.ticker}
          </p>
          <p class="truncate text-sm text-muted-foreground">
            {h.companyName}
          </p>
        </div>

        <div class="grid gap-2">
          <Label for="price-{h.ticker}">Today's price (1 share)</Label>
          <div class="flex gap-2">
            <Input
              id="price-{h.ticker}"
              type="number"
              inputmode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={price ?? ""}
              oninput={(e) => onPriceInput(h.ticker, e)}
              aria-describedby="price-note-{h.ticker}"
            />
            <Button
              type="button"
              variant="outline"
              disabled={fetching}
              onclick={() => prices.fetchLive(h.ticker)}
            >
              {#if fetching}
                <LoaderCircleIcon class="animate-spin" />
              {:else}
                <RefreshCwIcon />
              {/if}
              Use current
            </Button>
          </div>
          <p
            id="price-note-{h.ticker}"
            class={cn(
              "text-xs",
              priceError ? "text-destructive" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {#if priceError}
              {priceError}
            {:else if prices.source(h.ticker) === "finnhub"}
              Latest price from Finnhub, in GBP
            {:else if prices.source(h.ticker) === "yahoo"}
              Latest price from Yahoo Finance, in GBP
            {/if}
          </p>
        </div>

        <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt class="text-muted-foreground">Shares</dt>
          <dd class="text-right tabular-nums">{h.shares}</dd>
          <dt class="text-muted-foreground">Avg. share price</dt>
          <dd class="text-right tabular-nums">
            {formatMoney(h.spent / h.shares)}
          </dd>
          <dt class="text-muted-foreground">Cost (inc. tax)</dt>
          <dd class="text-right tabular-nums">{formatMoney(h.cost)}</dd>
          <dt class="text-muted-foreground">Value</dt>
          <dd class="text-right tabular-nums">
            {value === undefined ? "—" : formatMoney(value)}
          </dd>
          <dt class="font-medium">Gain / loss</dt>
          <dd
            class={cn(
              "text-right font-medium tabular-nums",
              gain !== undefined && gain > 0 && "text-ctp-green",
              gain !== undefined && gain < 0 && "text-ctp-red",
            )}
          >
            {#if gain === undefined}
              —
            {:else}
              {formatSignedMoney(gain)}
              <span class="text-xs">({formatPercent(gain / h.cost)})</span>
            {/if}
          </dd>
        </dl>
      </div>
    {/each}
  </div>
{/if}
