<script lang="ts">
  import type { purchase } from "#lib/server/db/schema.js";

  type Purchase = typeof purchase.$inferSelect;

  let { purchases }: { purchases: Purchase[] } = $props();

  const TAX_RATE = 0.005;

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "GBP",
  });
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
</script>

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
          <div class="text-right">
            <p class="font-medium tabular-nums">
              {money.format(p.totalIncTax)}
            </p>
            <p class="text-xs text-muted-foreground">inc. tax</p>
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
            <td class="text-right tabular-nums">{money.format(p.price)}</td>
            <td class="text-right tabular-nums">{p.shares}</td>
            <td class="text-right text-muted-foreground tabular-nums">
              {money.format(p.total)}
            </td>
            <td class="text-right text-muted-foreground tabular-nums">
              {money.format(p.tax)}
            </td>
            <td class="text-right font-medium tabular-nums">
              {money.format(p.totalIncTax)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
