import { getCollection, type CollectionEntry } from 'astro:content';

export type ProjectEntry = CollectionEntry<'projects'>;

export async function getProjects(): Promise<ProjectEntry[]> {
	const projects = await getCollection('projects');
	return projects.sort((a, b) => a.data.title.localeCompare(b.data.title, 'vi'));
}

export async function getProjectBySlug(slug: string): Promise<ProjectEntry | null> {
	const projects = await getProjects();
	return projects.find((item) => item.data.slug === slug) ?? null;
}
