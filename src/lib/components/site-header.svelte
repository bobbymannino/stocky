<script lang="ts">
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import logo from "#lib/assets/stocky-logo.png?enhanced";
  import { Button } from "#lib/components/ui/button/index.js";
  import { cn } from "#lib/utils.js";
  import { page } from "$app/state";

  let { user }: { user: { email: string } } = $props();

  const NAV = [
    { href: "/", label: "Portfolio" },
    { href: "/purchases", label: "Purchases" },
  ];
</script>

<header class="border-b">
  <div
    class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 p-4"
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
    <nav aria-label="Main" class="flex items-center gap-1 sm:mr-auto">
      {#each NAV as item (item.href)}
        {@const current = page.url.pathname === item.href}
        <Button
          href={item.href}
          variant="ghost"
          size="sm"
          aria-current={current ? "page" : undefined}
          class={cn(
            current ? "bg-accent text-foreground" : "text-muted-foreground",
          )}
        >
          {item.label}
        </Button>
      {/each}
    </nav>
    <div class="flex items-center gap-2">
      <Button href="/purchases/new" size="sm">
        <PlusIcon />
        Add purchase
      </Button>
      <form method="post" action="/?/signOut">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          title="Sign out of {user.email}"
        >
          <LogOutIcon />
          Sign out
        </Button>
      </form>
    </div>
  </div>
</header>
