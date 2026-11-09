<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import type { Purchase } from "#lib/purchases.js";
  import { savePurchase } from "#lib/remote/purchases.remote.js";
  import { cn } from "#lib/utils.js";
  import { goto } from "$app/navigation";

  let {
    companies,
    initialTicker,
    purchase,
    returnTo = "/",
  }: {
    /** Ticker → company name, from the user's existing purchases. */
    companies: Map<string, string>;
    /** Pre-fills the ticker; a known company's name then fills itself in. */
    initialTicker?: string;
    /** The purchase being edited; leave out to add a new one. */
    purchase?: Purchase;
    /** Where to go after saving, or on cancel when editing. */
    returnTo?: string;
  } = $props();

  // local date (not UTC), so late-night entries don't land on the wrong day
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const { fields } = savePurchase;

  let error = $state<string>();
  // the company name we last filled in, so we only replace our own value
  // and never overwrite something the user typed themselves
  let autofilled = $state<string>();

  // Remote form state outlives the page, so start each visit with an empty form,
  // or the purchase being edited. A back/forward visit to the add page then
  // restores its snapshot on top of this (see that page).
  function resetForm() {
    if (purchase) {
      fields.set({
        id: purchase.id,
        ticker: purchase.ticker,
        companyName: purchase.companyName,
        boughtAt: purchase.boughtAt,
        pricePerShare: Number(purchase.pricePerShare),
        shares: Number(purchase.shares),
      });
      // treat a name matching our suggestion as ours, so changing the ticker
      // swaps it; a name the user wrote themselves is left alone
      autofilled =
        companies.get(purchase.ticker) === purchase.companyName
          ? purchase.companyName
          : undefined;
      return;
    }
    fields.set({ boughtAt: today, ticker: initialTicker ?? "" });
    autofilled = undefined;
  }

  onMount(resetForm);

  // --- ticker suggestions (an ARIA combobox over the user's own tickers) ------

  /** How many suggestions to show at once. */
  const MAX_SUGGESTIONS = 8;

  let suggestOpen = $state(false);
  let highlighted = $state(-1);

  let suggestions = $derived.by(() => {
    const query = (fields.ticker.value() ?? "").trim().toUpperCase();
    const all = [...companies].map(([ticker, name]) => ({ ticker, name }));
    // nothing more to suggest once it already matches a ticker exactly
    if (companies.has(query)) return [];
    const matches = query
      ? all.filter(
          (c) =>
            c.ticker.startsWith(query) || c.name.toUpperCase().includes(query),
        )
      : all;
    // ticker-prefix matches first, then A–Z
    return matches
      .toSorted(
        (a, b) =>
          Number(b.ticker.startsWith(query)) -
            Number(a.ticker.startsWith(query)) ||
          a.ticker.localeCompare(b.ticker),
      )
      .slice(0, MAX_SUGGESTIONS);
  });

  let showSuggestions = $derived(suggestOpen && suggestions.length > 0);

  function chooseTicker(ticker: string) {
    // the company name fills itself in via the effect below
    fields.ticker.set(ticker);
    suggestOpen = false;
    highlighted = -1;
  }

  function onTickerKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!showSuggestions) {
        suggestOpen = true;
        highlighted = e.key === "ArrowDown" ? 0 : suggestions.length - 1;
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      highlighted =
        (highlighted + step + suggestions.length) % suggestions.length;
    } else if (e.key === "Enter" && showSuggestions && highlighted >= 0) {
      // pick the suggestion instead of submitting the form
      e.preventDefault();
      chooseTicker(suggestions[highlighted].ticker);
    } else if (e.key === "Escape" && showSuggestions) {
      e.preventDefault();
      suggestOpen = false;
    }
  }

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
    <Card.Title>{purchase ? "Edit purchase" : "Add purchase"}</Card.Title>
    <Card.Description>
      {purchase
        ? "Correct the details of shares you've bought."
        : "Record shares you've bought."}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      {...savePurchase.enhance(async (form) => {
        error = undefined;
        try {
          // `.updates()` skips refreshing this page; the portfolio loads fresh anyway
          if (await form.submit().updates()) {
            // reset before navigating so the history snapshot is the empty form,
            // not the purchase that was just saved
            resetForm();
            await goto(returnTo);
          }
        } catch {
          error = "Something went wrong. Please try again.";
        }
      })}
      class="grid gap-4 sm:grid-cols-2"
    >
      {#if purchase}
        <input {...fields.id.as("hidden", purchase.id)} />
      {/if}
      <div class="relative grid gap-2">
        <Label for="ticker">Ticker</Label>
        <Input
          id="ticker"
          {...fields.ticker.as("text")}
          required
          placeholder="AAPL"
          class="uppercase"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="ticker-suggestions"
          aria-activedescendant={showSuggestions && highlighted >= 0
            ? `ticker-option-${highlighted}`
            : undefined}
          onfocus={() => (suggestOpen = true)}
          onblur={() => (suggestOpen = false)}
          oninput={() => {
            suggestOpen = true;
            highlighted = -1;
          }}
          onkeydown={onTickerKeyDown}
        />
        {#if showSuggestions}
          <ul
            id="ticker-suggestions"
            role="listbox"
            aria-label="Your tickers"
            class="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-tile-raised"
          >
            {#each suggestions as s, i (s.ticker)}
              <!-- mousedown, not click: picking must happen before the input blurs -->
              <li
                id="ticker-option-{i}"
                role="option"
                aria-selected={i === highlighted}
                class={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  i === highlighted && "bg-accent text-accent-foreground",
                )}
                onmousedown={(e) => {
                  e.preventDefault();
                  chooseTicker(s.ticker);
                }}
                onmousemove={() => (highlighted = i)}
              >
                <span class="font-mono font-medium">{s.ticker}</span>
                <span class="truncate text-muted-foreground">{s.name}</span>
              </li>
            {/each}
          </ul>
        {/if}
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
      <div class="flex items-end gap-2">
        {#if purchase}
          <Button href={returnTo} variant="outline" class="flex-1">
            Cancel
          </Button>
        {/if}
        <Button
          type="submit"
          class="flex-1"
          disabled={savePurchase.pending > 0}
        >
          {#if purchase}
            {savePurchase.pending > 0 ? "Updating…" : "Update"}
          {:else}
            {savePurchase.pending > 0 ? "Adding…" : "Add"}
          {/if}
        </Button>
      </div>
      {#if error}
        <p class="text-sm text-destructive sm:col-span-2">{error}</p>
      {/if}
    </form>
  </Card.Content>
</Card.Root>
