import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	absoluteUrl, buildHead, canonicalPath, canonicalUrl, escapeXml, jsonLdScript,
	llmsTxt, normalizeSiteUrl, robotsMeta, robotsTxt, sitemapXml
} from '@thoughtfox/toolkit/seo';

const site = {
	name: 'Example Studio',
	url: 'https://www.example.com',
	description: 'A studio.',
	ogImage: '/og.png',
	homeTitle: 'Hello, we make things'
};

// URLs

test('site URLs are origins; trailing slashes are dropped', () => {
	assert.equal(normalizeSiteUrl('https://www.example.com/'), 'https://www.example.com');
	assert.equal(normalizeSiteUrl('http://localhost:5173'), 'http://localhost:5173');
	for (const bad of ['example.com', '/relative', 'ftp://example.com', 'https://example.com/blog', 'https://example.com/?a=1', '', undefined]) {
		assert.throws(() => normalizeSiteUrl(bad), /site\.url/);
	}
});

test('trailing slash policy: always', () => {
	assert.equal(canonicalPath('/', 'always'), '/');
	assert.equal(canonicalPath('/work', 'always'), '/work/');
	assert.equal(canonicalPath('/work/', 'always'), '/work/');
	assert.equal(canonicalPath('/sitemap.xml', 'always'), '/sitemap.xml');
	assert.equal(canonicalPath('/a.b/c', 'always'), '/a.b/c/');
});

test('trailing slash policy: never', () => {
	assert.equal(canonicalPath('/', 'never'), '/');
	assert.equal(canonicalPath('/work/', 'never'), '/work');
	assert.equal(canonicalPath('/work//', 'never'), '/work');
});

test('trailing slash policy: ignore keeps the path as given, but adds the leading slash', () => {
	assert.equal(canonicalPath('/work/', 'ignore'), '/work/');
	assert.equal(canonicalPath('work', 'ignore'), '/work');
	assert.equal(canonicalPath('', 'ignore'), '/');
});

test('canonical URLs drop query strings and hashes, and unknown policies throw', () => {
	assert.equal(canonicalUrl('https://x.com/', '/blog?page=2#top', { trailingSlash: 'always' }), 'https://x.com/blog/');
	assert.throws(() => canonicalPath('/a', 'sometimes'), /trailingSlash/);
});

test('absoluteUrl resolves paths and passes http(s) through', () => {
	assert.equal(absoluteUrl(site.url, '/og.png'), 'https://www.example.com/og.png');
	assert.equal(absoluteUrl(site.url, 'og.png'), 'https://www.example.com/og.png');
	assert.equal(absoluteUrl(site.url, 'https://cdn.example.net/a.png'), 'https://cdn.example.net/a.png');
	assert.equal(absoluteUrl(site.url, '//cdn.example.net/a.png'), 'https://cdn.example.net/a.png');
});

test('absoluteUrl does not mistake a file called http-thing.png for a URL', () => {
	assert.equal(absoluteUrl(site.url, 'httpd.png'), 'https://www.example.com/httpd.png');
});

test('absoluteUrl refuses other schemes', () => {
	for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'file:///etc/passwd']) {
		assert.throws(() => absoluteUrl(site.url, bad), /http or https/);
	}
});

// Escaping

test('escapeXml escapes the five characters and drops ones XML cannot hold', () => {
	assert.equal(escapeXml(`a&b <c> "d" 'e'`), 'a&amp;b &lt;c&gt; &quot;d&quot; &apos;e&apos;');
	assert.equal(escapeXml('a\u0000b\u000Bc\u001Fd'), 'abcd');
	assert.equal(escapeXml('tab\tnewline\n'), 'tab\tnewline\n');
	assert.equal(escapeXml('&amp;'), '&amp;amp;');
});

test('JSON-LD cannot close its script element or smuggle markup', () => {
	const script = jsonLdScript({ name: '</script><script>alert(1)</script>', note: 'a & b', sep: 'x\u2028y' });
	const inner = script.slice('<script type="application/ld+json">'.length, -'</script>'.length);
	assert.ok(!/[<>&\u2028\u2029]/.test(inner));
	assert.deepEqual(JSON.parse(inner), { name: '</script><script>alert(1)</script>', note: 'a & b', sep: 'x\u2028y' });
	assert.equal(script.match(/<\/script>/g).length, 1);
});

test('JSON-LD that cannot be serialised throws', () => {
	assert.throws(() => jsonLdScript(undefined), /serialisable/);
});

// Indexability

