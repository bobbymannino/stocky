<script lang="ts">
  import PurchaseForm from "#lib/components/purchase-form.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
  <!-- keyed so moving between two edit pages starts the form afresh -->
  {#key data.purchase.id}
    <PurchaseForm
      companies={data.companies}
      purchase={data.purchase}
      returnTo={data.returnTo}
    />
  {/key}
</div>
