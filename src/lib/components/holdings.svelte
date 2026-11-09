<script lang="ts">
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import {
    companyColorVar,
    type CompanyColor,
    type CompanyColors,
  } from "#lib/company-colors.js";
  import CompanySwatch from "#lib/components/company-swatch.svelte";
  import NumberRoll from "#lib/components/number-roll.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import type { CurrentPrices } from "#lib/current-prices.svelte.js";
  import {
    isMarketWeekend,
    MARKETS_CLOSED_MESSAGE,
  } from "#lib/market-hours.js";
  import { useMoney } from "#lib/money.svelte.js";
  import { flipParams, rise, stagger } from "#lib/motion.js";
  import { useNow } from "#lib/now.svelte.js";
  import { purchaseCosts, type Purchase } from "#lib/purchases.js";
  import { cn, formatPercent, formatUpdatedAt } from "#lib/utils.js";

  let {
    purchases,
    colors,
    prices,
  }: {
    purchases: Purchase[];
    colors: CompanyColors;
    prices: CurrentPrices;
  } = $props();

  const money = useMoney();

  // undefined until mounted: times show in the viewer's time zone
  const now = useNow();
  // false until mounted (like `now`); the server refuses weekend fetches too
  let marketsClosed = $derived(
    now.current !== undefined && isMarketWeekend(now.current),
  );

  onMount(() => {
    for (const h of holdings) void prices.autoFetch(h.ticker);
  });

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

  /** Bumped each time a fetched price lands, so its values flash once. */
  let flashes = $state<
    Record<string, { n: number; move: "up" | "down" | "same" }>
  >({});

  /** Fetches the live price, then flashes the values it changed. Typed prices don't flash. */
  async function useCurrent(ticker: string) {
    const before = prices.get(ticker);
    await prices.fetchLive(ticker);
    const after = prices.get(ticker);
    if (prices.error(ticker) || after === undefined) return;
    const move =
      before === undefined || after === before
        ? "same"
        : after > before
          ? "up"
          : "down";
    flashes[ticker] = { n: (flashes[ticker]?.n ?? 0) + 1, move };
  }

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

{#snippet flash(ticker: string)}
  {@const f = flashes[ticker]}
  {#if f}
    <!-- keyed so each new price restarts the fade -->
    {#key f.n}
      <span
        aria-hidden="true"
        class={cn(
          "pointer-events-none absolute -inset-x-1 inset-y-0 -z-10 animate-value-flash rounded-sm",
          f.move === "up" && "bg-ctp-green/15",
          f.move === "down" && "bg-ctp-red/15",
          f.move === "same" && "bg-accent",
        )}
      ></span>
    {/key}
  {/if}
{/snippet}

{#if holdings.length === 0}
  <p class="text-sm text-muted-foreground">
    Add a purchase to see your holdings.
  </p>
{:else}
  <div class="grid gap-4 sm:grid-cols-2">
    {#each holdings as h, i (h.ticker)}
      {@const price = prices.get(h.ticker)}
      {@const fetching = prices.isFetching(h.ticker)}
      {@const priceError = prices.error(h.ticker)}
      {@const updatedAt = prices.updatedAt(h.ticker)}
      {@const cooldown =
        now.current === undefined ? 0 : prices.cooldown(h.ticker, now.current)}
      {@const value = price === undefined ? undefined : price * h.shares}
      {@const gain = value === undefined ? undefined : value - h.cost}
      <!-- tiles rise in one after another, and glide when one is removed -->
      <div
        in:rise|global={{ delay: stagger(i) }}
        animate:flip={flipParams()}
        class="relative flex flex-col gap-3 rounded-lg border bg-background p-4 shadow-tile inset-shadow-highlight transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-tile-raised has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        style:background-image={accentGradient(colors[h.ticker])}
      >
        <div class="min-w-0">
          <!-- the link stretches over the whole tile; the price controls sit above it -->
          <a
            href="/holdings/{encodeURIComponent(h.ticker)}"
            class="flex items-center gap-2 font-mono font-medium outline-none after:absolute after:inset-0 after:rounded-lg hover:underline"
          >
            <CompanySwatch color={colors[h.ticker]} />
            {h.ticker}
            <span class="sr-only">— view price history</span>
          </a>
          <p class="truncate text-sm text-muted-foreground">
            {h.companyName}
          </p>
        </div>

        <div class="relative z-10 grid gap-2">
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
              disabled={fetching || cooldown > 0 || marketsClosed}
              title={marketsClosed ? MARKETS_CLOSED_MESSAGE : undefined}
              onclick={() => useCurrent(h.ticker)}
            >
              {#if fetching}
                <LoaderCircleIcon class="animate-spin" />
              {:else}
                <RefreshCwIcon />
              {/if}
              {marketsClosed
                ? "Markets closed"
                : cooldown > 0
                  ? `Again in ${Math.ceil(cooldown / 1000)}s`
                  : "Use current"}
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
            {#if !priceError && now.current !== undefined && updatedAt !== undefined && prices.source(h.ticker) !== "manual"}
              · updated
              <time datetime={new Date(updatedAt).toISOString()}>
                {formatUpdatedAt(updatedAt, now.current)}
              </time>
            {/if}
          </p>
        </div>

        <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt class="text-muted-foreground">Shares</dt>
          <dd class="text-right tabular-nums">{h.shares}</dd>
          <dt class="text-muted-foreground">Avg. share price</dt>
          <dd class="text-right tabular-nums">
            {money.format(h.spent / h.shares)}
          </dd>
          <dt class="text-muted-foreground">Cost (inc. tax)</dt>
          <dd class="text-right tabular-nums">{money.format(h.cost)}</dd>
          <dt class="text-muted-foreground">Value</dt>
          <dd class="relative isolate text-right tabular-nums">
            {@render flash(h.ticker)}
            <NumberRoll
              value={value === undefined ? "—" : money.format(value)}
            />
          </dd>
          <dt class="font-medium">Gain / loss</dt>
          <dd
            class={cn(
              "relative isolate text-right font-medium tabular-nums",
              gain !== undefined && gain > 0 && "text-ctp-green",
              gain !== undefined && gain < 0 && "text-ctp-red",
            )}
          >
            {@render flash(h.ticker)}
            {#if gain === undefined}
              —
            {:else}
              <NumberRoll value={money.signed(gain)} />
              <span class="text-xs">
                <NumberRoll value="({formatPercent(gain / h.cost)})" />
              </span>
            {/if}
          </dd>
        </dl>
      </div>
    {/each}
  </div>
{/if}
