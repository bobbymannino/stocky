<script lang="ts">
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import MenuIcon from "@lucide/svelte/icons/menu";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import logo from "#lib/assets/stocky-logo.png?enhanced";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Sheet from "#lib/components/ui/sheet/index.js";
  import { cn } from "#lib/utils.js";
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";

  let { user }: { user: { email: string } } = $props();

  const NAV = [
    { href: "/", label: "Portfolio" },
    { href: "/purchases", label: "Purchases" },
    { href: "/search", label: "Search" },
  ];

  let menuOpen = $state(false);

  // following a link from the menu should leave it closed on the new page
  afterNavigate(() => (menuOpen = false));
</script>

{#snippet navLinks(stacked: boolean)}
  {#each NAV as item (item.href)}
    {@const current = page.url.pathname === item.href}
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
  {/each}
{/snippet}

{#snippet signOut(stacked: boolean)}
  <form method="post" action="/?/signOut" class={cn(stacked && "w-full")}>
    <Button
      type="submit"
      variant="destructive"
      size={stacked ? "default" : "sm"}
      class={cn(stacked && "w-full")}
      title="Sign out of {user.email}"
    >
      <LogOutIcon />
      Sign out
    </Button>
  </form>
{/snippet}

<header class="border-b">
  <div
    class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 p-4"
  >
    <a href="/" class="flex items-center gap-2 text-lg font-semibold">
      <enhanced:img
        src={logo}
        alt="Stocky logo"
        class="size-7"
        fetchpriority="high"
        loading="eager"
      />
      Stocky
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
      {@render signOut(false)}
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
          <Sheet.Title>Menu</Sheet.Title>
          <Sheet.Description class="truncate">{user.email}</Sheet.Description>
        </Sheet.Header>
        <nav aria-label="Main" class="flex flex-col gap-1 px-4">
          {@render navLinks(true)}
        </nav>
        <Sheet.Footer>
          <Button href="/purchases/new">
            <PlusIcon />
            Add purchase
          </Button>
          {@render signOut(true)}
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet.Root>
  </div>
</header>
