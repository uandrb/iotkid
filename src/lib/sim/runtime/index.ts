import type { RuntimeEvent, RuntimeRunRequest } from './types';

export interface RuntimeController {
	run: (request: RuntimeRunRequest, onEvent: (event: RuntimeEvent) => void) => void;
	stop: () => void;
	dispose: () => void;
}

export function createRuntimeController(): RuntimeController {
	let worker: Worker | null = null;

	const ensureWorker = (onEvent: (event: RuntimeEvent) => void) => {
		if (worker) return worker;
		worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
		worker.onmessage = (event: MessageEvent<RuntimeEvent>) => {
			onEvent(event.data);
		};
		return worker;
	};

	const stop = () => {
		if (!worker) return;
		worker.terminate();
		worker = null;
	};

	return {
		run(request, onEvent) {
			stop();
			const instance = ensureWorker(onEvent);
			instance.postMessage(request);
		},
		stop,
		dispose: stop
	};
}
