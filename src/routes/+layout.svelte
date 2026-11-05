<script lang="ts">
  import "./layout.css";
  import { MetaTags, deepMerge } from "svelte-meta-tags";
  import { page } from "$app/state";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let metaTags = $derived(deepMerge(data.baseMetaTags, page.data.pageMetaTags));
</script>

<MetaTags {...metaTags} />

{@render children()}