test('robotsMeta: indexable by default; noindex or a non-indexable build keeps pages out', () => {
	assert.equal(robotsMeta(), null);
	assert.equal(robotsMeta({ noindex: false, indexable: true }), null);
	assert.equal(robotsMeta({ noindex: true }), 'noindex, nofollow');
	assert.equal(robotsMeta({ indexable: false }), 'noindex, nofollow');
	assert.equal(robotsMeta({ noindex: true, indexable: true }), 'noindex, nofollow');
});

test('a page is noindex in a preview build even when it did not ask to be', () => {
	const head = buildHead({ site, path: '/', indexable: false });
	assert.equal(head.robots, 'noindex, nofollow');
});

// Head

test('head defaults: titles, canonical and social tags', () => {
	const head = buildHead({ site, path: '/work/', title: 'Work', trailingSlash: 'always' });
	assert.equal(head.title, 'Work | Example Studio');
	assert.equal(head.description, 'A studio.');
	assert.equal(head.canonical, 'https://www.example.com/work/');
	assert.equal(head.robots, null);
	const og = Object.fromEntries(head.og);
	assert.equal(og['og:title'], 'Work');
	assert.equal(og['og:url'], 'https://www.example.com/work/');
	assert.equal(og['og:image'], 'https://www.example.com/og.png');
	assert.equal(og['og:locale'], 'en_GB');
	const twitter = Object.fromEntries(head.twitter);
	assert.equal(twitter['twitter:title'], 'Work | Example Studio');
	assert.equal(twitter['twitter:card'], 'summary_large_image');
});

test('home page uses the home title, then the site name', () => {
	assert.equal(buildHead({ site, path: '/' }).title, 'Hello, we make things | Example Studio');
	assert.equal(Object.fromEntries(buildHead({ site, path: '/' }).og)['og:title'], 'Hello, we make things');
	const bare = { ...site, homeTitle: undefined };
	assert.equal(buildHead({ site: bare, path: '/' }).title, 'Example Studio');
});

test('a site can keep its own title wording', () => {
	const head = buildHead({
		site, path: '/', twitterCard: 'summary',
		titles: {
			document: (title) => (title ? `${title}, ${site.name}` : `${site.name} / ${site.description}`),
			social: (title) => title ?? site.name
		}
	});
	assert.equal(head.title, 'Example Studio / A studio.');
	assert.equal(Object.fromEntries(head.og)['og:title'], 'Example Studio');
	assert.equal(Object.fromEntries(head.twitter)['twitter:card'], 'summary');
});

test('head takes its own description and image, and accepts one or several JSON-LD objects', () => {
	const head = buildHead({
		site, path: '/p', description: 'Mine', image: 'https://cdn.example.net/i.png',
		jsonLd: [{ a: 1 }, { b: 2 }]
	});
	assert.equal(head.description, 'Mine');
	assert.equal(Object.fromEntries(head.og)['og:image'], 'https://cdn.example.net/i.png');
	assert.equal(head.jsonLd.length, 2);
	assert.equal(buildHead({ site, path: '/', jsonLd: { a: 1 } }).jsonLd.length, 1);
	assert.equal(buildHead({ site, path: '/' }).jsonLd.length, 0);
});

test('head with a bad site URL fails rather than printing a broken canonical', () => {
	assert.throws(() => buildHead({ site: { ...site, url: 'www.example.com' }, path: '/' }), /site\.url/);
});

// Sitemap

const loc = (xml) => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

test('sitemap lists canonical URLs under the slash policy', () => {
	const xml = sitemapXml({
		siteUrl: site.url, trailingSlash: 'always',
		entries: [{ path: '/' }, { path: '/work' }, { path: '/work/a/' }]
	});
	assert.deepEqual(loc(xml), [
		'https://www.example.com/', 'https://www.example.com/work/', 'https://www.example.com/work/a/'
	]);
	assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">\n/);
	assert.ok(xml.endsWith('</urlset>\n'));
});

test('sitemap leaves noindex entries out and keeps the first of duplicates', () => {
	const xml = sitemapXml({
		siteUrl: site.url, trailingSlash: 'never',
		entries: [{ path: '/a', priority: 1 }, { path: '/a/', priority: 0.2 }, { path: '/secret', noindex: true }, { path: '/b' }]
	});
	assert.deepEqual(loc(xml), ['https://www.example.com/a', 'https://www.example.com/b']);
	assert.match(xml, /<priority>1.0<\/priority>/);
	assert.ok(!xml.includes('0.2'));
});

