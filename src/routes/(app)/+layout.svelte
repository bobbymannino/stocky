<script lang="ts">
  import SiteHeader from "#lib/components/site-header.svelte";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();
</script>

<SiteHeader user={data.user} />
{@render children()}
