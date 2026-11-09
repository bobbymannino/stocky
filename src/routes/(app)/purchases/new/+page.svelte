<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import AddPurchaseForm from "#lib/components/add-purchase-form.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { addPurchase } from "#lib/remote/purchases.remote.js";
  import type { PageProps, Snapshot } from "./$types";

  let { data }: PageProps = $props();

  // keep what was typed when navigating back/forward to this page
  export const snapshot: Snapshot<ReturnType<typeof addPurchase.fields.value>> =
    {
      capture: () => addPurchase.fields.value(),
      restore: (value) => addPurchase.fields.set(value),
    };
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
  <div>
    <Button href="/" variant="ghost" size="sm" class="-ml-2.5">
      <ArrowLeftIcon />
      Back to portfolio
    </Button>
  </div>

  <AddPurchaseForm companies={data.companies} initialTicker={data.ticker} />
</div>
