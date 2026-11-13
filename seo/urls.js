/**
 * URL handling shared by the head, the sitemap and llms.txt. Pure functions,
 * safe in the browser and in Node.
 *
 * trailingSlash mirrors SvelteKit's option of the same name:
 *   'always'  /work → /work/   (paths whose last segment has a file extension,
 *                               like /sitemap.xml, are left alone)
 *   'never'   /work/ → /work
 *   'ignore'  paths are used as given
 * The root is always '/'.
 */

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** 'https://example.com/' → 'https://example.com'. Must be an http(s) origin. */
export function normalizeSiteUrl(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`site.url must be an absolute URL, got ${JSON.stringify(url)}`);
	}
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		throw new Error(`site.url must be http or https, got ${JSON.stringify(url)}`);
	}
	if ((parsed.pathname !== '/' && parsed.pathname !== '') || parsed.search || parsed.hash) {
		throw new Error(`site.url must be an origin with no path, query or hash, got ${JSON.stringify(url)}`);
	}
	return parsed.origin;
}

/** A pathname with a leading slash, no query or hash, and the site's slash policy. */
export function canonicalPath(pathname, trailingSlash = 'ignore') {
	if (!['always', 'never', 'ignore'].includes(trailingSlash)) {
		throw new Error(`trailingSlash must be "always", "never" or "ignore", got ${JSON.stringify(trailingSlash)}`);
	}
	let path = String(pathname ?? '').split(/[?#]/)[0];
	if (!path.startsWith('/')) path = `/${path}`;
	if (path === '/') return '/';
	if (trailingSlash === 'never') return path.replace(/\/+$/, '') || '/';
	if (trailingSlash === 'always') {
		const last = path.split('/').filter(Boolean).pop() ?? '';
		if (/\.[a-z0-9]+$/i.test(last) && !path.endsWith('/')) return path;
		return path.endsWith('/') ? path : `${path}/`;
	}
	return path;
}

/** The absolute canonical URL of a page on the site. */
export function canonicalUrl(siteUrl, pathname, { trailingSlash = 'ignore' } = {}) {
	return `${normalizeSiteUrl(siteUrl)}${canonicalPath(pathname, trailingSlash)}`;
}

/**
 * Turns a root-relative path into an absolute URL on the site. Absolute
 * http(s) URLs pass through, '//cdn.example/x.png' takes the site's scheme,
 * and other schemes (javascript:, data:) are refused.
 */
export function absoluteUrl(siteUrl, value) {
	const origin = normalizeSiteUrl(siteUrl);
	const text = String(value ?? '').trim();
	if (text.startsWith('//')) return `${new URL(origin).protocol}${text}`;
	if (SCHEME.test(text)) {
		if (!/^https?:\/\//i.test(text)) throw new Error(`URL must be http or https, got ${JSON.stringify(text)}`);
		return text;
	}
	return `${origin}${text.startsWith('/') ? '' : '/'}${text}`;
}
