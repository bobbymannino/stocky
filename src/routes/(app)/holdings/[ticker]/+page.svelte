<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import { onMount } from "svelte";
  import { companyColorVar } from "#lib/company-colors.js";
  import CompanySwatch from "#lib/components/company-swatch.svelte";
  import PriceChart from "#lib/components/price-chart.svelte";
  import PurchasesTable from "#lib/components/purchases-table.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { CurrentPrices } from "#lib/current-prices.svelte.js";
  import { useNow } from "#lib/now.svelte.js";
  import { purchaseCosts } from "#lib/purchases.js";
  import {
    cn,
    formatMoney,
    formatPercent,
    formatSignedMoney,
    formatUpdatedAt,
  } from "#lib/utils.js";
  import { refreshAll } from "$app/navigation";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // one per page view: prices are per-user, so this must not be module state
  // svelte-ignore state_referenced_locally
  const prices = new CurrentPrices(data.prices);

  let color = $derived(companyColorVar(data.colors[data.ticker]));
  let price = $derived(prices.get(data.ticker));
  let fetching = $derived(prices.isFetching(data.ticker));
  let priceError = $derived(prices.error(data.ticker));
  let source = $derived(prices.source(data.ticker));
  let updatedAt = $derived(prices.updatedAt(data.ticker));

  // undefined until mounted: times show in the viewer's time zone
  const now = useNow();

  onMount(async () => {
    // a fresh fetch adds a point to the shared history, so redraw the chart
    if (await prices.autoFetch(data.ticker)) await refreshAll();
  });
  let cooldown = $derived(
    now.current === undefined ? 0 : prices.cooldown(data.ticker, now.current),
  );

  let totals = $derived.by(() => {
    let shares = 0;
    let cost = 0;
    for (const p of data.purchases) {
      const c = purchaseCosts(p);
      shares += c.shares;
      cost += c.totalIncTax;
    }
    const value = price === undefined ? undefined : price * shares;
    return {
      shares,
      cost,
      value,
      gain: value === undefined ? undefined : value - cost,
    };
  });

  let buys = $derived(
    data.purchases.map((p) => {
      const c = purchaseCosts(p);
      // bought dates have no time; place them at midday so they sit in their day
      const t = new Date(`${p.boughtAt}T12:00:00`).getTime();
      return { t, price: c.price, shares: c.shares };
    }),
  );

  async function useCurrent() {
    await prices.fetchLive(data.ticker);
    // the fetch adds a point to the shared history, so redraw the chart
    if (!prices.error(data.ticker)) await refreshAll();
  }

  const historyDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
  <div>
    <Button href="/" variant="ghost" size="sm" class="-ml-2.5">
      <ArrowLeftIcon />
      Back to portfolio
    </Button>
  </div>

  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
      <h1 class="flex items-center gap-2 font-mono text-2xl font-semibold">
        <CompanySwatch color={data.colors[data.ticker]} class="size-3" />
        {data.ticker}
      </h1>
      {#if data.companyName}
        <p class="truncate text-sm text-muted-foreground">
          {data.companyName}
        </p>
      {/if}
    </div>
    <div class="flex flex-col items-end gap-1">
      <div class="flex items-center gap-3">
        <p class="text-3xl font-semibold">
          {price === undefined ? "—" : formatMoney(price)}
        </p>
        <Button
          variant="outline"
          disabled={fetching || cooldown > 0}
          onclick={useCurrent}
        >
          {#if fetching}
            <LoaderCircleIcon class="animate-spin" />
          {:else}
            <RefreshCwIcon />
          {/if}
          {cooldown > 0
            ? `Again in ${Math.ceil(cooldown / 1000)}s`
            : "Use current"}
        </Button>
      </div>
      <p
        class={cn(
          "text-xs",
          priceError ? "text-destructive" : "text-muted-foreground",
        )}
        aria-live="polite"
      >
        {#if priceError}
          {priceError}
        {:else if source === "finnhub" || source === "yahoo"}
          Live price from {source === "finnhub" ? "Finnhub" : "Yahoo Finance"}
          {#if now.current !== undefined && updatedAt !== undefined}
            · updated
            <time datetime={new Date(updatedAt).toISOString()}>
              {formatUpdatedAt(updatedAt, now.current)}
            </time>
          {/if}
        {:else}
          Your current price per share
        {/if}
      </p>
    </div>
  </header>

  <!-- stats only mean something once you hold the company -->
  {#if data.purchases.length > 0}
    <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {#each [{ label: "Shares", value: String(totals.shares) }, { label: "Cost (inc. tax)", value: formatMoney(totals.cost) }, { label: "Value", value: totals.value === undefined ? "—" : formatMoney(totals.value) }] as stat (stat.label)}
        <div
          class="rounded-lg border bg-card p-4 shadow-tile inset-shadow-highlight"
        >
          <dt class="text-xs text-muted-foreground">{stat.label}</dt>
          <dd class="text-lg font-semibold">{stat.value}</dd>
        </div>
      {/each}
      <div
        class="rounded-lg border bg-card p-4 shadow-tile inset-shadow-highlight"
      >
        <dt class="text-xs text-muted-foreground">Gain / loss</dt>
        <dd
          class={cn(
            "text-lg font-semibold",
            totals.gain !== undefined && totals.gain > 0 && "text-ctp-green",
            totals.gain !== undefined && totals.gain < 0 && "text-ctp-red",
          )}
        >
          {#if totals.gain === undefined}
            —
          {:else}
            {formatSignedMoney(totals.gain)}
            <span class="text-xs"
              >({formatPercent(totals.gain / totals.cost)})</span
            >
          {/if}
        </dd>
      </div>
    </dl>
  {/if}

  <Card.Root>
    <Card.Header>
      <Card.Title>Price history</Card.Title>
      <Card.Description>
        Live prices in GBP, recorded when anyone uses “Use current” for
        {data.ticker}, with the price you paid for each purchase.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      {#if data.history.length === 0}
        <p class="text-sm text-muted-foreground">
          No live prices recorded yet. Use “Use current” to add the first one.
        </p>
      {/if}
      <!-- a company nobody has fetched or bought has nothing to plot -->
      {#if data.history.length > 0 || buys.length > 0}
        <PriceChart
          history={data.history}
          {buys}
          {color}
          label="{data.ticker} price over time, with your purchases"
        />
      {/if}

      {#if data.history.length > 0}
        <details class="text-sm">
          <summary class="cursor-pointer text-muted-foreground">
            Show prices as a table
          </summary>
          <div class="mt-2 max-h-72 overflow-y-auto">
            <table class="w-full">
              <thead
                class="sticky top-0 bg-card text-left text-muted-foreground"
              >
                <tr>
                  <th class="py-1 font-medium">Recorded</th>
                  <th class="py-1 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {#each data.history.toReversed() as h, i (i)}
                  <tr class="border-t">
                    <td class="py-1">{historyDate.format(h.t)}</td>
                    <td class="py-1 text-right tabular-nums">
                      {formatMoney(h.price)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </details>
      {/if}
    </Card.Content>
  </Card.Root>

  <section aria-labelledby="purchases-heading" class="flex flex-col gap-4">
    <h2 id="purchases-heading" class="text-lg font-semibold">
      Your {data.ticker} purchases
    </h2>
    {#if data.purchases.length === 0}
      <p class="text-sm text-muted-foreground">
        You haven't bought any {data.ticker} yet.
        <a
          href="/purchases/new?ticker={encodeURIComponent(data.ticker)}"
          class="underline underline-offset-4"
        >
          Add a purchase
        </a>
      </p>
    {:else}
      <PurchasesTable
        purchases={data.purchases}
        colors={data.colors}
        {prices}
        filterable={false}
        linkTickers={false}
      />
    {/if}
  </section>
</div>
