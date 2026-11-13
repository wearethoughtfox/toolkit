import { absoluteUrl } from './urls.js';

/**
 * robots.txt. Allows everything except the paths in `disallow`, and points
 * at the sitemap (pass sitemap: false to leave that out).
 *
 * A build that must not be indexed (a preview) is kept out with the robots
 * meta tag, not here: a crawler blocked by robots.txt never sees the tag.
 */
export function robotsTxt({ siteUrl, disallow = [], sitemap = '/sitemap.xml' } = {}) {
	for (const path of disallow) {
		if (typeof path !== 'string' || !path.startsWith('/') || /[\r\n]/.test(path)) {
			throw new Error(`robots.txt disallow paths must start with "/" and sit on one line, got ${JSON.stringify(path)}`);
		}
	}
	const lines = ['User-agent: *', 'Allow: /', ...disallow.map((path) => `Disallow: ${path}`)];
	let text = lines.join('\n') + '\n';
	if (sitemap !== false) text += `\nSitemap: ${absoluteUrl(siteUrl, sitemap)}\n`;
	return text;
}
