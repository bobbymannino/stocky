<script lang="ts">
  import {
    companyColorVar,
    type CompanyColor,
    type CompanyColors,
  } from "#lib/company-colors.js";
  import CompanySwatch from "#lib/components/company-swatch.svelte";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import { currentPrices } from "#lib/current-prices.svelte.js";
  import { purchaseCosts, type Purchase } from "#lib/purchases.js";
  import {
    cn,
    formatMoney,
    formatPercent,
    formatSignedMoney,
  } from "#lib/utils.js";

  let { purchases, colors }: { purchases: Purchase[]; colors: CompanyColors } =
    $props();

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
    currentPrices.set(
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
      {@const price = currentPrices.get(h.ticker)}
      {@const value = price === undefined ? undefined : price * h.shares}
      {@const gain = value === undefined ? undefined : value - h.cost}
      <div
        class="flex flex-col gap-3 rounded-lg border p-4"
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
          <Input
            id="price-{h.ticker}"
            type="number"
            inputmode="decimal"
            min="0"
            step="any"
            placeholder="0.00"
            value={price ?? ""}
            oninput={(e) => onPriceInput(h.ticker, e)}
          />
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
