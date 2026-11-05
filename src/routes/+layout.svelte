<script lang="ts">
  import "./layout.css";
  import { page } from "$app/state";
  import { MetaTags, deepMerge } from "svelte-meta-tags";
  import favicon from "#lib/assets/favicon.svg";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let metaTags = $derived(deepMerge(data.baseMetaTags, page.data.pageMetaTags));
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<MetaTags {...metaTags} />

{@render children()}
