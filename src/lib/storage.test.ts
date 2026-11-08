import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createLabWorkId,
	exportBackup,
	importFromJson,
	listLabWorks,
	readStore,
	saveLabWork,
	updateStore
} from './storage';

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
		value: { localStorage: storage, crypto: { randomUUID: () => 'fixed-id' } },
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

describe('storage import export', () => {
	it('xuất rồi nhập lại cho dữ liệu y hệt', () => {
		const id = createLabWorkId();
		saveLabWork({
			id,
			name: 'Bài làm 1',
			boardId: 'esp32-devkit-v1',
			presetId: 'nhay-led',
			components: [{ compId: 'led1', moduleId: 'led-dien-tro-220', x: 10, y: 20 }],
			wires: [],
			code: 'void setup() {}'
		});
		updateStore((draft) => {
			draft.lessons['nhay-led'] = 'da-xong';
			draft.badges = ['thap-sang-dau-tien'];
		});

		const before = readStore();
		const backup = exportBackup();

		updateStore((draft) => {
			draft.lessons = {};
			draft.badges = [];
			draft.labWorks = {};
		});

		const imported = importFromJson(backup, 'replace');
		expect(imported.ok).toBe(true);
		expect(readStore()).toStrictEqual(before);
	});

	it('từ chối file sai định dạng', () => {
		const result = importFromJson('{"hello":"world"}', 'merge');
		expect(result.ok).toBe(false);
		expect(result.message).toContain('không đúng định dạng');
	});

	it('gộp backup giữ cả dữ liệu cũ và mới', () => {
		const first = 'work-first';
		saveLabWork({
			id: first,
			name: 'Cũ',
			boardId: 'esp32-devkit-v1',
			presetId: 'nhay-led',
			components: [],
			wires: [],
			code: ''
		});

		const emptyBackup = exportBackup();
		updateStore((draft) => {
			draft.labWorks = {};
		});
		importFromJson(emptyBackup, 'replace');

		const second = 'work-second';
		saveLabWork({
			id: second,
			name: 'Mới',
			boardId: 'esp32-s3-devkitc-1-n16r8',
			presetId: null,
			components: [],
			wires: [],
			code: ''
		});

		const mergeResult = importFromJson(emptyBackup, 'merge');
		expect(mergeResult.ok).toBe(true);
		expect(listLabWorks().length).toBe(2);
	});
});
