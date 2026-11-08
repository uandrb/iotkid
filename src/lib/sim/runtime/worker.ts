/// <reference lib="webworker" />
import { boardMap } from '../../catalog';
import { checkCodeUsage, checkWire } from '../wiring';
import { diagnoseBasicSyntax, transpileArduinoToJs } from './transpile';
import type { RuntimeEvent, RuntimeRequest } from './types';

const ctx: DedicatedWorkerGlobalScope = self as never;

class StopExecutionError extends Error {}

let currentRunId = 0;

function post(event: RuntimeEvent) {
	ctx.postMessage(event);
}

function parseUsage(code: string) {
	const defines = new Map<string, number>();
	const defineRegex = /^\s*#define\s+([A-Za-z_]\w*)\s+([0-9]+)\s*$/gm;
	let defineMatch = defineRegex.exec(code);
	while (defineMatch) {
		defines.set(defineMatch[1], Number(defineMatch[2]));
		defineMatch = defineRegex.exec(code);
	}

	const pick = (token: string): number | null => {
		if (/^\d+$/.test(token)) return Number(token);
		return defines.get(token) ?? null;
	};

	const collect = (regex: RegExp): number[] => {
		const found = new Set<number>();
		let match = regex.exec(code);
		while (match) {
			const value = pick(match[1]);
			if (value !== null) found.add(value);
			match = regex.exec(code);
		}
		return [...found];
	};

	return {
		digitalWritePins: collect(/\b(?:digitalWrite|analogWrite)\s*\(\s*([A-Za-z_]\w*|\d+)/g),
		analogReadPins: collect(/\banalogRead\s*\(\s*([A-Za-z_]\w*|\d+)/g)
	};
}

async function runSimulation(request: Extract<RuntimeRequest, { type: 'run' }>, runId: number) {
	const board = boardMap.get(request.boardId);
	if (!board) {
		post({ type: 'error', message: 'Không tìm thấy board để mô phỏng.' });
		post({ type: 'done' });
		return;
	}

	const syntaxError = diagnoseBasicSyntax(request.code);
	if (syntaxError) {
		post({ type: 'error', message: syntaxError });
		post({ type: 'done' });
		return;
	}

	for (const wire of request.wiring.wires) {
		const result = checkWire(request.wiring, wire);
		if (result.level === 'warn' || result.level === 'err') {
			post({ type: 'log', channel: result.level === 'err' ? 'err' : 'warn', message: result.message });
		}
	}

	const usage = parseUsage(request.code);
	for (const issue of checkCodeUsage({ ...request.wiring, wifiEnabled: request.wiring.wifiEnabled, usage })) {
		post({ type: 'log', channel: issue.level === 'err' ? 'err' : 'warn', message: issue.message });
	}

	const transformed = transpileArduinoToJs(request.code);

	const pinModes: Record<number, string> = {};
	const digitalState: Record<number, number> = {};
	const pwmState: Record<number, number> = {};
	let wifiEnabled = false;

	const assertRunning = () => {
		if (runId !== currentRunId) {
			throw new StopExecutionError('stopped');
		}
	};

	const emitState = () => {
		post({
			type: 'state',
			payload: {
				pins: digitalState,
				pwm: pwmState,
				wifiEnabled
			}
		});
	};

	const sleep = (ms: number) =>
		new Promise<void>((resolve, reject) => {
			assertRunning();
			const timer = setTimeout(() => {
				try {
					assertRunning();
					resolve();
				} catch (error) {
					reject(error);
				}
			}, Math.max(0, ms));
			if (runId !== currentRunId) {
				clearTimeout(timer);
				reject(new StopExecutionError('stopped'));
			}
		});

	const hasConnectionTo = (moduleId: string, pinLabel: string, target: string) => {
		return request.wiring.wires.some((wire) => {
			const pair = [wire.a, wire.b];
			const moduleEnd = pair.find(
				(end) => end.type === 'module' && end.moduleId === moduleId && end.pinLabel === pinLabel
			);
			const boardEnd = pair.find((end) => end.type === 'board');
			if (!moduleEnd || !boardEnd) return false;
			const pin =
				boardEnd.side === 'trai' ? board.chanTrai[boardEnd.index] : board.chanPhai[boardEnd.index];
			if (!pin) return false;
			if (target === 'GND') return pin.nhan === 'GND';
			if (target === '3V3') return pin.nhan === '3V3';
			if (target === '5V') return pin.nhan === '5V' || pin.nhan === 'VIN';
			if (target.startsWith('GPIO')) return pin.gpio === Number(target.replace('GPIO', ''));
			return false;
		});
	};

	const runtimeApi = {
		HIGH: 1,
		LOW: 0,
		OUTPUT: 'OUTPUT',
		INPUT: 'INPUT',
		INPUT_PULLUP: 'INPUT_PULLUP',
		DHT22: 22,
		WL_CONNECTED: 3,
		pinMode(pin: number, mode: string) {
			assertRunning();
			pinModes[pin] = mode;
		},
		digitalWrite(pin: number, value: number) {
			assertRunning();
			digitalState[pin] = value ? 1 : 0;
			pwmState[pin] = value ? 255 : 0;
			emitState();
		},
		analogWrite(pin: number, value: number) {
			assertRunning();
			const pwm = Math.max(0, Math.min(255, Math.round(value)));
			pwmState[pin] = pwm;
			digitalState[pin] = pwm > 0 ? 1 : 0;
			emitState();
		},
		digitalRead(pin: number) {
			assertRunning();
			const connectedButton = hasConnectionTo('nut-nhan', 'Chân 1', `GPIO${pin}`);
			if (connectedButton) {
				return request.env.buttonPressed ? 0 : 1;
			}
			return digitalState[pin] ?? 0;
		},
		analogRead(pin: number) {
			assertRunning();
			const connectedPot = hasConnectionTo('bien-tro-10k', 'SIG', `GPIO${pin}`);
			if (connectedPot) return request.env.potValue;
			return 0;
		},
		delay(ms: number) {
			return sleep(Number(ms) || 0);
		},
		millis() {
			return Date.now();
		},
		map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
			return Math.trunc(((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin);
		},
		Serial: {
			begin() {},
			print(msg: unknown) {
				post({ type: 'log', message: String(msg) });
			},
			println(msg: unknown = '') {
				post({ type: 'log', message: String(msg) });
			}
		},
		WiFi: {
			begin(ssid: string, password: string) {
				void ssid;
				void password;
				wifiEnabled = true;
				emitState();
			},
			status() {
				return wifiEnabled ? 3 : 6;
			}
		},
		DHT: class DHT {
			pin: number;
			constructor(pin: number) {
				this.pin = pin;
			}
			async begin() {
				return undefined;
			}
			async readTemperature() {
				return request.env.temperature;
			}
			async readHumidity() {
				return request.env.humidity;
			}
		},
		OLED: class OLED {
			constructor(sda?: number, scl?: number) {
				void sda;
				void scl;
			}
			async begin() {
				return undefined;
			}
			async clear() {
				return undefined;
			}
			async println(message: unknown) {
				post({ type: 'log', message: `[OLED] ${String(message)}` });
				return undefined;
			}
			async display() {
				return undefined;
			}
		},
		__yield() {
			assertRunning();
			return Promise.resolve();
		}
	};

	try {
		const AsyncFunction = Object.getPrototypeOf(async function () {
			return undefined;
		}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;
		const fn = new AsyncFunction(
			...Object.keys(runtimeApi),
			`${transformed}
			return {
				setup: typeof setup === 'function' ? setup : null,
				loop: typeof loop === 'function' ? loop : null
			};`
		);
		const entry = (await fn(...Object.values(runtimeApi))) as {
			setup: null | (() => Promise<void>);
			loop: null | (() => Promise<void>);
		};

		if (entry.setup) await entry.setup();

		const started = Date.now();
		let loops = 0;
		while (runId === currentRunId && entry.loop) {
			await entry.loop();
			await Promise.resolve();
			loops += 1;
			if (Date.now() - started > 12000 || loops > 25000) {
				post({ type: 'error', message: 'Chương trình chạy quá lâu. Em thử thêm delay() để mô phỏng ổn định hơn.' });
				break;
			}
		}
	} catch (error) {
		if (error instanceof StopExecutionError) {
			post({ type: 'log', channel: 'sys', message: 'Đã dừng chương trình.' });
		} else {
			const message = String((error as Error)?.message ?? error);
			if (message.includes('Unexpected token')) {
				post({ type: 'error', message: 'Lỗi cú pháp. Em kiểm tra lại dấu ngoặc và dấu ; ở gần dòng báo lỗi.' });
			} else {
				post({ type: 'error', message: `Lỗi chạy code: ${message}` });
			}
		}
	} finally {
		post({ type: 'done' });
	}
}

ctx.onmessage = (event: MessageEvent<RuntimeRequest>) => {
	const data = event.data;
	if (data.type === 'stop') {
		currentRunId += 1;
		return;
	}
	if (data.type === 'run') {
		currentRunId += 1;
		void runSimulation(data, currentRunId);
	}
};
