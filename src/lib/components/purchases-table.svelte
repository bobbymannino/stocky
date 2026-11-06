<script lang="ts">
  import TrashIcon from "@lucide/svelte/icons/trash";
  import { companyColorVar, type CompanyColors } from "#lib/company-colors.js";
  import CompanySwatch from "#lib/components/company-swatch.svelte";
  import * as AlertDialog from "#lib/components/ui/alert-dialog/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import type { CurrentPrices } from "#lib/current-prices.svelte.js";
  import { purchaseCosts, type Purchase } from "#lib/purchases.js";
  import { deletePurchase } from "#lib/remote/purchases.remote.js";
  import {
    cn,
    formatMoney,
    formatPercent,
    formatSignedMoney,
  } from "#lib/utils.js";
  import { refreshAll } from "$app/navigation";

  let {
    purchases,
    colors,
    prices,
  }: {
    purchases: Purchase[];
    colors: CompanyColors;
    prices: CurrentPrices;
  } = $props();

  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

  let rows = $derived(
    purchases.map((p) =>
      Object.assign(purchaseCosts(p), {
        id: p.id,
        ticker: p.ticker,
        companyName: p.companyName,
        boughtOn: date.format(new Date(p.boughtAt)),
      }),
    ),
  );

  /** Value at today's price, or undefined if no price has been entered. */
  function currentValue(row: Row) {
    const price = prices.get(row.ticker);
    return price === undefined ? undefined : price * row.shares;
  }

  type Row = (typeof rows)[number];

  /** A wash across the row's card: green if it's up, red if down, none without a price. */
  function rowTint(row: Row) {
    const value = currentValue(row);
    if (value === undefined || value === row.totalIncTax) return "";
    return cn(
      "bg-linear-to-r to-transparent",
      value > row.totalIncTax ? "from-ctp-green/10" : "from-ctp-red/10",
    );
  }

  /** Each purchase sits on its own raised card, matching the holding tiles. */
  const rowCard =
    "rounded-lg border border-l-4 bg-card shadow-tile inset-shadow-highlight transition-shadow hover:shadow-tile-raised";

  const ALL = "all";
  let tickerFilter = $state(ALL);

  /** Unique tickers with their latest company name, A–Z. */
  let tickers = $derived(
    [...new Map(rows.toReversed().map((r) => [r.ticker, r.companyName]))]
      .map(([ticker, companyName]) => ({ ticker, companyName }))
      .toSorted((a, b) => a.ticker.localeCompare(b.ticker)),
  );

  // falls back to all if the selected ticker no longer exists (e.g. deleted)
  let activeTicker = $derived(
    tickers.some((t) => t.ticker === tickerFilter) ? tickerFilter : ALL,
  );

  let visibleRows = $derived(
    activeTicker === ALL ? rows : rows.filter((r) => r.ticker === activeTicker),
  );

  let pendingDelete = $state<Row>();
  let dialogOpen = $state(false);
  let deleting = $state(false);
  let deleteError = $state<string>();

  function askToDelete(row: Row) {
    pendingDelete = row;
    deleteError = undefined;
    dialogOpen = true;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    deleting = true;
    deleteError = undefined;
    try {
      await deletePurchase(pendingDelete.id);
      await refreshAll();
      dialogOpen = false;
    } catch {
      deleteError = "Couldn't delete this purchase. Please try again.";
    } finally {
      deleting = false;
    }
  }
</script>

