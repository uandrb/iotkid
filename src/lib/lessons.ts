import { getCollection, type CollectionEntry } from 'astro:content';

export type LessonEntry = CollectionEntry<'lessons'>;

export async function getVisibleLessons(): Promise<LessonEntry[]> {
	const lessons = await getCollection('lessons', ({ data }) =>
		import.meta.env.PROD ? !data.draft : true
	);
	return lessons.sort((a, b) => a.data.order - b.data.order);
}
