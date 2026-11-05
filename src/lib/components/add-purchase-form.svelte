<script lang="ts">
  import { untrack } from "svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import { addPurchase } from "#lib/remote/purchases.remote.js";

  /** Ticker → company name, from the user's existing purchases. */
  let { companies }: { companies: Map<string, string> } = $props();

  // local date (not UTC), so late-night entries don't land on the wrong day
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const { fields } = addPurchase;

  let error = $state<string>();
  // the company name we last filled in, so we only replace our own value
  // and never overwrite something the user typed themselves
  let autofilled = $state<string>();

  $effect(() => {
    const ticker = (fields.ticker.value() ?? "").trim().toUpperCase();
    const match = companies.get(ticker);

    untrack(() => {
      const current = fields.companyName.value() ?? "";
      const ours = current === "" || current === autofilled;
      if (!ours) return;

      if (match) {
        fields.companyName.set(match);
        autofilled = match;
      } else if (autofilled) {
        fields.companyName.set("");
        autofilled = undefined;
      }
    });
  });
</script>

{#snippet issues(list: { message: string }[] | undefined)}
  {#each list ?? [] as issue (issue.message)}
    <p class="text-sm text-destructive">{issue.message}</p>
  {/each}
{/snippet}

<Card.Root>
  <Card.Header>
    <Card.Title>Add purchase</Card.Title>
    <Card.Description>Record shares you've bought.</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      {...addPurchase.enhance(async (form) => {
        error = undefined;
        try {
          if (await form.submit()) form.element.reset();
        } catch {
          error = "Something went wrong. Please try again.";
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      <div class="grid gap-2">
        <Label for="ticker">Ticker</Label>
        <Input
          id="ticker"
          {...fields.ticker.as("text")}
          required
          placeholder="AAPL"
          class="uppercase"
          autocomplete="off"
          list="known-tickers"
        />
        <datalist id="known-tickers">
          {#each companies as [ticker, name] (ticker)}
            <option value={ticker}>{name}</option>
          {/each}
        </datalist>
        {@render issues(fields.ticker.issues())}
      </div>
      <div class="grid gap-2">
        <Label for="companyName">Company</Label>
        <Input
          id="companyName"
          {...fields.companyName.as("text")}
          required
          placeholder="Apple Inc."
        />
        {@render issues(fields.companyName.issues())}
      </div>
      <div class="grid gap-2">
        <Label for="boughtAt">Bought on</Label>
        <Input
          id="boughtAt"
          {...fields.boughtAt.as("date", today)}
          required
          max={today}
        />
        {@render issues(fields.boughtAt.issues())}
      </div>
      <div class="grid gap-2">
        <Label for="pricePerShare">Price per share (GBP)</Label>
        <Input
          id="pricePerShare"
          {...fields.pricePerShare.as("number")}
          required
          min="0"
          step="any"
          placeholder="0.00"
        />
        {@render issues(fields.pricePerShare.issues())}
      </div>
      <div class="grid gap-2">
        <Label for="shares">Shares</Label>
        <Input
          id="shares"
          {...fields.shares.as("number")}
          required
          min="0"
          step="any"
          placeholder="0"
        />
        {@render issues(fields.shares.issues())}
      </div>
      <div class="flex items-end">
        <Button type="submit" class="w-full" disabled={addPurchase.pending > 0}>
          {addPurchase.pending > 0 ? "Adding…" : "Add"}
        </Button>
      </div>
      {#if error}
        <p class="text-sm text-destructive sm:col-span-2">{error}</p>
      {/if}
    </form>
  </Card.Content>
</Card.Root>
