import { z } from 'zod';
import LZString from 'lz-string';
import type { Wire } from './sim/wiring';

export type LessonStatus = 'chua-hoc' | 'dang-hoc' | 'da-xong';

export interface QuizResult {
	lessonSlug: string;
	quizId: string;
	score: number;
	total: number;
	answers: number[];
	submittedAt: string;
}

export interface ProjectProgress {
	done: boolean;
	checklist: boolean[];
	noWireError: boolean;
}

export interface LabWireStats {
	hasWireError: boolean;
}

export interface LabComponentPlacement {
	compId: string;
	moduleId: string;
	x: number;
	y: number;
}

export interface LabSavedWork {
	id: string;
	name: string;
	boardId: 'esp32-devkit-v1' | 'esp32-s3-devkitc-1-n16r8';
	presetId: string | null;
	components: LabComponentPlacement[];
	wires: Wire[];
	code: string;
	createdAt: string;
	updatedAt: string;
}

export interface BrowserStore {
	version: 1;
	displayName: string;
	lessons: Record<string, LessonStatus>;
	quizzes: Record<string, QuizResult>;
	projects: Record<string, ProjectProgress>;
	catalogViews: string[];
	labStats: Record<string, LabWireStats>;
	badges: string[];
	labWorks: Record<string, LabSavedWork>;
}

export type ImportMode = 'merge' | 'replace';
export type StorageErrorCode = 'blocked' | 'quota' | 'invalid' | 'too-large';

export interface StorageResult<T = void> {
	ok: boolean;
	value?: T;
	errorCode?: StorageErrorCode;
	message?: string;
}

const STORAGE_PREFIX = 'xuong-iot:v1:';
const STORAGE_KEY = `${STORAGE_PREFIX}store`;
const LEGACY_PROGRESS_KEY = 'xuong-iot-progress-v1';
const MAX_STORE_BYTES = 900_000;
export const MAX_IMPORT_BYTES = 1_000_000;

const lessonStatusSchema = z.enum(['chua-hoc', 'dang-hoc', 'da-xong']);

const boardEndpointSchema = z.object({
	type: z.literal('board'),
	side: z.enum(['trai', 'phai']),
	index: z.number().int().nonnegative()
});

const moduleEndpointSchema = z.object({
	type: z.literal('module'),
	compId: z.string().min(1),
	moduleId: z.string().min(1),
	pinLabel: z.string().min(1)
});

const wireSchema = z.object({
	id: z.string().min(1),
	a: z.union([boardEndpointSchema, moduleEndpointSchema]),
	b: z.union([boardEndpointSchema, moduleEndpointSchema])
});

const labComponentSchema = z.object({
	compId: z.string().min(1),
	moduleId: z.string().min(1),
	x: z.number(),
	y: z.number()
});

const labSavedWorkSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	boardId: z.enum(['esp32-devkit-v1', 'esp32-s3-devkitc-1-n16r8']),
	presetId: z.string().nullable(),
	components: z.array(labComponentSchema),
	wires: z.array(wireSchema),
	code: z.string(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1)
});

const browserStoreSchema = z.object({
	version: z.literal(1),
	displayName: z.string(),
	lessons: z.record(z.string(), lessonStatusSchema),
	quizzes: z.record(
		z.string(),
		z.object({
			lessonSlug: z.string().min(1),
			quizId: z.string().min(1),
			score: z.number().int().nonnegative(),
			total: z.number().int().nonnegative(),
			answers: z.array(z.number().int()),
			submittedAt: z.string().min(1)
		})
	),
	projects: z.record(
		z.string(),
		z.object({
			done: z.boolean(),
			checklist: z.array(z.boolean()),
			noWireError: z.boolean()
		})
	),
	catalogViews: z.array(z.string().min(1)),
	labStats: z.record(
		z.string(),
		z.object({
			hasWireError: z.boolean()
		})
	),
	badges: z.array(z.string().min(1)),
	labWorks: z.record(z.string(), labSavedWorkSchema)
});

const singleWorkExportSchema = z.object({
	type: z.literal('xuong-iot-lab-work'),
	version: z.literal(1),
	work: labSavedWorkSchema
});

const backupExportSchema = z.object({
	type: z.literal('xuong-iot-backup'),
	version: z.literal(1),
	exportedAt: z.string().min(1),
	data: browserStoreSchema
});

const sharePayloadSchema = z.object({
	version: z.literal(1),
	work: labSavedWorkSchema
});

function createDefaultStore(): BrowserStore {
	return {
		version: 1,
		displayName: '',
		lessons: {},
		quizzes: {},
		projects: {},
		catalogViews: [],
		labStats: {},
		badges: [],
		labWorks: {}
	};
}

