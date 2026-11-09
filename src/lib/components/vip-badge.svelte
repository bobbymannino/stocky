<script lang="ts">
  import CrownIcon from "@lucide/svelte/icons/crown";
  import { cn } from "#lib/utils.js";

  let { class: className }: { class?: string } = $props();
</script>

<span
  class={cn(
    "relative inline-flex shrink-0 items-center gap-1 overflow-hidden rounded-full bg-gold-gradient px-2 py-0.5 text-xs font-semibold tracking-wide text-gold-ink shadow-sm ring-1 ring-gold-dark/40",
    className,
  )}
>
  <CrownIcon class="size-3.5" aria-hidden="true" />
  VIP
  <!-- the glint -->
  <span
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 animate-gold-shine bg-linear-to-r from-transparent via-white/60 to-transparent"
  ></span>
</span>
