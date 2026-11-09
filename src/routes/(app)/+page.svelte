<script lang="ts">
  import Holdings from "#lib/components/holdings.svelte";
  import PurchasesTable from "#lib/components/purchases-table.svelte";
  import * as Card from "#lib/components/ui/card/index.js";
  import { CurrentPrices } from "#lib/current-prices.svelte.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // one per page view: prices are per-user, so this must not be module state.
  // it keeps its own copy after this, so typed prices aren't reset on refresh
  // svelte-ignore state_referenced_locally
  const prices = new CurrentPrices(data.prices);
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4">
  <h1 class="text-2xl font-semibold">Portfolio</h1>

  <Card.Root>
    <Card.Header>
      <Card.Title>Holdings</Card.Title>
      <Card.Description>
        Enter today's price for each stock, or fetch the latest one, to see your
        gain or loss. Prices are saved to your account.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <Holdings purchases={data.purchases} colors={data.colors} {prices} />
    </Card.Content>
  </Card.Root>

  <section aria-labelledby="purchases-heading" class="flex flex-col gap-4">
    <h2 id="purchases-heading" class="text-lg font-semibold">Your purchases</h2>
    <PurchasesTable purchases={data.purchases} colors={data.colors} {prices} />
  </section>
</div>
