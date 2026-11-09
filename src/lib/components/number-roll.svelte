<script lang="ts">
  import { onMount } from "svelte";
  import { prefersReducedMotion } from "svelte/motion";
  import type { TransitionConfig } from "svelte/transition";
  import { easeOut } from "#lib/motion.js";

  /**
   * Shows formatted text (a price, a percentage) and, when it changes, rolls
   * each changed character up: the old one slides up and blurs away as the new
   * one rises in from below, left to right. It first shows with every digit
   * as 0, then rolls up to the real value once mounted.
   */
  let { value }: { value: string } = $props();

  /** Same shape, all digits 0: "£1,234.56" → "£0,000.00". */
  const zeroed = (text: string) => text.replace(/\d/g, "0");

  // the server renders the zeroed text too, so a fresh page load rolls up
  // instead of showing the real value and then snapping to zero
  let mounted = $state(false);
  onMount(() => (mounted = true));
  let shown = $derived(mounted ? value : zeroed(value));

  const STEP_MS = 30;
  const MAX_STEPS = 8;
  const DURATION_MS = 380;

  /** Characters keyed from the right, so pence stay put when pounds gain a digit. */
  let slots = $derived(
    [...shown].map((char, i, all) => ({ char, key: all.length - i })),
  );

  // not state: the value the last change was measured from. It catches up
  // inside the derived, so it's still the old value whenever the transitions
  // first ask for their delays, however late that is
  // svelte-ignore state_referenced_locally
  let previous = zeroed(value);
  /** Index of the leftmost character that differs from the last value. */
  let firstChanged = $derived.by(() => {
    const before = [...previous];
    const after = [...shown];
    previous = shown;
    for (let i = 0; i < after.length; i++) {
      if (before[before.length - after.length + i] !== after[i]) return i;
    }
    return after.length;
  });

  const delayFor = (i: number) =>
    Math.min(Math.max(0, i - firstChanged), MAX_STEPS) * STEP_MS;

  /** Rises in from below (`from: 1`) or leaves upwards (`from: -1`). */
  function roll(
    _node: Element,
    { delay, from }: { delay: number; from: 1 | -1 },
  ): TransitionConfig {
    if (prefersReducedMotion.current) {
      return { duration: 150, css: (t) => `opacity: ${t}` };
    }
    return {
      delay,
      duration: DURATION_MS,
      easing: easeOut,
      css: (t, u) =>
        `opacity: ${t}; translate: 0 ${from * u * 0.6}em; filter: blur(${u * 3}px)`,
    };
  }
</script>

<!-- read as one value; the per-character spans are only for the motion -->
<!-- each character gets one grid cell, so the leaving and arriving ones overlap.
     Keep comments out of the loop: they leave a space between characters -->
<span class="sr-only">{value}</span><span
  aria-hidden="true"
  class="tabular-nums"
>
  {#each slots as s, i (s.key)}
    <span class="inline-grid *:[grid-area:1/1]">
      {#key s.char}
        <span
          class="whitespace-pre"
          in:roll={{ delay: delayFor(i), from: 1 }}
          out:roll={{ delay: delayFor(i), from: -1 }}>{s.char}</span
        >
      {/key}
    </span>
  {/each}
</span>
