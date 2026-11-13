<script>
	// The search and sharing tags for a page. All decisions are made in
	// head.js (and tested there); this only prints them.
	//
	//   <Head {site} {title} {description} {image} type jsonLd noindex
	//         indexable trailingSlash titles />
	//
	// `site` is { url, name, description, ogImage, homeTitle?, locale? }.
	// See buildHead() for every prop.
	import { page } from '$app/state';
	import { buildHead } from './head.js';

	let { site, ...rest } = $props();

	const head = $derived(buildHead({ site, path: page.url.pathname, ...rest }));
</script>

<svelte:head>
	<title>{head.title}</title>
	<meta name="description" content={head.description} />
	<link rel="canonical" href={head.canonical} />
	{#if head.robots}
		<meta name="robots" content={head.robots} />
	{/if}
	{#each head.og as [property, content]}
		<meta {property} {content} />
	{/each}
	{#each head.twitter as [name, content]}
		<meta {name} {content} />
	{/each}
	{#each head.jsonLd as script}
		{@html script}
	{/each}
</svelte:head>
