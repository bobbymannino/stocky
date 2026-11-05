<script lang="ts">
  import "./layout.css";
  import { MetaTags, deepMerge } from "svelte-meta-tags";
  import SiteFooter from "#lib/components/site-footer.svelte";
  import { page } from "$app/state";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let metaTags = $derived(deepMerge(data.baseMetaTags, page.data.pageMetaTags));
</script>

<MetaTags {...metaTags} />

<div class="flex min-h-svh flex-col">
  <main class="flex flex-1 flex-col">
    {@render children()}
  </main>
  <SiteFooter />
</div>
