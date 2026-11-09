import type { FlipParams } from "svelte/animate";
import { backOut, quintOut } from "svelte/easing";
import { prefersReducedMotion } from "svelte/motion";
import type { TransitionConfig } from "svelte/transition";

/** Close to the `--ease-out` curve in layout.css: quick to respond, gentle to settle. */
export const easeOut = quintOut;

const STEP_MS = 40;
/** Later items all share the last delay, so a long list never feels slow. */
const MAX_STEPS = 6;

/** Delay for the `i`th item of a staggered group. */
export function stagger(i: number, base = 0) {
  return base + Math.min(i, MAX_STEPS) * STEP_MS;
}

/**
 * Fades an element in as it slides a few pixels into place. Uses `translate`,
 * so it composes with `animate:flip` and Tailwind's hover lifts. With reduced
 * motion it's a plain quick fade with no offset or stagger.
 */
export function rise(
  node: Element,
  { delay = 0, duration = 240, x = 0, y = 6 } = {},
): TransitionConfig {
  const opacity = Number(getComputedStyle(node).opacity);
  if (prefersReducedMotion.current) {
    return { duration: 150, css: (t) => `opacity: ${t * opacity}` };
  }
  return {
    delay,
    duration,
    easing: easeOut,
    css: (t, u) => `opacity: ${t * opacity}; translate: ${u * x}px ${u * y}px`,
  };
}

/**
 * Pops a small badge or icon in: it grows from slightly small with a little
 * overshoot, untilting as it lands. With reduced motion it just fades.
 */
export function pop(
  node: Element,
  { delay = 0, duration = 420, scale = 0.6, rotate = -14 } = {},
): TransitionConfig {
  if (prefersReducedMotion.current) {
    return { duration: 150, css: (t) => `opacity: ${t}` };
  }
  return {
    delay,
    duration,
    // overshoot on scale and rotation; opacity follows its own, plain ramp
    easing: backOut,
    css: (t, u) =>
      `opacity: ${Math.min(1, t * 2)}; scale: ${scale + (1 - scale) * t}; rotate: ${u * rotate}deg`,
  };
}

/** Settings for `animate:flip`, so reordered items glide (or jump, for reduced motion). */
export function flipParams(): FlipParams {
  return {
    duration: prefersReducedMotion.current ? 0 : 220,
    easing: easeOut,
  };
}
