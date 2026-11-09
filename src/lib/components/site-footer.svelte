<script lang="ts">
  import BugIcon from "@lucide/svelte/icons/bug";
  import GitBranchIcon from "@lucide/svelte/icons/git-branch";
  import LightbulbIcon from "@lucide/svelte/icons/lightbulb";
  import { onMount } from "svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { version as buildId } from "$app/env";
  import { version } from "../../../package.json";

  /** `NODE_ENV` when it isn't production; left out in production. */
  let { nodeEnv }: { nodeEnv?: string } = $props();

  const REPO_URL = "https://github.com/bobbymannino/stocky";
  const year = new Date().getFullYear();

  // SvelteKit's default `version.name` is `Date.now()` at build time
  // (in dev it's when the dev server started)
  const builtAt = Number.isFinite(Number(buildId))
    ? new Date(Number(buildId))
    : undefined;

  const formatBuiltAt = (timeZone?: string) =>
    builtAt?.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    });

  // the server renders in UTC; switch to the viewer's timezone once in the browser
  let builtAtText = $state(formatBuiltAt("UTC"));
  onMount(() => (builtAtText = formatBuiltAt()));
</script>

<footer class="border-t">
  <div
    class="mx-auto flex max-w-6xl flex-col gap-4 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p>&copy; {year} Bobby Mannino.</p>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        <GitBranchIcon class="size-4" aria-hidden="true" />
        View on GitHub
      </a>
      <a
        href="{REPO_URL}/releases/tag/v{version}"
        target="_blank"
        rel="noopener noreferrer"
        class="font-mono text-xs transition-colors hover:text-foreground"
        title="Release notes for v{version}"
      >
        v{version}
      </a>
      {#if nodeEnv}
        <span
          class="rounded-full bg-ctp-peach/15 px-2 py-0.5 font-mono text-xs font-medium text-ctp-peach ring-1 ring-ctp-peach/40"
          title="NODE_ENV is {nodeEnv === 'unset' ? 'not set' : nodeEnv}"
        >
          {nodeEnv}
        </span>
      {/if}
      {#if builtAt}
        <span class="text-xs">
          Built <time
            datetime={builtAt.toISOString()}
            title={builtAt.toISOString()}>{builtAtText}</time
          >
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