function isQuotaError(error: unknown): boolean {
	if (!(error instanceof DOMException)) return false;
	return error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014;
}

function makeError(errorCode: StorageErrorCode, message: string): StorageResult {
	return { ok: false, errorCode, message };
}

function getLocalStorageSafe(): Storage | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage;
	} catch (error) {
		console.error('Không thể truy cập localStorage.', error);
		return null;
	}
}

function migrateLegacyProgress(storage: Storage): BrowserStore | null {
	const oldRaw = storage.getItem(LEGACY_PROGRESS_KEY);
	if (!oldRaw) return null;
	try {
		const parsed = JSON.parse(oldRaw) as Partial<{
			lessons: Record<string, LessonStatus>;
			quizzes: Record<string, QuizResult>;
			projects: Record<string, ProjectProgress>;
			catalogViews: string[];
			labStats: Record<string, LabWireStats>;
		}>;
		const migrated = createDefaultStore();
		migrated.lessons = parsed.lessons ?? {};
		migrated.quizzes = parsed.quizzes ?? {};
		migrated.projects = parsed.projects ?? {};
		migrated.catalogViews = Array.isArray(parsed.catalogViews) ? parsed.catalogViews : [];
		migrated.labStats = parsed.labStats ?? {};
		return migrated;
	} catch (error) {
		console.error('Không thể chuyển dữ liệu cũ sang kho mới.', error);
		return null;
	}
}

export function migrate(parsed: unknown): BrowserStore {
	const checked = browserStoreSchema.safeParse(parsed);
	if (checked.success) return checked.data;
	return createDefaultStore();
}

function readStoreInternal(): BrowserStore {
	const storage = getLocalStorageSafe();
	if (!storage) return createDefaultStore();
	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (!raw) {
			const legacy = migrateLegacyProgress(storage);
			if (!legacy) return createDefaultStore();
			writeStoreInternal(legacy);
			return legacy;
		}
		const parsed = JSON.parse(raw);
		return migrate(parsed);
	} catch (error) {
		console.error('Không thể đọc kho dữ liệu trong localStorage.', error);
		return createDefaultStore();
	}
}

function writeStoreInternal(data: BrowserStore): StorageResult {
	const storage = getLocalStorageSafe();
	if (!storage) {
		return makeError('blocked', 'Trình duyệt đang chặn lưu trữ, hãy dùng Xuất file.');
	}

	const serialized = JSON.stringify(data);
	if (serialized.length > MAX_STORE_BYTES) {
		return makeError(
			'quota',
			'Bộ nhớ trình duyệt gần đầy, em hãy xóa bớt bài làm cũ hoặc dùng Xuất file.'
		);
	}
	try {
		storage.setItem(STORAGE_KEY, serialized);
		return { ok: true };
	} catch (error) {
		if (isQuotaError(error)) {
			return makeError(
				'quota',
				'Bộ nhớ trình duyệt đã đầy, em hãy xuất file dự phòng và dọn bớt dữ liệu.'
			);
		}
		console.error('Không thể ghi kho dữ liệu vào localStorage.', error);
		return makeError('blocked', 'Trình duyệt đang chặn lưu trữ, hãy dùng Xuất file.');
	}
}

export function getStorageStatus(): StorageResult {
	const storage = getLocalStorageSafe();
	if (!storage) return makeError('blocked', 'Trình duyệt đang chặn lưu trữ, hãy dùng Xuất file.');
	try {
		storage.getItem(STORAGE_KEY);
		return { ok: true };
	} catch (error) {
		console.error('Không thể kiểm tra trạng thái localStorage.', error);
		return makeError('blocked', 'Trình duyệt đang chặn lưu trữ, hãy dùng Xuất file.');
	}
}

export function readStore(): BrowserStore {
	return readStoreInternal();
}

export function updateStore(mutator: (draft: BrowserStore) => void): StorageResult<BrowserStore> {
	const draft = readStoreInternal();
	mutator(draft);
	const write = writeStoreInternal(draft);
	if (!write.ok) return write;
	return { ok: true, value: draft };
}

export function setDisplayName(name: string): StorageResult<BrowserStore> {
	return updateStore((draft) => {
		draft.displayName = name.trim();
	});
}

export function saveLabWork(
	work: Omit<LabSavedWork, 'createdAt' | 'updatedAt'> & { createdAt?: string }
): StorageResult<LabSavedWork> {
	const now = new Date().toISOString();
	const next: LabSavedWork = {
		...work,
		name: work.name.trim() || 'Bài làm chưa đặt tên',
		createdAt: work.createdAt ?? now,
		updatedAt: now
	};
	const validated = labSavedWorkSchema.safeParse(next);
	if (!validated.success) {
		return makeError('invalid', 'Bài làm chưa đúng định dạng, chưa thể lưu.');
	}
	const result = updateStore((draft) => {
		draft.labWorks[next.id] = validated.data;
	});
	if (!result.ok) return result;
	return { ok: true, value: validated.data };
}

