<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<form method="post" action="?/signIn" use:enhance class="mx-auto mt-16 flex max-w-sm flex-col gap-3">
	<h1 class="text-2xl font-semibold">Sign in</h1>
	<input name="name" placeholder="Name (sign up only)" class="rounded border px-3 py-2" />
	<input name="email" type="email" required placeholder="Email" value={form?.email ?? ''} class="rounded border px-3 py-2" />
	<input name="password" type="password" required minlength="8" placeholder="Password" class="rounded border px-3 py-2" />
	{#if form?.message}<p class="text-sm text-ctp-red">{form.message}</p>{/if}
	<div class="flex gap-2">
		<button class="flex-1 rounded bg-ctp-mauve px-3 py-2 text-ctp-base">Sign in</button>
		<button formaction="?/signUp" class="flex-1 rounded border border-ctp-surface1 px-3 py-2">Sign up</button>
	</div>
</form>
