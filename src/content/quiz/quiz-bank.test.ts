import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const quizDir = join(process.cwd(), 'src/content/quiz');
const quizFiles = readdirSync(quizDir).filter((file) => file.endsWith('.json'));

describe('quiz bank', () => {
	it('mỗi câu có đúng 1 đáp án đúng', () => {
		expect(quizFiles.length).toBeGreaterThan(0);
		for (const file of quizFiles) {
			const raw = readFileSync(join(quizDir, file), 'utf-8');
			const data = JSON.parse(raw) as {
				options: Array<{ correct: boolean }>;
				lessonLink: string;
			};
			const correctCount = data.options.filter((option) => option.correct).length;
			expect(correctCount, `Sai số đáp án đúng ở ${file}`).toBe(1);
			expect(data.lessonLink.startsWith('/')).toBe(true);
		}
	});
});
