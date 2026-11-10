import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lessons' }),
	schema: z.object({
		title: z.string().min(1, 'Thiếu tiêu đề bài học (title).'),
		slug: z
			.string()
			.min(1, 'Thiếu slug bài học.')
			.regex(/^[a-z0-9-]+$/, 'slug chỉ dùng chữ thường không dấu, số và dấu gạch ngang.'),
		order: z.number().int().nonnegative(),
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
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
	schema: z.object({
		title: z.string().min(1),
		slug: z
			.string()
			.min(1)
			.regex(/^[a-z0-9-]+$/, 'slug chỉ dùng chữ thường không dấu, số và dấu gạch ngang.'),
		level: z.enum(['Dễ', 'Vừa', 'Khó']),
		board: z.enum(['esp32', 'esp32s3']),
		modules: z.array(z.string().min(1)).min(1),
		thoiGian: z.string().min(1),
		anhBia: z.string().min(1),
		labPreset: z.string().min(1),
		steps: z.number().int().positive(),
		danhSachMua: z
			.array(
				z.object({
					id: z.string().min(1),
					soLuong: z.number().int().positive()
				})
			)
			.min(1)
	})
});

export const collections = {
	lessons,
	projects
};
