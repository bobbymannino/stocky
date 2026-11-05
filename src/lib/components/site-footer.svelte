<script lang="ts">
  import BugIcon from "@lucide/svelte/icons/bug";
  import GitBranchIcon from "@lucide/svelte/icons/git-branch";
  import LightbulbIcon from "@lucide/svelte/icons/lightbulb";
  import { Button } from "#lib/components/ui/button/index.js";
  import { version } from "../../../package.json";

  const REPO_URL = "https://github.com/bobbymannino/stocky";
  const year = new Date().getFullYear();
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
      <span class="font-mono text-xs" title="App version">
        v{version}
      </span>
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
