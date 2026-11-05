<script lang="ts">
  import TrashIcon from "@lucide/svelte/icons/trash";
  import * as AlertDialog from "#lib/components/ui/alert-dialog/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { deletePurchase } from "#lib/remote/purchases.remote.js";
  import type { purchase } from "#lib/server/db/schema.js";
  import { formatMoney } from "#lib/utils.js";
  import { refreshAll } from "$app/navigation";

  type Purchase = typeof purchase.$inferSelect;

  let { purchases }: { purchases: Purchase[] } = $props();

  const TAX_RATE = 0.005;

  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

  // numeric columns come back from Postgres as strings
  let rows = $derived(
    purchases.map((p) => {
      const price = Number(p.pricePerShare);
      const shares = Number(p.shares);
      const total = price * shares;
      const tax = total * TAX_RATE;
      return {
        id: p.id,
        ticker: p.ticker,
        companyName: p.companyName,
        price,
        shares,
        total,
        tax,
        totalIncTax: total + tax,
        boughtOn: date.format(new Date(p.boughtAt)),
      };
    }),
  );

  type Row = (typeof rows)[number];

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
  <!-- Mobile: stacked cards -->
  <ul class="flex flex-col divide-y md:hidden">
    {#each rows as p (p.id)}
      <li class="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="font-mono font-medium">{p.ticker}</p>
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
        </dl>
      </li>
    {/each}
  </ul>

  <!-- Desktop: table -->
  <div class="hidden overflow-x-auto md:block">
    <table class="w-full text-sm whitespace-nowrap">
      <thead class="text-left text-muted-foreground">
        <tr
          class="border-b [&>th]:py-2 [&>th]:pr-4 [&>th]:font-medium [&>th:last-child]:pr-0"
        >
          <th>Bought</th>
          <th>Ticker</th>
          <th>Company</th>
          <th class="text-right">Price</th>
          <th class="text-right">Shares</th>
          <th class="text-right">Total</th>
          <th class="text-right">Tax (0.5%)</th>
          <th class="text-right">Total (inc. tax)</th>
          <th><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {#each rows as p (p.id)}
          <tr
            class="border-b last:border-0 [&>td]:py-2 [&>td]:pr-4 [&>td:last-child]:pr-0"
          >
            <td>{p.boughtOn}</td>
            <td class="font-mono">{p.ticker}</td>
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
