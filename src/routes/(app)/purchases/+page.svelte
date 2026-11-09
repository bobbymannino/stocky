<script lang="ts">
  import PurchasesTable from "#lib/components/purchases-table.svelte";
  import { CurrentPrices } from "#lib/current-prices.svelte.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // one per page view: prices are per-user, so this must not be module state
  // svelte-ignore state_referenced_locally
  const prices = new CurrentPrices(data.prices);
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
  <h1 class="text-2xl font-semibold">Purchases</h1>
  <PurchasesTable purchases={data.purchases} colors={data.colors} {prices} />
</div>
