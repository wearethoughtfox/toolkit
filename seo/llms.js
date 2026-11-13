import { absoluteUrl } from './urls.js';

/**
 * llms.txt: a Markdown summary of the site for language models.
 *
 *   llmsTxt({
 *     siteUrl, name, summary,
 *     intro: 'We are a studio…',                  // optional paragraph
 *     sections: [
 *       { title: 'Work', items: [{ title: 'Project', path: '/work/x/', description: 'What it is' }] },
 *       { title: 'Contact', items: [{ text: 'Email: hi@example.com' }] }
 *     ]
 *   })
 *
 * Link text is escaped so a title with brackets can't break the link, and
 * parentheses in a URL are percent-encoded. Empty sections are left out.
 */

const oneLine = (value) => String(value).replace(/\s+/g, ' ').trim();
const escapeLinkText = (value) => oneLine(value).replace(/([\\[\]])/g, '\\$1');
const encodeUrl = (url) => url.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20');

function line(item, siteUrl) {
	if (item.text !== undefined) return `- ${oneLine(item.text)}`;
	const url = encodeUrl(absoluteUrl(siteUrl, item.path ?? item.url));
	const link = `[${escapeLinkText(item.title)}](${url})`;
	return item.description ? `- ${link}: ${oneLine(item.description)}` : `- ${link}`;
}

export function llmsTxt({ siteUrl, name, summary, intro, sections = [] }) {
	const parts = [`# ${oneLine(name)}`];
	if (summary) parts.push(`> ${oneLine(summary)}`);
	if (intro) parts.push(oneLine(intro));
	for (const { title, items } of sections) {
		if (!items.length) continue;
		parts.push(`## ${oneLine(title)}\n${items.map((item) => line(item, siteUrl)).join('\n')}`);
	}
	return parts.join('\n\n') + '\n';
}
