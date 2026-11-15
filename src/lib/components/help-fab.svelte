<script lang="ts">
  import QuestionMarkIcon from "@lucide/svelte/icons/question-mark";
  import HelpTable from "#lib/components/help-table.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Sheet from "#lib/components/ui/sheet/index.js";
  import { afterNavigate } from "$app/navigation";
  import HelpList from "./help-list.svelte";

  let open = $state(false);

  // following a link elsewhere should leave the help closed on the new page
  afterNavigate(() => (open = false));
</script>

<Sheet.Root bind:open>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        size="icon-lg"
        title="Help"
        class="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 size-12 rounded-full shadow-lg [&_svg:not([class*='size-'])]:size-5"
      >
        <QuestionMarkIcon />
        <span class="sr-only">Open help</span>
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content side="right" class="w-full overflow-y-auto sm:max-w-md">
    <Sheet.Header>
      <Sheet.Title>Help</Sheet.Title>
      <Sheet.Description>
        Useful help and advice on how to use Stocky.
      </Sheet.Description>
    </Sheet.Header>
    <div class="flex flex-col gap-6 px-4 pb-4">
      <HelpList />
      <HelpTable />
    </div>
  </Sheet.Content>
</Sheet.Root>
