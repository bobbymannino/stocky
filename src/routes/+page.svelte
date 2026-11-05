<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="flex min-h-svh items-center justify-center p-4">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title class="text-2xl">Welcome to Stocky</Card.Title>
      <Card.Description>
        {#if data.user}
          Signed in as {data.user.email}
        {:else}
          You're not signed in.
        {/if}
      </Card.Description>
    </Card.Header>
    <Card.Footer>
      {#if data.user}
        <form method="post" action="?/signOut" class="w-full">
          <Button type="submit" variant="outline" class="w-full"
            >Sign out</Button
          >
        </form>
      {:else}
        <Button href="/login" class="w-full">Sign in</Button>
      {/if}
    </Card.Footer>
  </Card.Root>
</div>
