import { defineCollection, z } from 'astro:content';

const lessons = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string().min(1, 'Thiếu tiêu đề bài học (title).'),
		slug: z
			.string()
			.min(1, 'Thiếu slug bài học.')
			.regex(/^[a-z0-9-]+$/, 'slug chỉ dùng chữ thường không dấu, số và dấu gạch ngang.'),
		order: z.number().int().positive(),
		level: z.enum(['Dễ', 'Vừa', 'Khó']),
		durationMinutes: z.number().int().positive(),
		board: z.enum(['esp32', 'esp32s3']),
		modules: z.array(z.string().min(1)).default([]),
		goals: z.array(z.string().min(1)).min(1),
		labPreset: z.string(),
		draft: z.boolean()
	})
});

const projects = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		level: z.enum(['de', 'vua', 'kho']),
		durationMinutes: z.number().int().positive(),
		summary: z.string()
	})
});

export const collections = {
	lessons,
	projects
};
