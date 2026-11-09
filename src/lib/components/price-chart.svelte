<script lang="ts">
  import { fade } from "svelte/transition";
  import { useMoney } from "#lib/money.svelte.js";
  import { drawIn, pop } from "#lib/motion.js";

  type Point = { t: number; price: number };
  type Buy = Point & { shares: number };

  let {
    history,
    buys,
    color,
    label,
  }: {
    /** Live prices over time, oldest first, in GBP. */
    history: Point[];
    /** The user's purchases: when, at what price, and how many shares. */
    buys: Buy[];
    /** CSS colour for the price line (the company's accent). */
    color: string;
    /** Accessible name for the chart. */
    label: string;
  } = $props();

  const money = useMoney();

  const HEIGHT = 280;
  const M = { top: 16, right: 16, bottom: 28, left: 56 };
  const DAY = 24 * 60 * 60 * 1000;

  let width = $state(0);
  let innerW = $derived(Math.max(0, width - M.left - M.right));
  const innerH = HEIGHT - M.top - M.bottom;

  // --- scales -----------------------------------------------------------------

  let tDomain = $derived.by(() => {
    const ts = [...history, ...buys].map((p) => p.t);
    let lo = Math.min(...ts);
    let hi = Math.max(...ts);
    // a single moment has no width; give it a day either side
    if (hi - lo < 60_000) [lo, hi] = [lo - DAY, hi + DAY];
    return [lo, hi] as const;
  });

  /** "Nice" axis ticks (1, 2, 5 × 10ⁿ) covering the prices. */
  let yTicks = $derived.by(() => {
    const ps = [...history, ...buys].map((p) => p.price);
    let lo = Math.min(...ps);
    let hi = Math.max(...ps);
    if (hi === lo) [lo, hi] = [lo * 0.95, hi * 1.05 || 1];
    const raw = (hi - lo) / 4;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step =
      [1, 2, 5].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
    const first = Math.floor(lo / step);
    const last = Math.ceil(hi / step);
    // integer steps, rounded, so ticks don't drift into 0.30000000000000004
    return Array.from({ length: last - first + 1 }, (_, i) =>
      Number(((first + i) * step).toFixed(10)),
    );
  });

  let x = $derived((t: number) => {
    const [lo, hi] = tDomain;
    return M.left + ((t - lo) / (hi - lo)) * innerW;
  });
  let y = $derived((price: number) => {
    const lo = yTicks[0];
    const hi = yTicks[yTicks.length - 1];
    return M.top + innerH - ((price - lo) / (hi - lo)) * innerH;
  });

  let tTicks = $derived.by(() => {
    const [lo, hi] = tDomain;
    const count = Math.max(2, Math.min(6, Math.floor(innerW / 110)));
    return Array.from(
      { length: count },
      (_, i) => lo + ((hi - lo) * i) / (count - 1),
    );
  });

  let dateFormat = $derived.by(() => {
    const span = tDomain[1] - tDomain[0];
    if (span < 2 * DAY)
      return new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
    if (span < 300 * DAY)
      return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
      });
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      year: "numeric",
    });
  });
  const fullDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const dayDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

  // --- marks --------------------------------------------------------------------

  let linePath = $derived(
    history.map((p, i) => `${i ? "L" : "M"}${x(p.t)},${y(p.price)}`).join(""),
  );
  let lastPoint = $derived(history.at(-1));
  let areaPath = $derived(
    history.length > 1 && lastPoint
      ? `${linePath}L${x(lastPoint.t)},${M.top + innerH}L${x(history[0].t)},${M.top + innerH}Z`
      : "",
  );

  // --- entrance -----------------------------------------------------------------

  /** How long the line takes to draw in; the marks land in step with it. */
  const DRAW_MS = 700;

  /** When the drawing line reaches `t`, so a purchase pops in as it passes. */
  let reachedAt = $derived(
    (t: number) => DRAW_MS * Math.min(1, Math.max(0, (x(t) - M.left) / innerW)),
  );

  // --- hover / keyboard ---------------------------------------------------------

  type Target = { kind: "price"; point: Point } | { kind: "buy"; point: Buy };

  let targets = $derived<Target[]>(
    [
      ...history.map((point) => ({ kind: "price" as const, point })),
      ...buys.map((point) => ({ kind: "buy" as const, point })),
    ].toSorted((a, b) => a.point.t - b.point.t),
  );
  let active = $state<number>();
  let target = $derived(active === undefined ? undefined : targets[active]);

  function onPointerMove(e: PointerEvent) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    for (let i = 1; i < targets.length; i++)
      if (
        Math.abs(x(targets[i].point.t) - px) <
        Math.abs(x(targets[best].point.t) - px)
      )
        best = i;
    active = best;
  }

  function onKeyDown(e: KeyboardEvent) {
    const last = targets.length - 1;
    const keys: Record<string, number> = {
      ArrowLeft: Math.max(0, (active ?? last + 1) - 1),
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      Home: 0,
      End: last,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    active = keys[e.key];
  }
</script>

<div class="flex flex-col gap-3">
  <!-- legend: two kinds of mark, so identity never relies on colour alone -->
  <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
    <li class="flex items-center gap-1.5">
      <span class="h-0.5 w-4 rounded-full" style:background-color={color}
      ></span>
      Live price
    </li>
    <li class="flex items-center gap-1.5">
      <span class="size-2.5 rounded-full bg-foreground ring-2 ring-card"></span>
      Your purchases
    </li>
  </ul>

  <div class="relative" bind:clientWidth={width}>
    {#if width > 0}
      <!-- focusable on purpose: arrow keys step through the points, with the
           readout below announcing each one -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <svg
        {width}
        height={HEIGHT}
        role="application"
        aria-roledescription="chart"
        aria-label={label}
        aria-describedby="chart-readout"
        tabindex="0"
        class="block touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onpointermove={onPointerMove}
        onpointerleave={() => (active = undefined)}
        onkeydown={onKeyDown}
        onblur={() => (active = undefined)}
      >
        <!-- grid + y axis -->
        {#each yTicks as v (v)}
          <line
            x1={M.left}
            x2={M.left + innerW}
            y1={y(v)}
            y2={y(v)}
            class="stroke-border"
            stroke-width="1"
          />
          <text
            x={M.left - 8}
            y={y(v)}
            dy="0.32em"
            text-anchor="end"
            class="fill-muted-foreground text-xs tabular-nums"
          >
            {money.format(v)}
          </text>
        {/each}

        <!-- x axis -->
        {#each tTicks as t, i (i)}
          <text
            x={x(t)}
            y={HEIGHT - 8}
            text-anchor={i === 0
              ? "start"
              : i === tTicks.length - 1
                ? "end"
                : "middle"}
            class="fill-muted-foreground text-xs"
          >
            {dateFormat.format(t)}
          </text>
        {/each}

        <!-- price: a wash, then the 2px line -->
        {#if areaPath}
          <path
            d={areaPath}
            fill={color}
            fill-opacity="0.1"
            in:fade|global={{ delay: DRAW_MS / 2, duration: DRAW_MS / 2 }}
          />
        {/if}
        {#if history.length > 1}
          <!-- the line draws itself in once the chart has a width to draw at -->
          <path
            in:drawIn|global={{ duration: DRAW_MS }}
            d={linePath}
            fill="none"
            stroke={color}
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        {/if}
        {#if lastPoint}
          <!-- end dot, with a surface ring so it reads where it overlaps -->
          <circle
            cx={x(lastPoint.t)}
            cy={y(lastPoint.price)}
            r="4"
            fill={color}
            class="origin-center stroke-card [transform-box:fill-box]"
            in:pop|global={{ delay: DRAW_MS - 80, scale: 0, rotate: 0 }}
            stroke-width="2"
          />
        {/if}

        <!-- crosshair -->
        {#if target}
          <line
            x1={x(target.point.t)}
            x2={x(target.point.t)}
            y1={M.top}
            y2={M.top + innerH}
            class="stroke-muted-foreground"
            stroke-width="1"
          />
        {/if}

        <!-- purchases on top, in ink so they stand apart from the line -->
        {#each buys as b, i (i)}
          {@const isActive = target?.kind === "buy" && target.point === b}
          <circle
            cx={x(b.t)}
            cy={y(b.price)}
            r={isActive ? 6 : 5}
            class="origin-center fill-foreground stroke-card [transform-box:fill-box]"
            in:pop|global={{ delay: reachedAt(b.t), scale: 0, rotate: 0 }}
            stroke-width="2"
          />
        {/each}

        {#if target?.kind === "price"}
          <circle
            cx={x(target.point.t)}
            cy={y(target.point.price)}
            r="5"
            fill={color}
            class="stroke-card"
            stroke-width="2"
          />
        {/if}
      </svg>

      {#if target}
        {@const left = x(target.point.t)}
        <div
          class="pointer-events-none absolute top-2 z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-tile"
          style:left="{left}px"
          style:translate={left > width / 2 ? "calc(-100% - 8px) 0" : "8px 0"}
        >
          {#if target.kind === "price"}
            <p class="text-muted-foreground">
              {fullDate.format(target.point.t)}
            </p>
            <p class="font-medium tabular-nums">
              {money.format(target.point.price)}
            </p>
          {:else}
            <p class="text-muted-foreground">
              Bought {dayDate.format(target.point.t)}
            </p>
            <p class="font-medium tabular-nums">
              {target.point.shares} × {money.format(target.point.price)}
            </p>
          {/if}
        </div>
      {/if}
    {/if}
  </div>

  <!-- what the tooltip says, for screen readers moving with the arrow keys -->
  <p id="chart-readout" class="sr-only" aria-live="polite">
    {#if target?.kind === "price"}
      {fullDate.format(target.point.t)}: {money.format(target.point.price)}
    {:else if target?.kind === "buy"}
      Bought {target.point.shares} shares on {dayDate.format(target.point.t)} at
      {money.format(target.point.price)}
    {:else}
      Use the left and right arrow keys to read each point.
    {/if}
  </p>
</div>
