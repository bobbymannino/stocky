<script lang="ts">
  import SiteHeader from "#lib/components/site-header.svelte";
  import { setCurrencyMode } from "#lib/money.svelte.js";
  import { applyTheme } from "#lib/preferences.js";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  // a getter, so a changed preference shows everywhere once data reloads
  setCurrencyMode(() => data.preferences.currencyMode);

  // the server themes the first page; this keeps it in step after changes
  $effect(() => applyTheme(data.preferences));
</script>

<SiteHeader user={data.user} />
{@render children()}
