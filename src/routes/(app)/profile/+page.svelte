<script lang="ts">
  import CrownIcon from "@lucide/svelte/icons/crown";
  import GitBranchIcon from "@lucide/svelte/icons/git-branch";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import { onMount } from "svelte";
  import { APP_VERSION, BUILT_AT, REPO_URL } from "#lib/app-info.js";
  import NumberRoll from "#lib/components/number-roll.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import { Separator } from "#lib/components/ui/separator/index.js";
  import VipBadge from "#lib/components/vip-badge.svelte";
  import { useMoney } from "#lib/money.svelte.js";
  import { pop, rise, stagger } from "#lib/motion.js";
  import {
    APPEARANCE_LABELS,
    APPEARANCES,
    applyTheme,
    CURRENCY_MODE_LABELS,
    CURRENCY_MODES,
    DARK_THEMES,
    LIGHT_THEMES,
    THEME_LABELS,
    type CurrencyMode,
    type ThemePreferences,
  } from "#lib/preferences.js";
  import {
    setCurrencyMode,
    setThemePreferences,
  } from "#lib/remote/preferences.remote.js";
  import { cn, formatMoney, formatPercent } from "#lib/utils.js";
  import { refreshAll } from "$app/navigation";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let user = $derived(data.user);

  const money = useMoney();
  let summary = $derived(data.holdings);

  // what's picked, shown straight away while it saves
  // svelte-ignore state_referenced_locally
  let currencyMode = $state<CurrencyMode>(data.preferences.currencyMode);
  let saving = $state(false);
  let saveError = $state<string>();

  async function changeCurrencyMode(value: string) {
    const previous = currencyMode;
    currencyMode = value as CurrencyMode;
    saving = true;
    saveError = undefined;
    try {
      await setCurrencyMode(currencyMode);
      // reloads the layout's preferences, so every page formats the new way
      await refreshAll();
    } catch {
      currencyMode = previous;
      saveError = "Couldn't save your preference. Please try again.";
    } finally {
      saving = false;
    }
  }

  // svelte-ignore state_referenced_locally
  let theme = $state<ThemePreferences>({
    appearance: data.preferences.appearance,
    lightTheme: data.preferences.lightTheme,
    darkTheme: data.preferences.darkTheme,
  });
  let themeSaving = $state(false);
  let themeError = $state<string>();

  /** Shows the new theme straight away, then saves it; undone if saving fails. */
  async function changeTheme(changes: Partial<ThemePreferences>) {
    const previous = { ...theme };
    theme = { ...theme, ...changes };
    applyTheme(theme);
    themeSaving = true;
    themeError = undefined;
    try {
      await setThemePreferences(changes);
      await refreshAll();
    } catch {
      theme = previous;
      applyTheme(theme);
      themeError = "Couldn't save your theme. Please try again.";
    } finally {
      themeSaving = false;
    }
  }

  /** e.g. "45.00p, £1.23", or "£0.4500, £1.2345" for always £. */
  const example = (mode: CurrencyMode) =>
    [0.45, 1.2345].map((n) => formatMoney(n, mode)).join(", ");

  /** Up to two letters from the name (or email), for the avatar. */
  let initials = $derived(
    (user.name.trim() || user.email)
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join(""),
  );

  const formatDate = (date: Date, timeZone?: string) =>
    date.toLocaleDateString(undefined, { dateStyle: "long", timeZone });

  let vipSince = $derived(user.vipSince ?? undefined);

  // the server renders in UTC; switch to the viewer's timezone in the browser
  let timeZone = $state<string | undefined>("UTC");
  onMount(() => (timeZone = undefined));
  let joined = $derived(formatDate(user.createdAt, timeZone));
  let vipSinceText = $derived(vipSince && formatDate(vipSince, timeZone));
  let builtAtText = $derived(
    BUILT_AT?.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }),
  );

  /** The page's sections rise in top to bottom; this is each one's place in line. */
  let step = $derived((n: number) => stagger(n + (vipSince ? 1 : 0)));
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
  <div class="flex items-center gap-4" in:rise|global>
    <!-- VIPs get a gold ring around their avatar -->
    <div
      class={cn(
        "shrink-0 rounded-full",
        vipSince && "bg-gold-gradient p-0.75 shadow-md shadow-gold/30",
      )}
    >
      {#if user.image}
        <img
          src={user.image}
          alt=""
          class="size-16 rounded-full border object-cover"
        />
      {:else}
        <span
          aria-hidden="true"
          class="flex size-16 items-center justify-center rounded-full border bg-accent text-xl font-semibold"
        >
          {initials}
        </span>
      {/if}
    </div>
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <h1 class="truncate text-2xl font-semibold">{user.name}</h1>
        {#if vipSince}
          <VipBadge />
        {/if}
      </div>
      <p class="truncate text-sm text-muted-foreground">{user.email}</p>
    </div>
  </div>

  {#if vipSince}
    <!-- a gold-edged card: the gradient shows through as a 1px border. It rises
         in, then its crown pops in once it has nearly landed -->
    <div
      in:rise|global={{ delay: stagger(1), y: 8, duration: 320 }}
      class="rounded-xl bg-gold-gradient p-px shadow-lg shadow-gold/20"
    >
      <div
        class="relative flex items-center gap-4 overflow-hidden rounded-[calc(var(--radius-xl)-1px)] bg-card bg-linear-to-br from-gold/15 via-card to-card p-5"
      >
        <span
          in:pop|global={{ delay: stagger(1, 160) }}
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-gold-ink shadow-inner"
          aria-hidden="true"
        >
          <CrownIcon class="size-6" />
        </span>
        <div class="min-w-0">
          <p class="text-gold-gradient text-lg font-semibold">VIP member</p>
          <p class="text-sm text-muted-foreground">
            Since <time datetime={vipSince.toISOString()}>{vipSinceText}</time>.
            Thanks for being one of our best.
          </p>
        </div>
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 animate-gold-shine bg-linear-to-r from-transparent via-gold-light/20 to-transparent"
        ></span>
      </div>
    </div>
  {/if}

  <div in:rise|global={{ delay: step(1) }}>
    <Card.Root>
      <Card.Header>
        <Card.Title>Account details</Card.Title>
      </Card.Header>
      <Card.Content>
        <dl class="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-[auto_1fr]">
          <dt class="text-muted-foreground">Name</dt>
          <dd class="font-medium">{user.name}</dd>
          <dt class="text-muted-foreground">Email</dt>
          <dd class="font-medium">{user.email}</dd>
          <dt class="text-muted-foreground">Member since</dt>
          <dd class="font-medium">
            <time
              datetime={user.createdAt.toISOString()}
              title={user.createdAt.toISOString()}>{joined}</time
            >
          </dd>
        </dl>
      </Card.Content>
    </Card.Root>
  </div>

  <dl class="grid grid-cols-2 gap-4">
    {#each [{ label: "Purchases", value: data.totals.purchases }, { label: "Companies", value: data.totals.companies }] as stat, i (stat.label)}
      <div
        in:rise|global={{ delay: step(2 + i) }}
        class="rounded-lg border bg-card p-4 shadow-tile inset-shadow-highlight"
      >
        <dt class="text-xs text-muted-foreground">{stat.label}</dt>
        <dd class="text-lg font-semibold tabular-nums">{stat.value}</dd>
      </div>
    {/each}
  </dl>

  <div in:rise|global={{ delay: step(4) }}>
    <Card.Root>
      <Card.Header>
        <Card.Title>Total holdings</Card.Title>
        <Card.Description>
          {#if summary.holdings === 0}
            Add a purchase to see your totals.
          {:else if summary.unpriced > 0}
            Value and gain leave out {summary.unpriced}
            {summary.unpriced === 1 ? "company" : "companies"} without a price. Set
            one on the
            <a href="/" class="underline hover:text-foreground"
              >portfolio page</a
            >.
          {:else}
            Using the latest prices saved on your portfolio. Wishlist trades
            aren't included.
          {/if}
        </Card.Description>
      </Card.Header>
      {#if summary.holdings > 0}
        <Card.Content>
          <dl class="grid gap-4 sm:grid-cols-3">
            <div>
              <dt class="text-xs text-muted-foreground">Invested (inc. tax)</dt>
              <dd class="text-lg font-semibold tabular-nums">
                <NumberRoll value={money.format(summary.invested)} />
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Value</dt>
              <dd class="text-lg font-semibold tabular-nums">
                {#if summary.value === undefined}
                  —
                {:else}
                  <NumberRoll value={money.format(summary.value)} />
                {/if}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Gain / loss</dt>
              <dd
                class={cn(
                  "text-lg font-semibold tabular-nums",
                  summary.gain !== undefined &&
                    summary.gain > 0 &&
                    "text-ctp-green",
                  summary.gain !== undefined &&
                    summary.gain < 0 &&
                    "text-ctp-red",
                )}
              >
                {#if summary.gain === undefined}
                  —
                {:else}
                  <NumberRoll value={money.signed(summary.gain)} />
                  {#if summary.gainPercent !== undefined}
                    <span class="text-xs">
                      <NumberRoll
                        value="({formatPercent(summary.gainPercent)})"
                      />
                    </span>
                  {/if}
                {/if}
              </dd>
            </div>
          </dl>
        </Card.Content>
      {/if}
    </Card.Root>
  </div>

  <div in:rise|global={{ delay: step(5) }}>
    <Card.Root>
      <Card.Header>
        <Card.Title>Preferences</Card.Title>
        <Card.Description
          >Saved to your account as soon as you change them.</Card.Description
        >
      </Card.Header>
      <Card.Content class="grid gap-2">
        <Label for="currency-mode">Currency</Label>
        <Select.Root
          type="single"
          value={currencyMode}
          onValueChange={changeCurrencyMode}
          disabled={saving}
        >
          <Select.Trigger
            id="currency-mode"
            class="w-full sm:w-72"
            aria-describedby="currency-mode-note"
          >
            {CURRENCY_MODE_LABELS[currencyMode]}
          </Select.Trigger>
          <Select.Content>
            {#each CURRENCY_MODES as mode (mode)}
              <Select.Item value={mode} label={CURRENCY_MODE_LABELS[mode]}>
                {CURRENCY_MODE_LABELS[mode]}
                <span
                  class="ml-auto text-xs text-muted-foreground tabular-nums"
                >
                  {example(mode)}
                </span>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <p
          id="currency-mode-note"
          class={saveError
            ? "text-xs text-destructive"
            : "text-xs text-muted-foreground"}
          aria-live="polite"
        >
          {saveError ??
            (saving ? "Saving…" : `Amounts look like ${example(currencyMode)}`)}
        </p>

        <Separator class="my-2" />

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="grid gap-2">
            <Label for="appearance">Appearance</Label>
            <Select.Root
              type="single"
              value={theme.appearance}
              onValueChange={(v) =>
                changeTheme({
                  appearance: v as ThemePreferences["appearance"],
                })}
              disabled={themeSaving}
            >
              <Select.Trigger id="appearance" class="w-full">
                {APPEARANCE_LABELS[theme.appearance]}
              </Select.Trigger>
              <Select.Content>
                {#each APPEARANCES as a (a)}
                  <Select.Item value={a} label={APPEARANCE_LABELS[a]}>
                    {APPEARANCE_LABELS[a]}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <Label for="light-theme">Light theme</Label>
            <Select.Root
              type="single"
              value={theme.lightTheme}
              onValueChange={(v) =>
                changeTheme({
                  lightTheme: v as ThemePreferences["lightTheme"],
                })}
              disabled={themeSaving}
            >
              <Select.Trigger id="light-theme" class="w-full">
                {THEME_LABELS[theme.lightTheme]}
              </Select.Trigger>
              <Select.Content>
                {#each LIGHT_THEMES as t (t)}
                  <Select.Item value={t} label={THEME_LABELS[t]}>
                    {THEME_LABELS[t]}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <Label for="dark-theme">Dark theme</Label>
            <Select.Root
              type="single"
              value={theme.darkTheme}
              onValueChange={(v) =>
                changeTheme({ darkTheme: v as ThemePreferences["darkTheme"] })}
              disabled={themeSaving}
            >
              <Select.Trigger id="dark-theme" class="w-full">
                {THEME_LABELS[theme.darkTheme]}
              </Select.Trigger>
              <Select.Content>
                {#each DARK_THEMES as t (t)}
                  <Select.Item value={t} label={THEME_LABELS[t]}>
                    {THEME_LABELS[t]}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
        <p
          class={themeError
            ? "text-xs text-destructive"
            : "text-xs text-muted-foreground"}
          aria-live="polite"
        >
          {themeError ??
            (themeSaving
              ? "Saving…"
              : theme.appearance === "system"
                ? "Follows your device, using the light or dark theme to match."
                : `Always ${theme.appearance}, using the ${theme.appearance} theme.`)}
        </p>
      </Card.Content>
    </Card.Root>
  </div>

  <form
    method="post"
    action="?/signOut"
    class="flex justify-end"
    in:rise|global={{ delay: step(6) }}
  >
    <Button type="submit" variant="destructive">
      <LogOutIcon />
      Sign out
    </Button>
  </form>

  <section
    aria-label="About Stocky"
    class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t pt-6 text-sm text-muted-foreground"
    in:rise|global={{ delay: step(7) }}
  >
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
      href="{REPO_URL}/releases/tag/v{APP_VERSION}"
      target="_blank"
      rel="noopener noreferrer"
      class="font-mono text-xs transition-colors hover:text-foreground"
      title="Release notes for v{APP_VERSION}"
    >
      v{APP_VERSION}
    </a>
    {#if BUILT_AT}
      <span class="text-xs">
        Built <time
          datetime={BUILT_AT.toISOString()}
          title={BUILT_AT.toISOString()}>{builtAtText}</time
        >
      </span>
    {/if}
  </section>
</div>
