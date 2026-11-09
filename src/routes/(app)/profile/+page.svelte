<script lang="ts">
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import { onMount } from "svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import {
    CURRENCY_MODE_LABELS,
    CURRENCY_MODES,
    type CurrencyMode,
  } from "#lib/preferences.js";
  import { setCurrencyMode } from "#lib/remote/preferences.remote.js";
  import { formatMoney } from "#lib/utils.js";
  import { refreshAll } from "$app/navigation";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let user = $derived(data.user);

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

  const formatJoined = (timeZone?: string) =>
    user.createdAt.toLocaleDateString(undefined, {
      dateStyle: "long",
      timeZone,
    });

  // the server renders in UTC; switch to the viewer's timezone in the browser
  // svelte-ignore state_referenced_locally
  let joined = $state(formatJoined("UTC"));
  onMount(() => (joined = formatJoined()));
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
  <div class="flex items-center gap-4">
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
    <div class="min-w-0">
      <h1 class="truncate text-2xl font-semibold">{user.name}</h1>
      <p class="truncate text-sm text-muted-foreground">{user.email}</p>
    </div>
  </div>

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

  <dl class="grid grid-cols-2 gap-4">
    {#each [{ label: "Purchases", value: data.totals.purchases }, { label: "Companies", value: data.totals.companies }] as stat (stat.label)}
      <div
        class="rounded-lg border bg-card p-4 shadow-tile inset-shadow-highlight"
      >
        <dt class="text-xs text-muted-foreground">{stat.label}</dt>
        <dd class="text-lg font-semibold tabular-nums">{stat.value}</dd>
      </div>
    {/each}
  </dl>

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
              <span class="ml-auto text-xs text-muted-foreground tabular-nums">
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
    </Card.Content>
  </Card.Root>

  <form method="post" action="?/signOut" class="flex justify-end">
    <Button type="submit" variant="destructive">
      <LogOutIcon />
      Sign out
    </Button>
  </form>
</div>
