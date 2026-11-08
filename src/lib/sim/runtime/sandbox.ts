import { diagnoseBasicSyntax, transpileArduinoToJs } from './transpile';

export interface SandboxRunOptions {
	buttonPressed?: boolean;
	potValue?: number;
	temperature?: number;
	humidity?: number;
	loops?: number;
}

export interface SandboxRunResult {
	pins: Record<number, number>;
	pwm: Record<number, number>;
	logs: string[];
}

export async function runArduinoInSandbox(
	code: string,
	options: SandboxRunOptions = {}
): Promise<SandboxRunResult> {
	const syntax = diagnoseBasicSyntax(code);
	if (syntax) {
		throw new Error(syntax);
	}
	const transformed = transpileArduinoToJs(code);
	const logs: string[] = [];
	const pinState: Record<number, number> = {};
	const pwmState: Record<number, number> = {};

	let wifiEnabled = false;
	let stepCount = 0;
	const maxSteps = 20000;

	const assertStep = () => {
		stepCount += 1;
		if (stepCount > maxSteps) {
			throw new Error('Quá số bước mô phỏng cho phép.');
		}
	};

	const api = {
		HIGH: 1,
		LOW: 0,
		OUTPUT: 'OUTPUT',
		INPUT: 'INPUT',
		INPUT_PULLUP: 'INPUT_PULLUP',
		DHT22: 22,
		WL_CONNECTED: 3,
		pinMode(pin: number, mode: string) {
			void pin;
			void mode;
			assertStep();
		},
		digitalWrite(pin: number, value: number) {
			assertStep();
			pinState[pin] = value ? 1 : 0;
			pwmState[pin] = value ? 255 : 0;
		},
		analogWrite(pin: number, value: number) {
			assertStep();
			const pwm = Math.max(0, Math.min(255, Math.round(value)));
			pwmState[pin] = pwm;
			pinState[pin] = pwm > 0 ? 1 : 0;
		},
		digitalRead(pin: number) {
			void pin;
			assertStep();
			return options.buttonPressed ? 0 : 1;
		},
		analogRead(pin: number) {
			void pin;
			assertStep();
			return options.potValue ?? 2048;
		},
		delay(ms: number) {
			void ms;
			assertStep();
			return Promise.resolve();
		},
		millis() {
			assertStep();
			return Date.now();
		},
		map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
			assertStep();
			return Math.trunc(((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin);
		},
		Serial: {
			begin() {},
			print(msg: unknown) {
				logs.push(String(msg));
			},
			println(msg: unknown = '') {
				logs.push(String(msg));
			}
		},
		WiFi: {
			begin() {
				wifiEnabled = true;
			},
			status() {
				return wifiEnabled ? 3 : 6;
			}
		},
		DHT: class DHT {
			constructor(pin: number) {
				void pin;
			}
			async begin() {
				return undefined;
			}
			async readTemperature() {
				return options.temperature ?? 28;
			}
			async readHumidity() {
				return options.humidity ?? 65;
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
			async println(msg: unknown) {
				logs.push(`[OLED] ${String(msg)}`);
				return undefined;
			}
			async display() {
				return undefined;
			}
		},
		__yield() {
			assertStep();
			return Promise.resolve();
		}
	};

	const AsyncFunction = Object.getPrototypeOf(async function () {
		return undefined;
	}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;
	const fn = new AsyncFunction(
		...Object.keys(api),
		`${transformed}
		return { setup: typeof setup === 'function' ? setup : null, loop: typeof loop === 'function' ? loop : null };`
	);
	const entry = (await fn(...Object.values(api))) as {
		setup: null | (() => Promise<void>);
		loop: null | (() => Promise<void>);
	};

	if (entry.setup) await entry.setup();
	const loopCount = options.loops ?? 3;
	for (let i = 0; i < loopCount; i += 1) {
		if (!entry.loop) break;
		await entry.loop();
	}

	return { pins: pinState, pwm: pwmState, logs };
}
