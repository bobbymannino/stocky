<script lang="ts">
  import TrashIcon from "@lucide/svelte/icons/trash";
  import { companyColorVar, type CompanyColors } from "#lib/company-colors.js";
  import CompanySwatch from "#lib/components/company-swatch.svelte";
  import * as AlertDialog from "#lib/components/ui/alert-dialog/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import { currentPrices } from "#lib/current-prices.svelte.js";
  import { purchaseCosts, type Purchase } from "#lib/purchases.js";
  import { deletePurchase } from "#lib/remote/purchases.remote.js";
  import {
    cn,
    formatMoney,
    formatPercent,
    formatSignedMoney,
  } from "#lib/utils.js";
  import { refreshAll } from "$app/navigation";

  let { purchases, colors }: { purchases: Purchase[]; colors: CompanyColors } =
    $props();

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
    const price = currentPrices.get(row.ticker);
    return price === undefined ? undefined : price * row.shares;
  }

  type Row = (typeof rows)[number];

  /** Background tint for a row: green if it's up, red if down, none without a price. */
  function rowTint(row: Row) {
    const value = currentValue(row);
    if (value === undefined || value === row.totalIncTax) return "";
    return value > row.totalIncTax ? "bg-ctp-green/5" : "bg-ctp-red/5";
  }

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
  <ul class="flex flex-col divide-y md:hidden">
    {#each visibleRows as p (p.id)}
      <li
        class={cn(
          "flex flex-col gap-2 border-l-4 py-3 pr-3 pl-3 transition-colors",
          rowTint(p),
        )}
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

  <!-- Desktop: table -->
  <div class="hidden overflow-x-auto md:block">
    <table class="w-full text-sm whitespace-nowrap">
      <thead class="text-left text-muted-foreground">
        <tr
          class="border-b [&>th]:py-4 [&>th]:pr-4 [&>th]:font-medium [&>th:first-child]:pl-4 [&>th:last-child]:pr-4"
        >
          <th>Bought</th>
          <th>Ticker</th>
          <th>Company</th>
          <th class="text-right">Price</th>
          <th class="text-right">Shares</th>
          <th class="text-right">Total</th>
          <th class="text-right">Tax (0.5%)</th>
          <th class="text-right">Total (inc. tax)</th>
          <th class="text-right">Current value</th>
          <th class="text-right">Gain / loss</th>
          <th><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {#each visibleRows as p (p.id)}
          <tr
            class={cn(
              "border-b transition-colors last:border-0 [&>td]:py-4 [&>td]:pr-4 [&>td:first-child]:pl-4 [&>td:last-child]:pr-4",
              rowTint(p),
            )}
          >
            <td>{p.boughtOn}</td>
            <td class="font-mono">
              <span class="inline-flex items-center gap-2">
                <CompanySwatch color={colors[p.ticker]} />
                {p.ticker}
              </span>
            </td>
            <td class="max-w-48 truncate" title={p.companyName}>
              {p.companyName}
            </td>
            <td class="text-right tabular-nums">{formatMoney(p.price)}</td>
            <td class="text-right tabular-nums">{p.shares}</td>
            <td class="text-right text-muted-foreground tabular-nums">
              {formatMoney(p.total)}
            </td>
            <td class="text-right text-muted-foreground tabular-nums">
              {formatMoney(p.tax)}
            </td>
            <td class="text-right font-medium tabular-nums">
              {formatMoney(p.totalIncTax)}
            </td>
            <td class="text-right">{@render valueText(p)}</td>
            <td class="text-right">{@render diffText(p)}</td>
            <td class="w-0 py-1! text-right">{@render deleteButton(p)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
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
