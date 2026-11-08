import { describe, expect, it } from 'vitest';
import { arduinoSamples } from '../projects';
import { runArduinoInSandbox } from './sandbox';

describe('runtime sandbox', () => {
	it('chạy mẫu nháy LED', async () => {
		const result = await runArduinoInSandbox(arduinoSamples['nhay-led'], { loops: 1 });
		expect(result.pwm[2]).toBeDefined();
	});

	it('chạy mẫu nút nhấn', async () => {
		const result = await runArduinoInSandbox(arduinoSamples['nut-nhan'], {
			buttonPressed: true,
			loops: 1
		});
		expect(result.pins[2]).toBe(1);
	});

	it('chạy mẫu biến trở', async () => {
		const result = await runArduinoInSandbox(arduinoSamples['bien-tro'], {
			potValue: 4095,
			loops: 1
		});
		expect(result.pwm[2]).toBeGreaterThanOrEqual(200);
	});

	it('chạy mẫu trạm thời tiết', async () => {
		const result = await runArduinoInSandbox(arduinoSamples['tram-thoi-tiet'], {
			temperature: 31.2,
			humidity: 70,
			loops: 1
		});
		expect(result.logs.some((item) => item.includes('[OLED]'))).toBe(true);
	});
});
