export type LessonStatus = 'chua-hoc' | 'dang-hoc' | 'da-xong';

export interface QuizResult {
	lessonSlug: string;
	quizId: string;
	score: number;
	total: number;
	answers: number[];
	submittedAt: string;
}

interface ProgressState {
	version: 2;
	lessons: Record<string, LessonStatus>;
	quizzes: Record<string, QuizResult>;
	projects: Record<string, { done: boolean; checklist: boolean[]; noWireError: boolean }>;
	catalogViews: string[];
	labStats: Record<string, { hasWireError: boolean }>;
}

const STORAGE_KEY = 'xuong-iot-progress-v1';

function defaultState(): ProgressState {
	return {
		version: 2,
		lessons: {},
		quizzes: {},
		projects: {},
		catalogViews: [],
		labStats: {}
	};
}

function readState(): ProgressState {
	if (typeof window === 'undefined' || !window.localStorage) {
		return defaultState();
	}
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return defaultState();
		}
		const parsed = JSON.parse(raw) as Partial<ProgressState>;
		if (typeof parsed.lessons !== 'object' || parsed.lessons === null) {
			return defaultState();
		}
		const quizzes =
			typeof parsed.quizzes === 'object' && parsed.quizzes !== null
				? (parsed.quizzes as Record<string, QuizResult>)
				: {};
		const projects =
			typeof parsed.projects === 'object' && parsed.projects !== null
				? (parsed.projects as Record<string, { done: boolean; checklist: boolean[]; noWireError: boolean }>)
				: {};
		const catalogViews = Array.isArray(parsed.catalogViews)
			? parsed.catalogViews.filter((item): item is string => typeof item === 'string')
			: [];
		const labStats =
			typeof parsed.labStats === 'object' && parsed.labStats !== null
				? (parsed.labStats as Record<string, { hasWireError: boolean }>)
				: {};
		return {
			version: 2,
			lessons: parsed.lessons as Record<string, LessonStatus>,
			quizzes,
			projects,
			catalogViews,
			labStats
		};
	} catch (error) {
		console.error('Không thể đọc tiến độ học từ localStorage.', error);
		return defaultState();
	}
}

function writeState(state: ProgressState): boolean {
	if (typeof window === 'undefined' || !window.localStorage) {
		return false;
	}
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		return true;
	} catch (error) {
		console.error('Không thể ghi tiến độ học vào localStorage.', error);
		return false;
	}
}

export function getLessonStatus(slug: string): LessonStatus {
	return readState().lessons[slug] ?? 'chua-hoc';
}

export function getAllLessonStatuses(): Record<string, LessonStatus> {
	return readState().lessons;
}

export function setLessonStatus(slug: string, status: LessonStatus): boolean {
	const state = readState();
	state.lessons[slug] = status;
	return writeState(state);
}

export function markLessonDone(slug: string): boolean {
	return setLessonStatus(slug, 'da-xong');
}

export function saveQuizResult(payload: Omit<QuizResult, 'submittedAt'>): boolean {
	const state = readState();
	const key = `${payload.lessonSlug}:${payload.quizId}`;
	state.quizzes[key] = {
		...payload,
		submittedAt: new Date().toISOString()
	};
	return writeState(state);
}

export function getQuizResult(lessonSlug: string, quizId: string): QuizResult | null {
	const key = `${lessonSlug}:${quizId}`;
	return readState().quizzes[key] ?? null;
}

export function saveProjectProgress(
	slug: string,
	progress: { done: boolean; checklist: boolean[]; noWireError: boolean }
): boolean {
	const state = readState();
	state.projects[slug] = progress;
	return writeState(state);
}

export function getProjectProgress(slug: string) {
	return readState().projects[slug] ?? null;
}

export function getAllProjectProgress() {
	return readState().projects;
}

export function trackCatalogView(itemId: string): boolean {
	const state = readState();
	if (!state.catalogViews.includes(itemId)) {
		state.catalogViews.push(itemId);
	}
	return writeState(state);
}

export function getCatalogViewsCount(): number {
	return readState().catalogViews.length;
}

export function saveLabWireStatus(preset: string, hasWireError: boolean): boolean {
	const state = readState();
	const prev = state.labStats[preset];
	state.labStats[preset] = {
		hasWireError: Boolean(prev?.hasWireError) || hasWireError
	};
	return writeState(state);
}

export function getLabWireStatus(preset: string): { hasWireError: boolean } {
	return readState().labStats[preset] ?? { hasWireError: false };
}
