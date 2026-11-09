<script lang="ts">
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import TrashIcon from "@lucide/svelte/icons/trash";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import { companyColorVar, type CompanyColors } from "#lib/company-colors.js";
  import CompanySwatch from "#lib/components/company-swatch.svelte";
  import NumberRoll from "#lib/components/number-roll.svelte";
  import * as AlertDialog from "#lib/components/ui/alert-dialog/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import type { CurrentPrices } from "#lib/current-prices.svelte.js";
  import { useMoney } from "#lib/money.svelte.js";
  import { flipParams, rise, stagger } from "#lib/motion.js";
  import { purchaseCosts, type Purchase } from "#lib/purchases.js";
  import { deletePurchase } from "#lib/remote/purchases.remote.js";
  import { cn, formatPercent } from "#lib/utils.js";
  import { refreshAll } from "$app/navigation";
  import { page } from "$app/state";

  let {
    purchases,
    colors,
    prices,
    filterable = true,
    linkTickers = true,
  }: {
    purchases: Purchase[];
    colors: CompanyColors;
    prices: CurrentPrices;
    /** Show the ticker filter. Off where there's only one ticker. */
    filterable?: boolean;
    /** Link each ticker to its holding page. Off on that page itself. */
    linkTickers?: boolean;
  } = $props();

  const money = useMoney();

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

{#snippet ticker(t: string)}
  {#if linkTickers}
    <a
      href="/holdings/{encodeURIComponent(t)}"
      class="inline-flex items-center gap-2 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <CompanySwatch color={colors[t]} />
      {t}
      <span class="sr-only">— view holding</span>
    </a>
  {:else}
    <span class="inline-flex items-center gap-2">
      <CompanySwatch color={colors[t]} />
      {t}
    </span>
  {/if}
{/snippet}

{#snippet valueText(row: Row)}
  {@const value = currentValue(row)}
  <span
    class={cn(
      "tabular-nums",
      value !== undefined && value > row.totalIncTax && "text-ctp-green",
      value !== undefined && value < row.totalIncTax && "text-ctp-red",
    )}
  >
    <NumberRoll value={value === undefined ? "—" : money.format(value)} />
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
      <NumberRoll value={money.signed(diff)} />
      <span class="text-xs">
        <NumberRoll value="({formatPercent(diff / row.totalIncTax)})" />
      </span>
    {/if}
  </span>
{/snippet}

{#snippet actions(row: Row)}
  <div class="inline-flex gap-1">
    <!-- `from` brings you back to this page after saving or cancelling -->
    <Button
      href="/purchases/{row.id}/edit?from={encodeURIComponent(
        page.url.pathname,
      )}"
      variant="outline"
      size="icon-sm"
      aria-label="Edit {row.ticker} purchase from {row.boughtOn}"
    >
      <PencilIcon />
    </Button>
    <Button
      variant="destructive"
      size="icon-sm"
      aria-label="Delete {row.ticker} purchase from {row.boughtOn}"
      onclick={() => askToDelete(row)}
    >
      <TrashIcon />
    </Button>
  </div>
{/snippet}

{#if rows.length === 0}
  <p class="text-sm text-muted-foreground">No purchases yet.</p>
{:else}
  {#if filterable}
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
              <span class="truncate text-muted-foreground">{t.companyName}</span
              >
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if activeTicker !== ALL}
        <span transition:fade={{ duration: 120 }}>
          <Button
            variant="ghost"
            size="sm"
            onclick={() => (tickerFilter = ALL)}
          >
            Clear
          </Button>
        </span>
      {/if}
    </div>
  {/if}

  <!-- Mobile: stacked cards -->
  <ul class="flex flex-col gap-3 md:hidden">
    {#each visibleRows as p, i (p.id)}
      <li
        in:rise|global={{ delay: stagger(i) }}
        animate:flip={flipParams()}
        class={cn("flex flex-col gap-2 p-3", rowCard, rowTint(p))}
        style:border-left-color={companyColorVar(colors[p.ticker])}
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="font-mono font-medium">
              {@render ticker(p.ticker)}
            </p>
            <p class="truncate text-sm text-muted-foreground">
              {p.companyName}
            </p>
          </div>
          <div class="flex items-start gap-2">
            <div class="text-right">
              <p class="font-medium tabular-nums">
                {money.format(p.totalIncTax)}
              </p>
              <p class="text-xs text-muted-foreground">inc. tax</p>
            </div>
            {@render actions(p)}
          </div>
        </div>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt class="text-muted-foreground">Bought</dt>
          <dd class="text-right">{p.boughtOn}</dd>
          <dt class="text-muted-foreground">Shares</dt>
          <dd class="text-right tabular-nums">
            {p.shares} × {money.format(p.price)}
          </dd>
          <dt class="text-muted-foreground">Total</dt>
          <dd class="text-right tabular-nums">{money.format(p.total)}</dd>
          <dt class="text-muted-foreground">Tax (0.5%)</dt>
          <dd class="text-right tabular-nums">{money.format(p.tax)}</dd>
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
        <!-- rows rise in one after another, and glide as the filter or a delete
             moves them; leaving rows go at once so the subgrid never breaks -->
        {#each visibleRows as p, i (p.id)}
          <div
            in:rise|global={{ delay: stagger(i) }}
            animate:flip={flipParams()}
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
              {@render ticker(p.ticker)}
            </span>
            <span role="cell" class="max-w-48 truncate" title={p.companyName}>
              {p.companyName}
            </span>
            <span role="cell" class="text-right tabular-nums">
              {money.format(p.price)}
            </span>
            <span role="cell" class="text-right tabular-nums">{p.shares}</span>
            <span
              role="cell"
              class="text-right text-muted-foreground tabular-nums"
            >
              {money.format(p.total)}
            </span>
            <span
              role="cell"
              class="text-right text-muted-foreground tabular-nums"
            >
              {money.format(p.tax)}
            </span>
            <span role="cell" class="text-right font-medium tabular-nums">
              {money.format(p.totalIncTax)}
            </span>
            <span role="cell" class="text-right">{@render valueText(p)}</span>
            <span role="cell" class="text-right">{@render diffText(p)}</span>
            <span role="cell" class="text-right">{@render actions(p)}</span>
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
      <p
        class="text-sm text-destructive transition-[opacity,translate] duration-150 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0"
      >
        {deleteError}
      </p>
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
