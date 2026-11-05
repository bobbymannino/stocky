<script lang="ts">
  import { onMount } from "svelte";
  import AddPurchaseForm from "#lib/components/add-purchase-form.svelte";
  import Holdings from "#lib/components/holdings.svelte";
  import PurchasesTable from "#lib/components/purchases-table.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { currentPrices } from "#lib/current-prices.svelte.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // today's prices live in sessionStorage, which only exists in the browser
  onMount(() => currentPrices.load());

  // purchases are newest first, so keep the first (most recent) name per ticker
  let companies = $derived(
    data.purchases.reduce((map, p) => {
      if (!map.has(p.ticker)) map.set(p.ticker, p.companyName);
      return map;
    }, new Map<string, string>()),
  );
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold">Stocky</h1>
      <p class="text-sm text-muted-foreground">
        Signed in as {data.user.email}
      </p>
    </div>
    <form method="post" action="?/signOut">
      <Button type="submit" variant="outline">Sign out</Button>
    </form>
  </header>

  <AddPurchaseForm {companies} />

  <Card.Root>
    <Card.Header>
      <Card.Title>Holdings</Card.Title>
      <Card.Description>
        Enter today's price for each stock to see your gain or loss. Prices are
        only kept until you close this tab.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <Holdings purchases={data.purchases} />
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Your purchases</Card.Title>
    </Card.Header>
    <Card.Content>
      <PurchasesTable purchases={data.purchases} />
    </Card.Content>
  </Card.Root>
</div>
