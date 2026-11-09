<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import PurchaseForm from "#lib/components/purchase-form.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { savePurchase } from "#lib/remote/purchases.remote.js";
  import type { PageProps, Snapshot } from "./$types";

  let { data }: PageProps = $props();

  // keep what was typed when navigating back/forward to this page
  export const snapshot: Snapshot<
    ReturnType<typeof savePurchase.fields.value>
  > = {
    capture: () => savePurchase.fields.value(),
    restore: (value) => savePurchase.fields.set(value),
  };
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
  <div>
    <Button href="/" variant="ghost" size="sm" class="-ml-2.5">
      <ArrowLeftIcon />
      Back to portfolio
    </Button>
  </div>

  <PurchaseForm
    companies={data.companies}
    initialTicker={data.ticker}
    initialWishlist={data.wishlist}
  />
</div>
