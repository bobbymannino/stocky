<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { onMount } from "svelte";
  import Holdings from "#lib/components/holdings.svelte";
  import PurchasesTable from "#lib/components/purchases-table.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { currentPrices } from "#lib/current-prices.svelte.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  // today's prices live in sessionStorage, which only exists in the browser
  onMount(() => currentPrices.load());
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
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
