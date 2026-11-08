import type { BadgeId } from './badges';
import {
	getStorageStatus,
	readStore,
	updateStore,
	type LabSavedWork,
	type LessonStatus,
	type QuizResult
} from './storage';

export type { LessonStatus, QuizResult, LabSavedWork };

export function getStorageWarningMessage(): string | null {
	const status = getStorageStatus();
	return status.ok ? null : status.message ?? 'Trình duyệt đang chặn lưu trữ, hãy dùng Xuất file.';
}

export function getDisplayName(): string {
	return readStore().displayName;
}

export function setDisplayName(name: string): boolean {
	return updateStore((draft) => {
		draft.displayName = name.trim();
	}).ok;
}

export function getLessonStatus(slug: string): LessonStatus {
	return readStore().lessons[slug] ?? 'chua-hoc';
}

export function getAllLessonStatuses(): Record<string, LessonStatus> {
	return readStore().lessons;
}

export function setLessonStatus(slug: string, status: LessonStatus): boolean {
	return updateStore((draft) => {
		draft.lessons[slug] = status;
	}).ok;
}

export function markLessonDone(slug: string): boolean {
	return setLessonStatus(slug, 'da-xong');
}

export function saveQuizResult(payload: Omit<QuizResult, 'submittedAt'>): boolean {
	return updateStore((draft) => {
		const key = `${payload.lessonSlug}:${payload.quizId}`;
		draft.quizzes[key] = {
			...payload,
			submittedAt: new Date().toISOString()
		};
	}).ok;
}

export function getQuizResult(lessonSlug: string, quizId: string): QuizResult | null {
	const key = `${lessonSlug}:${quizId}`;
	return readStore().quizzes[key] ?? null;
}

export function saveProjectProgress(
	slug: string,
	progress: { done: boolean; checklist: boolean[]; noWireError: boolean }
): boolean {
	return updateStore((draft) => {
		draft.projects[slug] = progress;
	}).ok;
}

export function getProjectProgress(slug: string) {
	return readStore().projects[slug] ?? null;
}

export function getAllProjectProgress() {
	return readStore().projects;
}

export function trackCatalogView(itemId: string): boolean {
	return updateStore((draft) => {
		if (!draft.catalogViews.includes(itemId)) {
			draft.catalogViews.push(itemId);
		}
	}).ok;
}

export function getCatalogViewsCount(): number {
	return readStore().catalogViews.length;
}

export function saveLabWireStatus(preset: string, hasWireError: boolean): boolean {
	return updateStore((draft) => {
		const prev = draft.labStats[preset];
		draft.labStats[preset] = {
			hasWireError: Boolean(prev?.hasWireError) || hasWireError
		};
	}).ok;
}

export function getLabWireStatus(preset: string): { hasWireError: boolean } {
	return readStore().labStats[preset] ?? { hasWireError: false };
}

export function setUnlockedBadges(ids: BadgeId[]): boolean {
	return updateStore((draft) => {
		draft.badges = [...new Set(ids)];
	}).ok;
}

export function getUnlockedBadges(): BadgeId[] {
	return readStore().badges as BadgeId[];
}

