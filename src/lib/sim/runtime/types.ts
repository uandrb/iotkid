import type { WiringContext } from '../wiring';

export interface RuntimeEnv {
	buttonPressed: boolean;
	potValue: number;
	temperature: number;
	humidity: number;
}

export interface RuntimeRunRequest {
	type: 'run';
	code: string;
	boardId: string;
	wiring: WiringContext;
	env: RuntimeEnv;
}

export interface RuntimeStopRequest {
	type: 'stop';
}

export type RuntimeRequest = RuntimeRunRequest | RuntimeStopRequest;

export interface RuntimeLogEvent {
	type: 'log';
	message: string;
	channel?: 'sys' | 'warn' | 'err';
}

export interface RuntimeStateEvent {
	type: 'state';
	payload: {
		pins: Record<number, number>;
		pwm: Record<number, number>;
		wifiEnabled: boolean;
	};
}

export interface RuntimeErrorEvent {
	type: 'error';
	message: string;
}

export interface RuntimeDoneEvent {
	type: 'done';
}

export type RuntimeEvent =
	| RuntimeLogEvent
	| RuntimeStateEvent
	| RuntimeErrorEvent
	| RuntimeDoneEvent;
