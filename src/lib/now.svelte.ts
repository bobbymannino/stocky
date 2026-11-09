import { onMount } from "svelte";

/**
 * The current time, ticking every `interval` ms. `undefined` until mounted, so
 * anything shown in the viewer's time zone only renders in the browser (the
 * server doesn't know their zone). Call during component init.
 */
export function useNow(interval = 1000) {
  let now = $state<number>();
  onMount(() => {
    now = Date.now();
    const id = setInterval(() => (now = Date.now()), interval);
    return () => clearInterval(id);
  });
  return {
    get current() {
      return now;
    },
  };
}
