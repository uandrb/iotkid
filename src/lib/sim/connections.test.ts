import { describe, expect, it } from 'vitest';
import { isConnectionSafe } from './connections';

describe('isConnectionSafe', () => {
	it('trả về false khi nối VCC với GND', () => {
		expect(isConnectionSafe({ from: 'VCC', to: 'GND' })).toBe(false);
	});

	it('trả về true cho nối GPIO bình thường', () => {
		expect(isConnectionSafe({ from: 'GPIO2', to: 'LED_ANODE' })).toBe(true);
	});
});
