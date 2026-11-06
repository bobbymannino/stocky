<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Holdings from "#lib/components/holdings.svelte";
  import PurchasesTable from "#lib/components/purchases-table.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
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
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold">Stocky</h1>
      <p class="text-sm text-muted-foreground">
        Signed in as {data.user.email}
      </p>
    </div>
    <div class="flex gap-2">
      <Button href="/purchases/new">
        <PlusIcon />
        Add purchase
      </Button>
      <form method="post" action="/?/signOut">
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </div>
  </header>

  <Card.Root>
    <Card.Header>
      <Card.Title>Holdings</Card.Title>
      <Card.Description>
        Enter today's price for each stock, or fetch the latest one, to see your
        gain or loss. Prices are saved to your account.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <Holdings
        purchases={data.purchases}
        colors={data.colors}
        {prices}
        finnhubEnabled={data.finnhubEnabled}
      />
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Your purchases</Card.Title>
    </Card.Header>
    <Card.Content>
      <PurchasesTable
        purchases={data.purchases}
        colors={data.colors}
        {prices}
      />
    </Card.Content>
  </Card.Root>
</div>
