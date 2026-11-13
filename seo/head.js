/**
 * Everything a page puts in <head> for search and sharing, as plain data.
 * Head.svelte renders it; the logic lives here so it can be tested.
 *
 * Titles are each site's own policy. The defaults are "Page | Site" and, on
 * the home page, "Home title | Site" (or just the site name). A site that
 * words them differently passes `titles`:
 *   titles: { document: (title) => …, social: (title) => … }
 * `document` is the <title> and twitter:title; `social` is og:title.
 */

import { absoluteUrl, canonicalUrl, normalizeSiteUrl } from './urls.js';

/**
 * The robots meta content, or null when the page may be indexed.
 * A page is kept out by its own `noindex`, or when the whole build is not
 * `indexable` (previews, branch deploys).
 */
export function robotsMeta({ noindex = false, indexable = true } = {}) {
	return noindex || !indexable ? 'noindex, nofollow' : null;
}

/**
 * A <script type="application/ld+json"> element for the head. `<`, `>`, `&`
 * and the two line separators are written as \u escapes, so no value can end
 * the script element or break a JS parser reading it.
 */
export function jsonLdScript(data) {
	const json = JSON.stringify(data);
	if (json === undefined) throw new Error('JSON-LD must be JSON-serialisable');
	const safe = json
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
	return `<script type="application/ld+json">${safe}</script>`;
}

export function defaultTitles(site) {
	const home = site.homeTitle ? `${site.homeTitle} | ${site.name}` : site.name;
	return {
		document: (title) => (title ? `${title} | ${site.name}` : home),
		social: (title) => title ?? site.homeTitle ?? site.name
	};
}

/**
 * @param {object} input
 * @param {{url: string, name: string, description: string, ogImage: string, homeTitle?: string, locale?: string}} input.site
 * @param {string} input.path               the page's pathname
 * @param {string} [input.title]
 * @param {string} [input.description]      defaults to site.description
 * @param {string} [input.image]            defaults to site.ogImage
 * @param {string} [input.type]             og:type
 * @param {object|object[]} [input.jsonLd]
 * @param {boolean} [input.noindex]
 * @param {boolean} [input.indexable]       false for builds that must not be indexed
 * @param {'always'|'never'|'ignore'} [input.trailingSlash]
 * @param {string} [input.twitterCard]
 * @param {{document?: Function, social?: Function}} [input.titles]
 */
export function buildHead({
	site,
	path,
	title,
	description = site.description,
	image = site.ogImage,
	type = 'website',
	jsonLd,
	noindex = false,
	indexable = true,
	trailingSlash = 'ignore',
	twitterCard = 'summary_large_image',
	titles = {}
}) {
	normalizeSiteUrl(site.url);
	const names = { ...defaultTitles(site), ...titles };
	const documentTitle = names.document(title);
	const socialTitle = names.social(title);
	const canonical = canonicalUrl(site.url, path, { trailingSlash });
	const imageUrl = absoluteUrl(site.url, image);

	return {
		title: documentTitle,
		description,
		canonical,
		robots: robotsMeta({ noindex, indexable }),
		og: [
			['og:site_name', site.name],
			['og:type', type],
			['og:title', socialTitle],
			['og:description', description],
			['og:url', canonical],
			['og:image', imageUrl],
			['og:locale', site.locale ?? 'en_GB']
		],
		twitter: [
			['twitter:card', twitterCard],
			['twitter:title', documentTitle],
			['twitter:description', description],
			['twitter:image', imageUrl]
		],
		jsonLd: jsonLd === undefined ? [] : (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map(jsonLdScript)
	};
}
