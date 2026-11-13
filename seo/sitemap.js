/**
 * sitemap.xml from a list of entries.
 *
 *   sitemapXml({ siteUrl, trailingSlash: 'always', entries: [
 *     { path: '/' , priority: 1 },
 *     { path: '/blog/hello', lastmod: post.date },   // a real date, or none
 *     { path: '/private', noindex: true }            // left out
 *   ] })
 *
 * lastmod is written only when an entry has a real date (a Date, or a
 * YYYY-MM-DD / full W3C datetime string). Don't pass today's date for pages
 * that haven't changed: crawlers learn to ignore a lastmod that is always now.
 * Entries marked noindex are left out, duplicates (after the slash policy)
 * keep their first appearance.
 */

import { canonicalUrl } from './urls.js';
import { escapeXml } from './xml.js';

const MAX_URLS = 50000;
const CHANGEFREQ = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
const W3C_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

function formatLastmod(value, path) {
	if (value === undefined || value === null || value === '') return null;
	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) throw new Error(`Sitemap entry ${path}: lastmod is an invalid Date`);
		return value.toISOString().slice(0, 10);
	}
	if (typeof value === 'string' && W3C_DATE.test(value) && !Number.isNaN(Date.parse(value.slice(0, 10)))) {
		return value;
	}
	throw new Error(`Sitemap entry ${path}: lastmod ${JSON.stringify(value)} is not a date (use YYYY-MM-DD)`);
}

function formatPriority(value, path) {
	if (value === undefined || value === null) return null;
	const number = Number(value);
	if (!Number.isFinite(number) || number < 0 || number > 1) {
		throw new Error(`Sitemap entry ${path}: priority must be between 0 and 1`);
	}
	return number.toFixed(1);
}

export function sitemapXml({ siteUrl, entries, trailingSlash = 'ignore' }) {
	const seen = new Set();
	const urls = [];
	for (const entry of entries) {
		if (entry.noindex) continue;
		const loc = canonicalUrl(siteUrl, entry.path, { trailingSlash });
		if (seen.has(loc)) continue;
		seen.add(loc);
		if (entry.changefreq !== undefined && !CHANGEFREQ.has(entry.changefreq)) {
			throw new Error(`Sitemap entry ${entry.path}: unknown changefreq ${JSON.stringify(entry.changefreq)}`);
		}
		const lastmod = formatLastmod(entry.lastmod, entry.path);
		const priority = formatPriority(entry.priority, entry.path);
		urls.push(
			[
				'  <url>',
				`    <loc>${escapeXml(loc)}</loc>`,
				lastmod && `    <lastmod>${lastmod}</lastmod>`,
				entry.changefreq && `    <changefreq>${entry.changefreq}</changefreq>`,
				priority && `    <priority>${priority}</priority>`,
				'  </url>'
			]
				.filter(Boolean)
				.join('\n')
		);
	}
	if (urls.length > MAX_URLS) {
		throw new Error(`A sitemap holds at most ${MAX_URLS} URLs, got ${urls.length}; split it into an index`);
	}
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
