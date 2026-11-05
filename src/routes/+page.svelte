<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Welcome to SvelteKit</h1>
{#if data.user}
	<p>Signed in as {data.user.email}</p>
	<form method="post" action="?/signOut"><button>Sign out</button></form>
{:else}
	<a href="/login">Sign in</a>
{/if}
