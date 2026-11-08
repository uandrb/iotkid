import { boardMap, moduleMap } from '../catalog';
import type { Board, Module } from '../schema';

export type CheckLevel = 'ok' | 'info' | 'warn' | 'err';

export interface WireCheckResult {
	level: CheckLevel;
	message: string;
}

export type BoardEndpoint = {
	type: 'board';
	side: 'trai' | 'phai';
	index: number;
};

export type ModuleEndpoint = {
	type: 'module';
	compId: string;
	moduleId: string;
	pinLabel: string;
};

export type WireEndpoint = BoardEndpoint | ModuleEndpoint;

export interface Wire {
	id: string;
	a: WireEndpoint;
	b: WireEndpoint;
}

export interface WiringContext {
	boardId: string;
	wires: Wire[];
	wifiEnabled?: boolean;
	usage?: {
		digitalWritePins?: number[];
		analogReadPins?: number[];
	};
}

function response(level: CheckLevel, message: string): WireCheckResult {
	return { level, message };
}

function getBoard(ctx: WiringContext): Board {
	const board = boardMap.get(ctx.boardId);
	if (!board) {
		throw new Error(`Không tìm thấy board: ${ctx.boardId}`);
	}
	return board;
}

function getBoardPin(board: Board, ep: BoardEndpoint) {
	const pins = ep.side === 'trai' ? board.chanTrai : board.chanPhai;
	const pin = pins[ep.index];
	if (!pin) {
		throw new Error(`Không tìm thấy chân board ${ep.side}[${ep.index}]`);
	}
	return pin;
}

function getModule(ep: ModuleEndpoint): Module {
	const mod = moduleMap.get(ep.moduleId);
	if (!mod) {
		throw new Error(`Không tìm thấy module: ${ep.moduleId}`);
	}
	return mod;
}

function getModulePin(ep: ModuleEndpoint): Module['chan'][number] {
	const mod = getModule(ep);
	const pin = mod.chan.find((item) => item.nhan === ep.pinLabel);
	if (!pin) {
		throw new Error(`Không tìm thấy chân ${ep.pinLabel} của module ${mod.ten}`);
	}
	return pin;
}

function isPower(pinLabel: string): boolean {
	return pinLabel === '3V3' || pinLabel === '5V' || pinLabel === 'VIN';
}

function isGround(pinLabel: string): boolean {
	return pinLabel === 'GND';
}

function boardPinRole(pin: { nhan: string; gpio: number | null }) {
	if (isGround(pin.nhan)) return 'gnd' as const;
	if (isPower(pin.nhan)) return 'pwr' as const;
	if (pin.gpio === null) return 'ctrl' as const;
	return 'gpio' as const;
}

function checkBoardRestrictions(board: Board, gpio: number): WireCheckResult | null {
	if (board.nhomDacBiet.khongDung.includes(gpio)) {
		return response('err', `GPIO${gpio} đang dành cho Flash/PSRAM, không dùng để nối linh kiện.`);
	}
	if (board.nhomDacBiet.strapping.includes(gpio)) {
		return response('warn', `GPIO${gpio} là chân strapping, cần tránh kéo sai mức lúc khởi động.`);
	}
	if (
		board.nhomDacBiet.usb.includes(gpio) ||
		board.nhomDacBiet.uart.some((item) => item.includes(`${gpio}`))
	) {
		return response(
			'warn',
			`GPIO${gpio} đang gắn với UART/USB, có thể gây lỗi nạp code hoặc mất kết nối serial.`
		);
	}
	return null;
}

