<script lang="ts">
  import PurchasesTable from "#lib/components/purchases-table.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import { enhance } from "$app/forms";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();

  const today = new Date().toISOString().slice(0, 10);
</script>

<div class="mx-auto flex max-w-4xl flex-col gap-6 p-4">
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

  <Card.Root>
    <Card.Header>
      <Card.Title>Add purchase</Card.Title>
      <Card.Description>Record shares you've bought.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="post"
        action="?/addPurchase"
        use:enhance
        class="grid gap-4 sm:grid-cols-2"
      >
        <div class="grid gap-2">
          <Label for="ticker">Ticker</Label>
          <Input
            id="ticker"
            name="ticker"
            required
            placeholder="AAPL"
            class="uppercase"
            value={form?.values?.ticker ?? ""}
          />
        </div>
        <div class="grid gap-2">
          <Label for="companyName">Company</Label>
          <Input
            id="companyName"
            name="companyName"
            required
            placeholder="Apple Inc."
            value={form?.values?.companyName ?? ""}
          />
        </div>
        <div class="grid gap-2">
          <Label for="boughtAt">Bought on</Label>
          <Input
            id="boughtAt"
            name="boughtAt"
            type="date"
            required
            max={today}
            value={form?.values?.boughtAt ?? today}
          />
        </div>
        <div class="grid gap-2">
          <Label for="pricePerShare">Price per share</Label>
          <Input
            id="pricePerShare"
            name="pricePerShare"
            type="number"
            required
            min="0"
            step="any"
            placeholder="0.00"
            value={form?.values?.pricePerShare ?? ""}
          />
        </div>
        <div class="grid gap-2">
          <Label for="shares">Shares</Label>
          <Input
            id="shares"
            name="shares"
            type="number"
            required
            min="0"
            step="any"
            placeholder="0"
            value={form?.values?.shares ?? ""}
          />
        </div>
        <div class="flex items-end">
          <Button type="submit" class="w-full">Add</Button>
        </div>
        {#if form?.message}
          <p class="text-sm text-destructive sm:col-span-2">{form.message}</p>
        {/if}
      </form>
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
