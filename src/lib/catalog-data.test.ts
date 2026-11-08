import { describe, expect, it } from 'vitest';
import { boards, modulesCatalog, moduleMap } from './catalog';

describe('dữ liệu board/module', () => {
	it('đúng số chân hai cột cho từng board', () => {
		const expectPinCount: Record<string, { trai: number; phai: number }> = {
			'esp32-devkit-v1': { trai: 15, phai: 15 },
			'esp32-s3-devkitc-1-n16r8': { trai: 22, phai: 22 }
		};

		boards.forEach((board) => {
			const expected = expectPinCount[board.id];
			expect(expected).toBeDefined();
			expect(board.chanTrai).toHaveLength(expected.trai);
			expect(board.chanPhai).toHaveLength(expected.phai);
		});
	});

	it('không trùng GPIO trong cùng một board', () => {
		boards.forEach((board) => {
			const gpios = [...board.chanTrai, ...board.chanPhai]
				.map((pin) => pin.gpio)
				.filter((gpio): gpio is number => gpio !== null);
			const unique = new Set(gpios);
			expect(unique.size).toBe(gpios.length);
		});
	});

	it('mọi moduleKetHop đều tồn tại', () => {
		boards.forEach((board) => {
			board.moduleKetHop.forEach((moduleId) => {
				expect(moduleMap.has(moduleId)).toBe(true);
			});
		});
	});

	it('module không trùng id', () => {
		const ids = modulesCatalog.map((item) => item.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
