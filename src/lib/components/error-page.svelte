<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { Button } from "#lib/components/ui/button/index.js";
  import { page } from "$app/state";

  /** Offer search, which only signed-in users can reach. */
  let { showSearch = false }: { showSearch?: boolean } = $props();

  let notFound = $derived(page.status === 404);
  let title = $derived(notFound ? "Page not found" : "Something went wrong");

  // our own errors (e.g. "Purchase not found") are worth showing; SvelteKit's
  // generic ones just repeat the title
  let message = $derived.by(() => {
    const m = page.error?.message;
    if (m && m !== "Not Found" && m !== "Internal Error") return m;
    return notFound
      ? "The page you're looking for doesn't exist or has moved."
      : "An unexpected error happened. Please try again in a moment.";
  });
</script>

<div
  class="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-4 py-16 text-center"
>
  <p
    class="bg-linear-to-b from-foreground to-muted-foreground/40 bg-clip-text font-mono text-8xl font-semibold tracking-tight text-transparent tabular-nums"
    aria-hidden="true"
  >
    {page.status}
  </p>
  <div class="flex flex-col gap-2">
    <h1 class="text-2xl font-semibold">{title}</h1>
    <p class="text-sm text-balance text-muted-foreground">{message}</p>
  </div>
  <div class="flex flex-wrap justify-center gap-2">
    <Button href="/">
      <ArrowLeftIcon />
      Back to portfolio
    </Button>
    {#if showSearch && notFound}
      <Button href="/search" variant="outline">
        <SearchIcon />
        Search companies
      </Button>
    {/if}
  </div>
</div>