function checkModuleToBoard(
	ctx: WiringContext,
	board: Board,
	moduleEp: ModuleEndpoint,
	boardEp: BoardEndpoint
): WireCheckResult {
	const mod = getModule(moduleEp);
	const modPin = getModulePin(moduleEp);
	const boardPin = getBoardPin(board, boardEp);
	const role = boardPinRole(boardPin);
	const gpio = boardPin.gpio;

	if (mod.id === 'loa-4ohm-3w' && role === 'gpio') {
		return response(
			'err',
			'Loa không nối thẳng vào GPIO. Em cần nối loa qua ampli MAX98357A.'
		);
	}

	if (mod.id === 'led-dien-tro-220') {
		if (modPin.nhan.includes('(+)') && role === 'gnd') {
			return response(
				'err',
				'LED có thể đang cắm ngược: chân (+) không được nối GND.'
			);
		}
		if (modPin.nhan.includes('(-)') && role === 'gpio') {
			return response(
				'warn',
				'LED có thể đang cắm ngược: chân (-) nên về GND.'
			);
		}
	}

	if (role === 'ctrl') {
		return response('err', `Chân ${boardPin.nhan} là chân điều khiển/reset, không nối linh kiện.`);
	}

	const restriction = gpio === null ? null : checkBoardRestrictions(board, gpio);
	if (restriction) {
		return restriction;
	}

	switch (modPin.canNoi) {
		case 'gnd':
			return role === 'gnd'
				? response('ok', `Đúng: ${mod.ten} chân ${modPin.nhan} → GND.`)
				: response('err', `Chân ${modPin.nhan} của ${mod.ten} phải nối GND.`);
		case 'chi3v3':
			if (boardPin.nhan === '3V3') return response('ok', `Đúng: ${mod.ten} dùng 3.3V.`);
			if (boardPin.nhan === '5V' || boardPin.nhan === 'VIN') {
				return response('err', `${mod.ten} chỉ dùng 3.3V. Cấp 5V có thể làm hỏng module.`);
			}
			return response('warn', `${mod.ten} chân ${modPin.nhan} nên nối 3V3.`);
		case '3v3':
			if (boardPin.nhan === '3V3') return response('ok', `Đúng: ${mod.ten} dùng 3.3V.`);
			return response('warn', `${mod.ten} chân ${modPin.nhan} nên nối 3V3.`);
		case 'nguon':
			if (boardPin.nhan === '3V3' || boardPin.nhan === '5V' || boardPin.nhan === 'VIN') {
				return response('ok', `Đúng: ${mod.ten} chân ${modPin.nhan} đã cấp nguồn.`);
			}
			return response('err', `${mod.ten} chân ${modPin.nhan} phải nối vào chân nguồn.`);
		case 'gpio-ra':
		case 'gpio-vao':
		case 'gpio':
		case 'adc':
			if (role !== 'gpio' || gpio === null) {
				if (role === 'gnd' || role === 'pwr') {
					return response(
						'err',
						`Chân tín hiệu ${modPin.nhan} của ${mod.ten} không được nối vào ${
							role === 'gnd' ? 'GND' : 'nguồn'
						}.`
					);
				}
				return response('err', `Chân ${modPin.nhan} của ${mod.ten} phải nối vào GPIO.`);
			}
			if (modPin.canNoi === 'gpio-ra' && board.nhomDacBiet.chiDoc.includes(gpio)) {
				return response('err', `GPIO${gpio} chỉ đọc, không dùng làm đầu ra điều khiển.`);
			}
			if (modPin.canNoi === 'adc') {
				const hasAdc = board.nhomDacBiet.adc1.includes(gpio) || board.nhomDacBiet.adc2.includes(gpio);
				if (!hasAdc) {
					return response('err', `GPIO${gpio} không có ADC, không dùng để đọc analog.`);
				}
				if (ctx.wifiEnabled && board.nhomDacBiet.adc2.includes(gpio)) {
					return response('warn', `GPIO${gpio} thuộc ADC2, có thể không đọc được khi bật Wi-Fi.`);
				}
			}
			return response('ok', `Đúng: ${mod.ten} chân ${modPin.nhan} nối GPIO${gpio}.`);
		case 'loa':
			return response('warn', 'Chân loa nên nối qua ampli, không nối vào board trực tiếp.');
		default:
			return response('info', 'Đã nối dây.');
	}
}

export function checkWire(ctx: WiringContext, wire: Wire): WireCheckResult {
	const board = getBoard(ctx);
	const aBoard = wire.a.type === 'board';
	const bBoard = wire.b.type === 'board';

	if (aBoard && bBoard) {
		const aPin = getBoardPin(board, wire.a);
		const bPin = getBoardPin(board, wire.b);
		const aRole = boardPinRole(aPin);
		const bRole = boardPinRole(bPin);

		if (
			(aRole === 'pwr' && bRole === 'gnd') ||
			(aRole === 'gnd' && bRole === 'pwr')
		) {
			return response('err', 'Chập nguồn với GND! Dây này nguy hiểm, cần tháo ngay.');
		}
		if (aRole === 'pwr' && bRole === 'pwr') {
			return response('warn', 'Không nên nối trực tiếp hai chân nguồn với nhau.');
		}
		return response('warn', 'Nối board với board thường không cần thiết trong bài này.');
	}

	if (!aBoard && !bBoard) {
		return response(
			'warn',
			'Hai module nối trực tiếp thường không đúng. Em nên nối từng module vào board.'
		);
	}

	const moduleEp = (aBoard ? wire.b : wire.a) as ModuleEndpoint;
	const boardEp = (aBoard ? wire.a : wire.b) as BoardEndpoint;
	return checkModuleToBoard(ctx, board, moduleEp, boardEp);
}

export function checkCodeUsage(ctx: WiringContext): WireCheckResult[] {
	const board = getBoard(ctx);
	const checks: WireCheckResult[] = [];
	const outPins = ctx.usage?.digitalWritePins ?? [];
	const adcPins = ctx.usage?.analogReadPins ?? [];

	for (const gpio of outPins) {
		if (board.nhomDacBiet.chiDoc.includes(gpio)) {
			checks.push(response('err', `GPIO${gpio} chỉ đọc, không thể dùng digitalWrite/analogWrite.`));
		}
	}

	for (const gpio of adcPins) {
		const hasAdc =
			board.nhomDacBiet.adc1.includes(gpio) || board.nhomDacBiet.adc2.includes(gpio);
		if (!hasAdc) {
			checks.push(response('err', `GPIO${gpio} không có ADC, analogRead sẽ không đúng.`));
			continue;
		}
		if (ctx.wifiEnabled && board.nhomDacBiet.adc2.includes(gpio)) {
			checks.push(response('warn', `GPIO${gpio} thuộc ADC2, có thể lỗi khi Wi-Fi đang bật.`));
		}
	}
	return checks;
}
