<script lang="ts">
  import BugIcon from "@lucide/svelte/icons/bug";
  import LightbulbIcon from "@lucide/svelte/icons/lightbulb";
  import { REPO_URL } from "#lib/app-info.js";
  import { Button } from "#lib/components/ui/button/index.js";

  /** `NODE_ENV` when it isn't production; left out in production. */
  let { nodeEnv }: { nodeEnv?: string } = $props();

  // the version, GitHub link and build time are on the profile page

  const year = new Date().getFullYear();
</script>

<footer class="border-t">
  <div
    class="mx-auto flex max-w-6xl flex-col gap-4 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p>&copy; {year} Bobby Mannino.</p>
      {#if nodeEnv}
        <span
          class="rounded-full bg-ctp-peach/15 px-2 py-0.5 font-mono text-xs font-medium text-ctp-peach ring-1 ring-ctp-peach/40"
          title="NODE_ENV is {nodeEnv === 'unset' ? 'not set' : nodeEnv}"
        >
          {nodeEnv}
        </span>
      {/if}
    </div>
    <div class="flex gap-2">
      <Button
        href="{REPO_URL}/issues/new?template=bug_report.yml"
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        size="sm"
      >
        <BugIcon />
        Report an issue
      </Button>
      <Button
        href="{REPO_URL}/issues/new?template=feature_request.yml"
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        size="sm"
      >
        <LightbulbIcon />
        Request a feature
      </Button>
    </div>
  </div>
</footer>
