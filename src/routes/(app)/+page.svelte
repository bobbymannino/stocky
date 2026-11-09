<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { onMount } from "svelte";
  import Holdings from "#lib/components/holdings.svelte";
  import PurchasesTable from "#lib/components/purchases-table.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { CurrentPrices } from "#lib/current-prices.svelte.js";
  import { stagger } from "#lib/motion.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // one per page view: prices are per-user, so this must not be module state.
  // it keeps its own copy after this, so typed prices aren't reset on refresh
  // svelte-ignore state_referenced_locally
  const prices = new CurrentPrices(data.prices);

  // Holdings fetches its own tickers on mount; this covers wishlist-only ones
  onMount(() => {
    const held = new Set(data.purchases.map((p) => p.ticker));
    const wishlistOnly = new Set(
      data.wishlist.map((p) => p.ticker).filter((t) => !held.has(t)),
    );
    for (const ticker of wishlistOnly) void prices.autoFetch(ticker);
  });
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

  <section aria-labelledby="wishlist-heading" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 id="wishlist-heading" class="text-lg font-semibold">Wishlist</h2>
        <p class="text-sm text-muted-foreground">
          Pretend trades. They don't count towards your holdings.
        </p>
      </div>
      <Button href="/purchases/new?wishlist" variant="outline" size="sm">
        <PlusIcon />
        Add wishlist trade
      </Button>
    </div>
    <PurchasesTable
      purchases={data.wishlist}
      colors={data.colors}
      {prices}
      wishlist
      delay={stagger(data.purchases.length)}
    />
  </section>
</div>
