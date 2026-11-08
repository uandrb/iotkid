import { describe, expect, it } from 'vitest';
import { checkCodeUsage, checkWire, type Wire } from './wiring';

const boardCtx = {
	boardId: 'esp32-devkit-v1',
	wires: []
} as const;

function wire(a: Wire['a'], b: Wire['b']): Wire {
	return { id: 'w1', a, b };
}

describe('checkWire', () => {
	it('báo lỗi khi chập nguồn với GND, và không lỗi khi nối tín hiệu hợp lệ', () => {
		const bad = checkWire(
			boardCtx,
			wire(
				{ type: 'board', side: 'trai', index: 14 }, // VIN
				{ type: 'board', side: 'trai', index: 13 } // GND
			)
		);
		expect(bad.level).toBe('err');

		const ok = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'led1', moduleId: 'led-dien-tro-220', pinLabel: 'LED (+)' },
				{ type: 'board', side: 'phai', index: 6 } // GPIO18
			)
		);
		expect(ok.level).toBe('ok');
	});

	it('báo lỗi module chỉ 3.3V bị cấp 5V, và đúng khi cấp 3V3', () => {
		const bad = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'mic1', moduleId: 'inmp441', pinLabel: 'VDD' },
				{ type: 'board', side: 'trai', index: 14 } // VIN
			)
		);
		expect(bad.level).toBe('err');

		const ok = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'mic1', moduleId: 'inmp441', pinLabel: 'VDD' },
				{ type: 'board', side: 'phai', index: 14 } // 3V3
			)
		);
		expect(ok.level).toBe('ok');
	});

	it('báo lỗi khi chân tín hiệu nối vào nguồn/GND, và đúng khi nối GPIO', () => {
		const bad = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'dht1', moduleId: 'dht22', pinLabel: 'DATA' },
				{ type: 'board', side: 'trai', index: 13 } // GND
			)
		);
		expect(bad.level).toBe('err');

		const ok = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'dht1', moduleId: 'dht22', pinLabel: 'DATA' },
				{ type: 'board', side: 'phai', index: 10 } // GPIO4
			)
		);
		expect(ok.level).toBe('ok');
	});

	it('cảnh báo/chặn các chân không dùng và strapping', () => {
		const forbid = checkWire(
			{ boardId: 'esp32-s3-devkitc-1-n16r8', wires: [] },
			wire(
				{ type: 'module', compId: 'led1', moduleId: 'led-dien-tro-220', pinLabel: 'LED (+)' },
				{ type: 'board', side: 'phai', index: 12 } // GPIO35 - khong dung
			)
		);
		expect(forbid.level).toBe('err');

		const strap = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'led1', moduleId: 'led-dien-tro-220', pinLabel: 'LED (+)' },
				{ type: 'board', side: 'phai', index: 11 } // GPIO2 strapping
			)
		);
		expect(strap.level).toBe('warn');
	});

	it('cảnh báo UART/USB và đúng trên GPIO thường', () => {
		const uart = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'led1', moduleId: 'led-dien-tro-220', pinLabel: 'LED (+)' },
				{ type: 'board', side: 'phai', index: 2 } // TX0 GPIO1
			)
		);
		expect(uart.level).toBe('warn');

		const ok = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'led1', moduleId: 'led-dien-tro-220', pinLabel: 'LED (+)' },
				{ type: 'board', side: 'phai', index: 6 } // GPIO18
			)
		);
		expect(ok.level).toBe('ok');
	});

	it('báo lỗi LED cắm ngược và đúng khi cắm đúng cực', () => {
		const reverse = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'led1', moduleId: 'led-dien-tro-220', pinLabel: 'LED (+)' },
				{ type: 'board', side: 'trai', index: 13 } // GND
			)
		);
		expect(reverse.level).toBe('err');

		const correct = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'led1', moduleId: 'led-dien-tro-220', pinLabel: 'LED (-)' },
				{ type: 'board', side: 'trai', index: 13 } // GND
			)
		);
		expect(correct.level).toBe('ok');
	});

	it('báo lỗi loa nối thẳng GPIO và không lỗi khi cảnh báo loa đúng kiểu', () => {
		const bad = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'spk1', moduleId: 'loa-4ohm-3w', pinLabel: 'SPK+' },
				{ type: 'board', side: 'phai', index: 6 } // GPIO18
			)
		);
		expect(bad.level).toBe('err');

		const ok = checkWire(
			boardCtx,
			wire(
				{ type: 'module', compId: 'spk1', moduleId: 'loa-4ohm-3w', pinLabel: 'SPK+' },
				{ type: 'module', compId: 'amp1', moduleId: 'max98357a', pinLabel: 'SPK+' }
			)
		);
		expect(ok.level).toBe('warn');
	});
});

describe('checkCodeUsage', () => {
	it('báo lỗi chân chỉ đọc dùng làm đầu ra và không báo lỗi với chân output hợp lệ', () => {
		const usage = checkCodeUsage({
			boardId: 'esp32-devkit-v1',
			wires: [],
			usage: { digitalWritePins: [34, 2] }
		});
		expect(usage.some((item) => item.level === 'err' && item.message.includes('GPIO34'))).toBe(true);
		expect(usage.some((item) => item.message.includes('GPIO2'))).toBe(false);
	});

	it('báo lỗi chân không có ADC, và cảnh báo ADC2 khi bật Wi-Fi', () => {
		const invalid = checkCodeUsage({
			boardId: 'esp32-devkit-v1',
			wires: [],
			usage: { analogReadPins: [18] }
		});
		expect(invalid.some((item) => item.level === 'err' && item.message.includes('GPIO18'))).toBe(true);

		const adc2Wifi = checkCodeUsage({
			boardId: 'esp32-devkit-v1',
			wires: [],
			wifiEnabled: true,
			usage: { analogReadPins: [25] }
		});
		expect(adc2Wifi.some((item) => item.level === 'warn' && item.message.includes('ADC2'))).toBe(true);
	});
});
