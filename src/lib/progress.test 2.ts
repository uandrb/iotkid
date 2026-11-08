import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getLessonStatus,
	getQuizResult,
	markLessonDone,
	saveQuizResult,
	setLessonStatus
} from './progress';

type StoreMap = Map<string, string>;

function installMockStorage(seed?: StoreMap): StoreMap {
	const store = seed ?? new Map<string, string>();
	const storage: Storage = {
		getItem: (key) => store.get(key) ?? null,
		setItem: (key, value) => {
			store.set(key, String(value));
		},
		removeItem: (key) => {
			store.delete(key);
		},
		clear: () => {
			store.clear();
		},
		key: (index) => Array.from(store.keys())[index] ?? null,
		get length() {
			return store.size;
		}
	};
	Object.defineProperty(globalThis, 'window', {
		value: { localStorage: storage },
		writable: true
	});
	Object.defineProperty(globalThis, 'localStorage', {
		value: storage,
		writable: true
	});
	return store;
}

beforeEach(() => {
	vi.restoreAllMocks();
	installMockStorage();
});

describe('progress local storage', () => {
	it('đọc và ghi trạng thái bài học', () => {
		expect(getLessonStatus('nhay-led')).toBe('chua-hoc');
		expect(setLessonStatus('nhay-led', 'dang-hoc')).toBe(true);
		expect(getLessonStatus('nhay-led')).toBe('dang-hoc');
		expect(markLessonDone('nhay-led')).toBe(true);
		expect(getLessonStatus('nhay-led')).toBe('da-xong');
	});

	it('trả về mặc định khi dữ liệu bị hỏng', () => {
		const store = installMockStorage();
		store.set('xuong-iot-progress-v1', '{not-json');
		expect(getLessonStatus('nhay-led')).toBe('chua-hoc');
	});

	it('xử lý khi localStorage bị chặn', () => {
		const blockedStorage: Storage = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			},
			removeItem: () => undefined,
			clear: () => undefined,
			key: () => null,
			length: 0
		};
		Object.defineProperty(globalThis, 'window', {
			value: { localStorage: blockedStorage },
			writable: true
		});
		expect(setLessonStatus('nhay-led', 'dang-hoc')).toBe(false);
		expect(getLessonStatus('nhay-led')).toBe('chua-hoc');
	});

	it('lưu và đọc kết quả quiz', () => {
		expect(
			saveQuizResult({
				lessonSlug: 'nhay-led',
				quizId: 'quiz-1',
				score: 3,
				total: 3,
				answers: [0, 1, 2]
			})
		).toBe(true);
		const result = getQuizResult('nhay-led', 'quiz-1');
		expect(result?.score).toBe(3);
		expect(result?.total).toBe(3);
		expect(result?.submittedAt).toBeTypeOf('string');
	});
});