test('sitemap writes lastmod only when an entry has a real date', () => {
	const xml = sitemapXml({
		siteUrl: site.url,
		entries: [
			{ path: '/none' },
			{ path: '/empty', lastmod: '' },
			{ path: '/date', lastmod: new Date('2024-03-17T10:00:00Z') },
			{ path: '/string', lastmod: '2015-05-29' },
			{ path: '/time', lastmod: '2015-05-29T10:00:00+01:00' }
		]
	});
	assert.equal(xml.match(/<lastmod>/g).length, 3);
	assert.ok(xml.includes('<lastmod>2024-03-17</lastmod>'));
	assert.ok(xml.includes('<lastmod>2015-05-29</lastmod>'));
	assert.ok(xml.includes('<lastmod>2015-05-29T10:00:00+01:00</lastmod>'));
});

test('sitemap rejects dates, priorities and frequencies it cannot write', () => {
	const make = (entry) => () => sitemapXml({ siteUrl: site.url, entries: [{ path: '/x', ...entry }] });
	assert.throws(make({ lastmod: new Date('nope') }), /invalid Date/);
	assert.throws(make({ lastmod: 'yesterday' }), /lastmod/);
	assert.throws(make({ lastmod: '2024-13-45' }), /lastmod/);
	assert.throws(make({ priority: 2 }), /priority/);
	assert.throws(make({ priority: 'high' }), /priority/);
	assert.throws(make({ changefreq: 'sometimes' }), /changefreq/);
});

test('sitemap escapes URLs', () => {
	const xml = sitemapXml({ siteUrl: site.url, entries: [{ path: '/a&b/<c>' }] });
	assert.ok(xml.includes('<loc>https://www.example.com/a&amp;b/&lt;c&gt;</loc>'));
});

test('sitemap with no entries is still a valid urlset; too many entries throw', () => {
	assert.match(sitemapXml({ siteUrl: site.url, entries: [] }), /<urlset[^>]*>\n\n<\/urlset>/);
	const entries = Array.from({ length: 50001 }, (_, i) => ({ path: `/p${i}` }));
	assert.throws(() => sitemapXml({ siteUrl: site.url, entries }), /50000/);
});

// robots.txt

test('robots.txt allows everything and names the sitemap', () => {
	assert.equal(robotsTxt({ siteUrl: site.url }), 'User-agent: *\nAllow: /\n\nSitemap: https://www.example.com/sitemap.xml\n');
});

test('robots.txt can disallow paths and drop the sitemap line', () => {
	assert.equal(
		robotsTxt({ siteUrl: site.url, disallow: ['/admin/'] }),
		'User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://www.example.com/sitemap.xml\n'
	);
	assert.equal(robotsTxt({ siteUrl: site.url, sitemap: false }), 'User-agent: *\nAllow: /\n');
});

test('robots.txt refuses disallow paths that could inject directives', () => {
	for (const bad of ['admin', '/a\nAllow: /', '', 5]) {
		assert.throws(() => robotsTxt({ siteUrl: site.url, disallow: [bad] }), /disallow/);
	}
});

// llms.txt

test('llms.txt has the title, summary, intro and linked sections', () => {
	const text = llmsTxt({
		siteUrl: site.url, name: 'Example Studio', summary: 'A studio.', intro: 'We make things.',
		sections: [
			{ title: 'Work', items: [{ title: 'Project', path: '/work/p/', description: 'It is a project (2020)' }] },
			{ title: 'Contact', items: [{ text: 'Email: hi@example.com' }] }
		]
	});
	assert.equal(text, [
		'# Example Studio',
		'> A studio.',
		'We make things.',
		'## Work\n- [Project](https://www.example.com/work/p/): It is a project (2020)',
		'## Contact\n- Email: hi@example.com'
	].join('\n\n') + '\n');
});

test('llms.txt escapes link text, encodes URLs and flattens line breaks', () => {
	const text = llmsTxt({
		siteUrl: site.url, name: 'X',
		sections: [{ title: 'Pages', items: [
			{ title: 'A [bad] title\nover lines', path: '/a_(b)/c d', description: 'one\ntwo' },
			{ title: 'No description', url: 'https://other.example/x' }
		] }]
	});
	assert.ok(text.includes('- [A \\[bad\\] title over lines](https://www.example.com/a_%28b%29/c%20d): one two'));
	assert.ok(text.includes('- [No description](https://other.example/x)\n'));
});

test('llms.txt skips empty sections', () => {
	const text = llmsTxt({ siteUrl: site.url, name: 'X', sections: [{ title: 'Blog', items: [] }] });
	assert.equal(text, '# X\n');
});
