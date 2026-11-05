<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Card from "#lib/components/ui/card/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import type { PageProps } from "./$types";

  let { form }: PageProps = $props();
</script>

<div class="flex min-h-svh items-center justify-center p-4">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title class="text-2xl">Sign in</Card.Title>
      <Card.Description>
        Use your email and password, or create an account.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        id="auth-form"
        method="post"
        action="?/signIn"
        use:enhance
        class="flex flex-col gap-4"
      >
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input id="name" name="name" placeholder="Sign up only" />
        </div>
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            value={form?.email ?? ""}
          />
        </div>
        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minlength={8}
          />
        </div>
        {#if form?.message}
          <p class="text-sm text-destructive">{form.message}</p>
        {/if}
      </form>
    </Card.Content>
    <Card.Footer class="flex gap-2">
      <Button type="submit" form="auth-form" class="flex-1">Sign in</Button>
      <Button
        type="submit"
        form="auth-form"
        formaction="?/signUp"
        variant="outline"
        class="flex-1">Sign up</Button
      >
    </Card.Footer>
  </Card.Root>
</div>
