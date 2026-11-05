<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import AddPurchaseForm from "#lib/components/add-purchase-form.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
  <div>
    <Button href="/" variant="ghost" size="sm" class="-ml-2.5">
      <ArrowLeftIcon />
      Back to portfolio
    </Button>
  </div>

  <AddPurchaseForm companies={data.companies} />
</div>