{#snippet valueText(row: Row)}
  {@const value = currentValue(row)}
  <span
    class={cn(
      "tabular-nums",
      value !== undefined && value > row.totalIncTax && "text-ctp-green",
      value !== undefined && value < row.totalIncTax && "text-ctp-red",
    )}
  >
    {value === undefined ? "—" : formatMoney(value)}
  </span>
{/snippet}

{#snippet diffText(row: Row)}
  {@const value = currentValue(row)}
  {@const diff = value === undefined ? undefined : value - row.totalIncTax}
  <span
    class={cn(
      "tabular-nums",
      diff !== undefined && diff > 0 && "text-ctp-green",
      diff !== undefined && diff < 0 && "text-ctp-red",
    )}
  >
    {#if diff === undefined}
      —
    {:else}
      {formatSignedMoney(diff)}
      <span class="text-xs">({formatPercent(diff / row.totalIncTax)})</span>
    {/if}
  </span>
{/snippet}

{#snippet deleteButton(row: Row)}
  <Button
    variant="destructive"
    size="icon-sm"
    aria-label="Delete {row.ticker} purchase from {row.boughtOn}"
    onclick={() => askToDelete(row)}
  >
    <TrashIcon />
  </Button>
{/snippet}

{#if rows.length === 0}
  <p class="text-sm text-muted-foreground">No purchases yet.</p>
{:else}
  <div class="mb-4 flex items-center gap-2">
    <Select.Root type="single" bind:value={tickerFilter}>
      <Select.Trigger class="w-full sm:w-56" aria-label="Filter by ticker">
        {activeTicker === ALL ? "All tickers" : activeTicker}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value={ALL} label="All tickers">All tickers</Select.Item>
        {#each tickers as t (t.ticker)}
          <Select.Item value={t.ticker} label={t.ticker}>
            <CompanySwatch color={colors[t.ticker]} />
            <span class="font-mono">{t.ticker}</span>
            <span class="truncate text-muted-foreground">{t.companyName}</span>
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if activeTicker !== ALL}
      <Button variant="ghost" size="sm" onclick={() => (tickerFilter = ALL)}>
        Clear
      </Button>
    {/if}
  </div>

  <!-- Mobile: stacked cards -->
  <ul class="flex flex-col gap-3 md:hidden">
    {#each visibleRows as p (p.id)}
      <li
        class={cn("flex flex-col gap-2 p-3", rowCard, rowTint(p))}
        style:border-left-color={companyColorVar(colors[p.ticker])}
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="flex items-center gap-2 font-mono font-medium">
              <CompanySwatch color={colors[p.ticker]} />
              {p.ticker}
            </p>
            <p class="truncate text-sm text-muted-foreground">
              {p.companyName}
            </p>
          </div>
          <div class="flex items-start gap-2">
            <div class="text-right">
              <p class="font-medium tabular-nums">
                {formatMoney(p.totalIncTax)}
              </p>
              <p class="text-xs text-muted-foreground">inc. tax</p>
            </div>
            {@render deleteButton(p)}
          </div>
        </div>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt class="text-muted-foreground">Bought</dt>
          <dd class="text-right">{p.boughtOn}</dd>
          <dt class="text-muted-foreground">Shares</dt>
          <dd class="text-right tabular-nums">
            {p.shares} × {formatMoney(p.price)}
          </dd>
          <dt class="text-muted-foreground">Total</dt>
          <dd class="text-right tabular-nums">{formatMoney(p.total)}</dd>
          <dt class="text-muted-foreground">Tax (0.5%)</dt>
          <dd class="text-right tabular-nums">{formatMoney(p.tax)}</dd>
          <dt class="text-muted-foreground">Current value</dt>
          <dd class="text-right">{@render valueText(p)}</dd>
          <dt class="text-muted-foreground">Gain / loss</dt>
          <dd class="text-right">{@render diffText(p)}</dd>
        </dl>
      </li>
    {/each}
  </ul>

  <!-- Desktop: a table whose rows are separate cards. Rows are subgrids of
       one grid so the columns still line up; ARIA roles keep it a table. -->
  <!-- padding stops the overflow container from clipping the row shadows -->
  <div class="-mx-2 hidden overflow-x-auto px-2 pb-3 md:block">
    <div
      role="table"
      aria-label="Your purchases"
      class="grid grid-cols-[repeat(11,auto)] gap-y-2 text-sm whitespace-nowrap"
    >
      <div role="rowgroup" class="contents">
        <div
          role="row"
          class="col-span-full grid grid-cols-subgrid border-l-4 border-transparent px-4 pb-1 text-left font-medium text-muted-foreground *:pr-4 *:last:pr-0"
        >
          <span role="columnheader">Bought</span>
          <span role="columnheader">Ticker</span>
          <span role="columnheader">Company</span>
          <span role="columnheader" class="text-right">Price</span>
          <span role="columnheader" class="text-right">Shares</span>
          <span role="columnheader" class="text-right">Total</span>
          <span role="columnheader" class="text-right">Tax (0.5%)</span>
          <span role="columnheader" class="text-right">Total (inc. tax)</span>
          <span role="columnheader" class="text-right">Current value</span>
          <span role="columnheader" class="text-right">Gain / loss</span>
          <span role="columnheader"><span class="sr-only">Actions</span></span>
        </div>
      </div>
      <div role="rowgroup" class="contents">
        {#each visibleRows as p (p.id)}
          <div
            role="row"
            class={cn(
              "col-span-full grid grid-cols-subgrid items-center py-2 pr-2 pl-4 *:pr-4 *:last:pr-0",
              rowCard,
              rowTint(p),
            )}
            style:border-left-color={companyColorVar(colors[p.ticker])}
          >
            <span role="cell">{p.boughtOn}</span>
            <span role="cell" class="font-mono">
              <span class="inline-flex items-center gap-2">
                <CompanySwatch color={colors[p.ticker]} />
                {p.ticker}
              </span>
            </span>
            <span role="cell" class="max-w-48 truncate" title={p.companyName}>
              {p.companyName}
            </span>
            <span role="cell" class="text-right tabular-nums">
              {formatMoney(p.price)}
            </span>
            <span role="cell" class="text-right tabular-nums">{p.shares}</span>
            <span
              role="cell"
              class="text-right text-muted-foreground tabular-nums"
            >
              {formatMoney(p.total)}
            </span>
            <span
              role="cell"
              class="text-right text-muted-foreground tabular-nums"
            >
              {formatMoney(p.tax)}
            </span>
            <span role="cell" class="text-right font-medium tabular-nums">
              {formatMoney(p.totalIncTax)}
            </span>
            <span role="cell" class="text-right">{@render valueText(p)}</span>
            <span role="cell" class="text-right">{@render diffText(p)}</span>
            <span role="cell" class="text-right">{@render deleteButton(p)}</span
            >
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<AlertDialog.Root bind:open={dialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete this purchase?</AlertDialog.Title>
      <AlertDialog.Description>
        {#if pendingDelete}
          This will permanently remove {pendingDelete.shares}
          {pendingDelete.shares === 1 ? "share" : "shares"} of
          <span class="font-medium text-foreground"
            >{pendingDelete.companyName} ({pendingDelete.ticker})</span
          >
          bought on {pendingDelete.boughtOn}. This can't be undone.
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    {#if deleteError}
      <p class="text-sm text-destructive">{deleteError}</p>
    {/if}
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={deleting}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        variant="destructive"
        disabled={deleting}
        onclick={confirmDelete}
      >
        {deleting ? "Deleting…" : "Delete"}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
