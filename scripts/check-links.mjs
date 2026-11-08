import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');

function walkHtmlFiles(dir) {
	const entries = readdirSync(dir);
	const files = [];
	for (const entry of entries) {
		const full = join(dir, entry);
		const stats = statSync(full);
		if (stats.isDirectory()) {
			files.push(...walkHtmlFiles(full));
			continue;
		}
		if (entry.endsWith('.html')) {
			files.push(full);
		}
	}
	return files;
}

function pathExistsInDist(urlPath) {
	const normalized = urlPath.split('?')[0].split('#')[0];
	const target = join(distDir, normalized);
	try {
		const stats = statSync(target);
		if (stats.isDirectory()) {
			statSync(join(target, 'index.html'));
		}
		return true;
	} catch {
		try {
			statSync(`${target}.html`);
			return true;
		} catch {
			try {
				statSync(join(target, 'index.html'));
				return true;
			} catch {
				return false;
			}
		}
	}
}

function extractLinks(html) {
	const attrRegex = /(href|src)=["']([^"']+)["']/g;
	const links = [];
	let match = attrRegex.exec(html);
	while (match) {
		const raw = match[2];
		links.push(raw);
		match = attrRegex.exec(html);
	}
	return links;
}

const htmlFiles = walkHtmlFiles(distDir);
const broken = [];

for (const file of htmlFiles) {
	const html = readFileSync(file, 'utf-8');
	const links = extractLinks(html);
	for (const link of links) {
		if (
			!link ||
			link.startsWith('http://') ||
			link.startsWith('https://') ||
			link.startsWith('mailto:') ||
			link.startsWith('tel:') ||
			link.startsWith('#')
		) {
			continue;
		}
		if (link.startsWith('/')) {
			if (!pathExistsInDist(link)) {
				broken.push(`${file} -> ${link}`);
			}
			continue;
		}
	}
}

if (broken.length > 0) {
	console.error('Phát hiện link nội bộ bị hỏng:');
	for (const item of broken) {
		console.error(`- ${item}`);
	}
	process.exit(1);
}

console.log('Không phát hiện link nội bộ bị hỏng trong dist.');
