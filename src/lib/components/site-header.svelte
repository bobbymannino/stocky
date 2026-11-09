<script lang="ts">
  import MenuIcon from "@lucide/svelte/icons/menu";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import UserIcon from "@lucide/svelte/icons/user";
  import logo from "#lib/assets/stocky-logo.png?enhanced";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Sheet from "#lib/components/ui/sheet/index.js";
  import VipBadge from "#lib/components/vip-badge.svelte";
  import { rise, stagger } from "#lib/motion.js";
  import { cn } from "#lib/utils.js";
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";

  let { user }: { user: { email: string; vipSince?: Date | null } } = $props();

  let vip = $derived(Boolean(user.vipSince));

  const NAV = [
    { href: "/", label: "Portfolio" },
    { href: "/purchases", label: "Purchases" },
    { href: "/search", label: "Search" },
  ];
  const PROFILE = { href: "/profile", label: "Profile" };

  let menuOpen = $state(false);

  // following a link from the menu should leave it closed on the new page
  afterNavigate(() => (menuOpen = false));
</script>

{#snippet navLinks(stacked: boolean, items = NAV)}
  {#each items as item, i (item.href)}
    {@const current = page.url.pathname === item.href}
    {#if stacked}
      <!-- the menu's links follow the sheet in, one after another -->
      <div
        class="flex flex-col"
        in:rise|global={{ delay: stagger(i, 60), x: 8, y: 0 }}
      >
        {@render link(item, current, stacked)}
      </div>
    {:else}
      {@render link(item, current, stacked)}
    {/if}
  {/each}
{/snippet}

{#snippet link(item: (typeof NAV)[number], current: boolean, stacked: boolean)}
  <Button
    href={item.href}
    variant="ghost"
    size={stacked ? "default" : "sm"}
    aria-current={current ? "page" : undefined}
    class={cn(
      stacked && "justify-start",
      current ? "bg-accent text-foreground" : "text-muted-foreground",
    )}
  >
    {item.label}
  </Button>
{/snippet}

<header class={cn("relative border-b", vip && "border-transparent")}>
  {#if vip}
    <!-- VIPs get a gold rule in place of the plain border -->
    <div
      aria-hidden="true"
      class="absolute inset-x-0 bottom-0 h-0.5 bg-gold-gradient opacity-80"
    ></div>
  {/if}
  <div
    class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 p-4"
  >
    <a href="/" class="flex items-center gap-2 text-lg font-semibold">
      <enhanced:img
        src={logo}
        alt="Stocky logo"
        class="size-5"
        fetchpriority="high"
        loading="eager"
      />
      <span class={cn(vip && "text-gold-gradient")}>Stocky</span>
      {#if vip}
        <VipBadge />
      {/if}
    </a>

    <!-- wide screens: everything inline -->
    <nav aria-label="Main" class="mr-auto hidden items-center gap-1 sm:flex">
      {@render navLinks(false)}
    </nav>
    <div class="hidden items-center gap-2 sm:flex">
      <Button href="/purchases/new" size="sm">
        <PlusIcon />
        Add purchase
      </Button>
      <Button
        href={PROFILE.href}
        variant="ghost"
        size="icon-sm"
        aria-label="Profile"
        title="Profile"
        aria-current={page.url.pathname === PROFILE.href ? "page" : undefined}
        class={cn(
          page.url.pathname === PROFILE.href && "bg-accent",
          vip && "text-gold ring-2 ring-gold/70",
        )}
      >
        <UserIcon />
      </Button>
    </div>

    <!-- narrow screens: the same links in a slide-in menu -->
    <Sheet.Root bind:open={menuOpen}>
      <Sheet.Trigger>
        {#snippet child({ props })}
          <Button {...props} variant="ghost" size="icon" class="sm:hidden">
            <MenuIcon />
            <span class="sr-only">Open menu</span>
          </Button>
        {/snippet}
      </Sheet.Trigger>
      <Sheet.Content side="right" class="w-72">
        <Sheet.Header>
          <Sheet.Title class="flex items-center gap-2">
            Menu
            {#if vip}
              <VipBadge />
            {/if}
          </Sheet.Title>
        </Sheet.Header>
        <nav aria-label="Main" class="flex flex-col gap-1 px-4">
          {@render navLinks(true, [...NAV, PROFILE])}
        </nav>
        <Sheet.Footer>
          <Button href="/purchases/new">
            <PlusIcon />
            Add purchase
          </Button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet.Root>
  </div>
</header>
