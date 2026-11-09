<script lang="ts">
  import SiteHeader from "#lib/components/site-header.svelte";
  import { setCurrencyMode } from "#lib/money.svelte.js";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  // a getter, so a changed preference shows everywhere once data reloads
  setCurrencyMode(() => data.preferences.currencyMode);
</script>

<SiteHeader user={data.user} />
{@render children()}
