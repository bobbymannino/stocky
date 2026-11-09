<script lang="ts">
  import SearchIcon from "@lucide/svelte/icons/search";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import { rise } from "#lib/motion.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
  <div>
    <h1 class="text-2xl font-semibold">Search</h1>
    <p class="text-sm text-muted-foreground">
      Enter a ticker to see its price history, e.g. AAPL, or VOD.L for London.
    </p>
  </div>

  <!-- a plain GET form: the server checks the ticker and redirects to its page -->
  <form method="get" class="flex flex-col gap-2">
    <Label for="ticker">Ticker</Label>
    <div class="flex gap-2">
      <Input
        id="ticker"
        name="ticker"
        value={data.query}
        required
        maxlength={10}
        placeholder="AAPL"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck={false}
        class="uppercase"
        aria-invalid={data.invalid || undefined}
        aria-describedby={data.invalid ? "ticker-error" : undefined}
        autofocus
      />
      <Button type="submit">
        <SearchIcon />
        Search
      </Button>
    </div>
    {#if data.invalid}
      <p id="ticker-error" class="text-sm text-destructive" in:rise={{ y: -4 }}>
        Tickers are up to 10 letters, numbers, dots or dashes.
      </p>
    {/if}
  </form>
</div>