export function getLabWork(workId: string): LabSavedWork | null {
	return readStoreInternal().labWorks[workId] ?? null;
}

export function listLabWorks(): LabSavedWork[] {
	return Object.values(readStoreInternal().labWorks).sort((a, b) =>
		b.updatedAt.localeCompare(a.updatedAt)
	);
}

export function deleteLabWork(workId: string): StorageResult {
	return updateStore((draft) => {
		delete draft.labWorks[workId];
	});
}

export function renameLabWork(workId: string, nextName: string): StorageResult {
	return updateStore((draft) => {
		const current = draft.labWorks[workId];
		if (!current) return;
		current.name = nextName.trim() || current.name;
		current.updatedAt = new Date().toISOString();
	});
}

export function exportLabWork(workId: string): StorageResult<string> {
	const work = getLabWork(workId);
	if (!work) return makeError('invalid', 'Không tìm thấy bài làm để xuất file.');
	return {
		ok: true,
		value: JSON.stringify(
			{
				type: 'xuong-iot-lab-work',
				version: 1,
				work
			},
			null,
			2
		)
	};
}

export function exportBackup(): string {
	return JSON.stringify(
		{
			type: 'xuong-iot-backup',
			version: 1,
			exportedAt: new Date().toISOString(),
			data: readStoreInternal()
		},
		null,
		2
	);
}

function mergeStores(base: BrowserStore, incoming: BrowserStore): BrowserStore {
	return {
		...base,
		displayName: incoming.displayName || base.displayName,
		lessons: { ...base.lessons, ...incoming.lessons },
		quizzes: { ...base.quizzes, ...incoming.quizzes },
		projects: { ...base.projects, ...incoming.projects },
		catalogViews: Array.from(new Set([...base.catalogViews, ...incoming.catalogViews])),
		labStats: { ...base.labStats, ...incoming.labStats },
		badges: Array.from(new Set([...base.badges, ...incoming.badges])),
		labWorks: { ...base.labWorks, ...incoming.labWorks }
	};
}

export function importFromJson(raw: string, mode: ImportMode = 'merge'): StorageResult {
	if (raw.length > MAX_IMPORT_BYTES) {
		return makeError('too-large', 'File lớn hơn 1 MB, em hãy chọn file nhỏ hơn.');
	}
	try {
		const parsed = JSON.parse(raw);
		const asWork = singleWorkExportSchema.safeParse(parsed);
		if (asWork.success) {
			const save = saveLabWork(asWork.data.work);
			return save.ok ? { ok: true } : save;
		}
		const asBackup = backupExportSchema.safeParse(parsed);
		if (!asBackup.success) {
			return makeError('invalid', 'File không đúng định dạng .xuongiot.json hoặc .xuongiot-backup.json.');
		}
		const next =
			mode === 'replace'
				? asBackup.data.data
				: mergeStores(readStoreInternal(), asBackup.data.data);
		return writeStoreInternal(next);
	} catch (error) {
		console.error('Không thể nhập file tiến độ.', error);
		return makeError('invalid', 'File bị hỏng hoặc không phải JSON hợp lệ.');
	}
}

export function createLabWorkId(): string {
	try {
		return (
			window.crypto?.randomUUID?.() ??
			`work-${Date.now()}-${Math.random().toString(16).slice(2)}`
		);
	} catch {
		return `work-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}
}

export function downloadTextFile(filename: string, content: string): void {
	const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

export function encodeSharedWork(work: LabSavedWork): string {
	return LZString.compressToEncodedURIComponent(
		JSON.stringify({
			version: 1,
			work
		})
	);
}

export function decodeSharedWorkFromHash(hash: string): StorageResult<LabSavedWork> {
	const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
	const encoded = cleaned.startsWith('work=') ? cleaned.slice(5) : cleaned;
	if (!encoded) return makeError('invalid', 'Link chia sẻ không có dữ liệu.');
	try {
		const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
		if (!decompressed) return makeError('invalid', 'Link chia sẻ bị hỏng hoặc không đọc được.');
		const parsed = JSON.parse(decompressed);
		const validated = sharePayloadSchema.safeParse(parsed);
		if (!validated.success) {
			return makeError('invalid', 'Nội dung link không đúng định dạng bài làm.');
		}
		return { ok: true, value: validated.data.work };
	} catch (error) {
		console.error('Không thể giải mã link chia sẻ.', error);
		return makeError('invalid', 'Link chia sẻ bị hỏng hoặc không hợp lệ.');
	}
}
