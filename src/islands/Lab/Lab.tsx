import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap } from '@codemirror/commands';
import { boardMap, moduleMap } from '../../lib/catalog';
import { createRuntimeController } from '../../lib/sim/runtime';
import type { RuntimeEvent } from '../../lib/sim/runtime/types';
import {
	arduinoSamples,
	getProjectByPreset,
	labProjects,
	supportedArduinoCommands
} from '../../lib/sim/projects';
import { saveLabWireStatus } from '../../lib/progress';
import {
	createLabWorkId,
	decodeSharedWorkFromHash,
	encodeSharedWork,
	getLabWork,
	getStorageStatus,
	saveLabWork
} from '../../lib/storage';
import {
	checkWire,
	type BoardEndpoint,
	type ModuleEndpoint,
	type Wire,
	type WireEndpoint
} from '../../lib/sim/wiring';
import './lab.css';

type RuntimePinState = {
	pins: Record<number, number>;
	pwm: Record<number, number>;
	wifiEnabled: boolean;
};

type InstanceComponent = {
	compId: string;
	moduleId: string;
	x: number;
	y: number;
};

const BOARD_X = 330;
const BOARD_Y = 70;
const BOARD_W = 240;
const PIN_PITCH = 24;
const MODULE_WIDTH = 210;

const mobileTabs = {
	code: 'code',
	circuit: 'circuit'
} as const;

type MobileTab = (typeof mobileTabs)[keyof typeof mobileTabs];

const AUTOSAVE_DEBOUNCE_MS = 1000;

function defaultComponentsForProject(projectId: string) {
	const project = labProjects[projectId] ?? labProjects['nhay-led'];
	return project.components.map((item, index) => ({
		...item,
		x: index % 2 === 0 ? 90 : 680,
		y: 130 + index * 130
	}));
}

function endpointKey(endpoint: WireEndpoint): string {
	if (endpoint.type === 'board') return `b:${endpoint.side}:${endpoint.index}`;
	return `m:${endpoint.compId}:${endpoint.pinLabel}`;
}

function parsePresetId(raw: string | null): string | null {
	if (!raw) return null;
	return raw.startsWith('preset-') ? raw.replace('preset-', '') : raw;
}

export default function Lab() {
	const [boardId, setBoardId] = useState<'esp32-devkit-v1' | 'esp32-s3-devkitc-1-n16r8'>(
		'esp32-devkit-v1'
	);
	const [components, setComponents] = useState<InstanceComponent[]>([]);
	const [wires, setWires] = useState<Wire[]>([]);
	const [selected, setSelected] = useState<WireEndpoint | null>(null);
	const [serialLines, setSerialLines] = useState<string[]>([]);
	const [runtimeState, setRuntimeState] = useState<RuntimePinState>({
		pins: {},
		pwm: {},
		wifiEnabled: false
	});
	const [running, setRunning] = useState(false);
	const [code, setCode] = useState(arduinoSamples['nhay-led']);
	const [activePreset, setActivePreset] = useState<string>('nhay-led');
	const [stepIndex, setStepIndex] = useState(0);
	const [hintLevel, setHintLevel] = useState(0);
	const [tempValue, setTempValue] = useState(28);
	const [humValue, setHumValue] = useState(65);
	const [potValue, setPotValue] = useState(2048);
	const [buttonPressed, setButtonPressed] = useState(false);
	const [mobileTab, setMobileTab] = useState<MobileTab>('code');
	const [lastMessage, setLastMessage] = useState('Chọn hai chân để nối dây.');
	const [viewMode, setViewMode] = useState(false);
	const [workId, setWorkId] = useState('');
	const [workName, setWorkName] = useState('Bài làm chưa đặt tên');
	const [storageWarning, setStorageWarning] = useState<string | null>(null);

	const editorRootRef = useRef<HTMLDivElement | null>(null);
	const editorViewRef = useRef<EditorView | null>(null);
	const runtimeRef = useRef(createRuntimeController());
	const wireCounterRef = useRef(1);

	const board = useMemo(() => boardMap.get(boardId), [boardId]);
	const project = useMemo(() => labProjects[activePreset] ?? null, [activePreset]);

	useEffect(() => {
		const status = getStorageStatus();
		if (!status.ok) {
			setStorageWarning(status.message ?? 'Trình duyệt đang chặn lưu trữ, hãy dùng Xuất file.');
		}
		const params = new URLSearchParams(window.location.search);
		const queryWorkId = params.get('work');
		const fromHash = decodeSharedWorkFromHash(window.location.hash);
		if (fromHash.ok && fromHash.value) {
			const shared = fromHash.value;
			setViewMode(true);
			setWorkId(shared.id);
			setWorkName(`${shared.name} (Bản xem)`);
			setBoardId(shared.boardId);
			setActivePreset(shared.presetId ?? 'nhay-led');
			setComponents(shared.components);
			setWires(shared.wires);
			setCode(shared.code);
			wireCounterRef.current = Math.max(1, shared.wires.length + 1);
			setLastMessage('Đang mở bản xem từ link chia sẻ. Em bấm "Lưu về máy em" để chỉnh sửa.');
			return;
		}
		if (queryWorkId) {
			const saved = getLabWork(queryWorkId);
			if (saved) {
				setViewMode(false);
				setWorkId(saved.id);
				setWorkName(saved.name);
				setBoardId(saved.boardId);
				setActivePreset(saved.presetId ?? 'nhay-led');
				setComponents(saved.components);
				setWires(saved.wires);
				setCode(saved.code);
				wireCounterRef.current = Math.max(1, saved.wires.length + 1);
				setLastMessage(`Đã mở bài làm: ${saved.name}.`);
				return;
			}
		}
		const preset = parsePresetId(params.get('preset'));
		const nextProject = getProjectByPreset(preset) ?? labProjects['nhay-led'];
		const nextWorkId = createLabWorkId();
		setWorkId(nextWorkId);
		setWorkName(`Bản nháp ${nextProject.title}`);
		setActivePreset(nextProject.id);
		setBoardId(nextProject.boardId);
		setCode(nextProject.defaultCode);
		setWires([]);
		wireCounterRef.current = 1;
		setComponents(defaultComponentsForProject(nextProject.id));
		setStepIndex(0);
		setHintLevel(0);
		saveLabWireStatus(nextProject.id, false);
	}, []);

	useEffect(() => {
		if (viewMode) return;
		if (!workId) return;
		const timer = window.setTimeout(() => {
			const result = saveLabWork({
				id: workId,
				name: workName,
				boardId,
				presetId: activePreset || null,
				components,
				wires,
				code
			});
			if (!result.ok) {
				setStorageWarning(result.message ?? 'Trình duyệt đang chặn lưu trữ, hãy dùng Xuất file.');
			}
		}, AUTOSAVE_DEBOUNCE_MS);
		return () => window.clearTimeout(timer);
	}, [activePreset, boardId, code, components, viewMode, wires, workId, workName]);

	useEffect(() => {
		if (!editorRootRef.current || editorViewRef.current) return;
		const state = EditorState.create({
			doc: code,
			extensions: [
				lineNumbers(),
				keymap.of(defaultKeymap),
				cpp(),
				oneDark,
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						setCode(update.state.doc.toString());
					}
				})
			]
		});
		editorViewRef.current = new EditorView({
			state,
			parent: editorRootRef.current
		});
		return () => {
			editorViewRef.current?.destroy();
			editorViewRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (!editorViewRef.current) return;
		const current = editorViewRef.current.state.doc.toString();
		if (current === code) return;
		editorViewRef.current.dispatch({
			changes: { from: 0, to: current.length, insert: code }
		});
	}, [code]);

	useEffect(() => {
		return () => {
			runtimeRef.current.dispose();
		};
	}, []);

	const getBoardPin = (endpoint: BoardEndpoint) => {
		if (!board) return null;
		const list = endpoint.side === 'trai' ? board.chanTrai : board.chanPhai;
		return list[endpoint.index] ?? null;
	};

	const endpointToTarget = (endpoint: WireEndpoint): string => {
		if (endpoint.type === 'board') {
			const pin = getBoardPin(endpoint);
			if (!pin) return '';
			return pin.gpio !== null ? `GPIO${pin.gpio}` : pin.nhan;
		}
		return `${endpoint.compId}.${endpoint.pinLabel}`;
	};

	const isWireMatching = (connection: { compId: string; pinLabel: string; target: string; alternatives?: string[] }) => {
		const candidates = [connection.target, ...(connection.alternatives ?? [])];
		return wires.some((wire) => {
			const pair: [WireEndpoint, WireEndpoint][] = [
				[wire.a, wire.b],
				[wire.b, wire.a]
			];
			return pair.some(([first, second]) => {
				if (first.type !== 'module') return false;
				if (first.compId !== connection.compId || first.pinLabel !== connection.pinLabel) return false;
				return candidates.includes(endpointToTarget(second));
			});
		});
	};

	const stepDone = (index: number) => {
		if (!project) return false;
		const step = project.steps[index];
		return step.connections.every((connection) => isWireMatching(connection));
	};

	useEffect(() => {
		if (!project) return;
		const firstPending = project.steps.findIndex((_step, idx) => !stepDone(idx));
		setStepIndex(firstPending < 0 ? project.steps.length - 1 : firstPending);
	}, [wires, project]);

	const checkAndPushWire = (newWire: Wire) => {
		const result = checkWire(
			{
				boardId,
				wires: [...wires, newWire],
				wifiEnabled: runtimeState.wifiEnabled
			},
			newWire
		);
		setLastMessage(result.message);
		if (result.level === 'warn' || result.level === 'err') {
			saveLabWireStatus(activePreset, true);
		}
		setWires((prev) => [...prev, newWire]);
	};

	const onEndpointClick = (endpoint: WireEndpoint) => {
		if (!selected) {
			setSelected(endpoint);
			return;
		}
		if (endpointKey(selected) === endpointKey(endpoint)) {
			setSelected(null);
			return;
		}
		const exists = wires.some((wire) => {
			const sameA = endpointKey(wire.a) === endpointKey(selected) && endpointKey(wire.b) === endpointKey(endpoint);
			const sameB = endpointKey(wire.a) === endpointKey(endpoint) && endpointKey(wire.b) === endpointKey(selected);
			return sameA || sameB;
		});
		if (exists) {
			setLastMessage('Hai chân này đã nối rồi.');
			setSelected(null);
			return;
		}
		const wire: Wire = {
			id: `w-${wireCounterRef.current++}`,
			a: selected,
			b: endpoint
		};
		checkAndPushWire(wire);
		setSelected(null);
	};

	const onDeleteWire = (wireId: string) => {
		setWires((prev) => prev.filter((wire) => wire.id !== wireId));
		setLastMessage('Đã xóa dây nối.');
	};

	const runCode = () => {
		if (!board) return;
		setSerialLines([]);
		setRunning(true);
		runtimeRef.current.run(
			{
				type: 'run',
				code,
				boardId,
				wiring: {
					boardId,
					wires,
					wifiEnabled: runtimeState.wifiEnabled
				},
				env: {
					buttonPressed,
					potValue,
					temperature: tempValue,
					humidity: humValue
				}
			},
			(event: RuntimeEvent) => {
				if (event.type === 'log') {
					setSerialLines((prev) => [...prev.slice(-299), event.message]);
				}
				if (event.type === 'state') {
					setRuntimeState(event.payload);
				}
				if (event.type === 'error') {
					setSerialLines((prev) => [...prev.slice(-299), `[Lỗi] ${event.message}`]);
				}
				if (event.type === 'done') {
					setRunning(false);
				}
			}
		);
	};

	const stopCode = () => {
		runtimeRef.current.stop();
		setRunning(false);
		setSerialLines((prev) => [...prev.slice(-299), 'Đã dừng chương trình.']);
	};

	const autoWireOne = () => {
		if (!project) return;
		const currentStep = project.steps[stepIndex];
		const missing = currentStep.connections.find((connection) => !isWireMatching(connection));
		if (!missing || !board) return;

		const moduleEndpoint: ModuleEndpoint = {
			type: 'module',
			compId: missing.compId,
			moduleId:
				components.find((item) => item.compId === missing.compId)?.moduleId ?? 'led-dien-tro-220',
			pinLabel: missing.pinLabel
		};

		const allPins: Array<{ endpoint: BoardEndpoint; target: string }> = [
			...board.chanTrai.map((pin, index) => ({
				endpoint: { type: 'board', side: 'trai', index } as BoardEndpoint,
				target: pin.gpio !== null ? `GPIO${pin.gpio}` : pin.nhan
			})),
			...board.chanPhai.map((pin, index) => ({
				endpoint: { type: 'board', side: 'phai', index } as BoardEndpoint,
				target: pin.gpio !== null ? `GPIO${pin.gpio}` : pin.nhan
			}))
		];
		const targetPin = allPins.find((item) =>
			[item.target, ...(missing.alternatives ?? [])].includes(missing.target)
		);
		if (!targetPin) return;

		checkAndPushWire({
			id: `w-${wireCounterRef.current++}`,
			a: moduleEndpoint,
			b: targetPin.endpoint
		});
		setHintLevel(2);
	};

	const currentStep = project ? project.steps[stepIndex] : null;
	const doneCount = project ? project.steps.filter((_step, idx) => stepDone(idx)).length : 0;

	const getBoardPinPoint = (side: 'trai' | 'phai', index: number) => {
		const y = BOARD_Y + 60 + index * PIN_PITCH;
		const x = side === 'trai' ? BOARD_X : BOARD_X + BOARD_W;
		return { x, y };
	};

	const getModulePinPoint = (compId: string, pinLabel: string) => {
		const comp = components.find((item) => item.compId === compId);
		if (!comp) return null;
		const mod = moduleMap.get(comp.moduleId);
		if (!mod) return null;
		const pinIndex = mod.chan.findIndex((pin) => pin.nhan === pinLabel);
		if (pinIndex < 0) return null;
		return { x: comp.x + MODULE_WIDTH, y: comp.y + 52 + pinIndex * 28 };
	};

	const endpointPosition = (endpoint: WireEndpoint) => {
		if (endpoint.type === 'board') return getBoardPinPoint(endpoint.side, endpoint.index);
		return getModulePinPoint(endpoint.compId, endpoint.pinLabel);
	};

	const ledGlow = (() => {
		const ledComp = components.find((item) => item.moduleId === 'led-dien-tro-220');
		if (!ledComp || !board) return 0;
		const signalWire = wires.find(
			(wire) =>
				(wire.a.type === 'module' &&
					wire.a.compId === ledComp.compId &&
					wire.a.pinLabel === 'LED (+)' &&
					wire.b.type === 'board') ||
				(wire.b.type === 'module' &&
					wire.b.compId === ledComp.compId &&
					wire.b.pinLabel === 'LED (+)' &&
					wire.a.type === 'board')
		);
		if (!signalWire) return 0;
		const boardEp = (signalWire.a.type === 'board' ? signalWire.a : signalWire.b) as BoardEndpoint;
		const pin = getBoardPin(boardEp);
		if (!pin || pin.gpio === null) return 0;
		return (runtimeState.pwm[pin.gpio] ?? 0) / 255;
	})();

	const openProject = (projectId: string) => {
		const preset = labProjects[projectId];
		if (!preset) return;
		const nextWorkId = createLabWorkId();
		setViewMode(false);
		setWorkId(nextWorkId);
		setWorkName(`Bản nháp ${preset.title}`);
		setActivePreset(preset.id);
		setBoardId(preset.boardId);
		setCode(preset.defaultCode);
		setWires([]);
		setComponents(defaultComponentsForProject(preset.id));
		setStepIndex(0);
		setHintLevel(0);
		setLastMessage(`Đã mở preset ${preset.title}.`);
		saveLabWireStatus(preset.id, false);
	};

	const shareWork = () => {
		if (!workId) return;
		const result = saveLabWork({
			id: workId,
			name: workName,
			boardId,
			presetId: activePreset || null,
			components,
			wires,
			code
		});
		if (!result.ok || !result.value) {
			setStorageWarning(result.message ?? 'Không thể tạo link chia sẻ lúc này.');
			return;
		}
		const encoded = encodeSharedWork(result.value);
		const shareUrl = `${window.location.origin}/phong-lab#work=${encoded}`;
		navigator.clipboard
			?.writeText(shareUrl)
			.then(() => {
				setLastMessage('Đã sao chép link chia sẻ vào clipboard.');
			})
			.catch(() => {
				window.prompt('Em sao chép link này để chia sẻ:', shareUrl);
			});
	};

	const saveSharedToLocal = () => {
		if (!workId) return;
		const nextId = createLabWorkId();
		const result = saveLabWork({
			id: nextId,
			name: workName.replace(' (Bản xem)', ''),
			boardId,
			presetId: activePreset || null,
			components,
			wires,
			code
		});
		if (!result.ok) {
			setStorageWarning(result.message ?? 'Không thể lưu bài làm vào máy em.');
			return;
		}
		setWorkId(nextId);
		setViewMode(false);
		setLastMessage('Đã lưu bản xem về máy em. Em có thể tiếp tục chỉnh sửa.');
		window.history.replaceState({}, '', `/phong-lab?work=${nextId}`);
	};

	return (
		<section class="lab-root">
			<div class="lab-headline">
				<h1>Phòng Lab mô phỏng</h1>
				<p>
					Mô phỏng hỗ trợ một phần ngôn ngữ Arduino.{' '}
					<a href="#lenh-ho-tro">Xem danh sách lệnh được hỗ trợ</a>.
				</p>
				{storageWarning && <p class="storage-warning">{storageWarning}</p>}
				{viewMode && (
					<p class="view-mode-note">
						Đây là <strong>Bản xem</strong> từ link chia sẻ. Chỉ khi bấm "Lưu về máy em" thì mới ghi vào kho.
					</p>
				)}
			</div>

			<div class="preset-row">
				<label>
					<span>Tên bài làm</span>
					<input
						type="text"
						value={workName}
						onInput={(event) => setWorkName((event.target as HTMLInputElement).value)}
						disabled={viewMode}
					/>
				</label>
				<label>
					<span>Preset bài học</span>
					<select value={activePreset} onChange={(e) => openProject((e.target as HTMLSelectElement).value)}>
						{Object.values(labProjects).map((item) => (
							<option value={item.id}>{item.title}</option>
						))}
					</select>
				</label>
				<div class="run-row">
					{viewMode ? (
						<button type="button" class="btn" onClick={saveSharedToLocal}>
							Lưu về máy em
						</button>
					) : (
						<button type="button" class="btn" onClick={shareWork}>
							Chia sẻ link
						</button>
					)}
					<button type="button" class="btn run" onClick={runCode} disabled={running}>
						Chạy
					</button>
					<button type="button" class="btn stop" onClick={stopCode}>
						Dừng
					</button>
				</div>
			</div>

			<div class="mobile-tabs">
				<button type="button" class={mobileTab === 'code' ? 'on' : ''} onClick={() => setMobileTab('code')}>
					Code
				</button>
				<button
					type="button"
					class={mobileTab === 'circuit' ? 'on' : ''}
					onClick={() => setMobileTab('circuit')}
				>
					Mạch
				</button>
			</div>

			<div class="lab-grid">
				<div class={`code-pane ${mobileTab === 'code' ? 'active' : ''}`}>
					<div class="editor-shell" ref={editorRootRef}></div>
					<section class="serial-shell">
						<h2>Serial Monitor</h2>
						<pre>{serialLines.join('\n')}</pre>
					</section>
				</div>

				<div class={`circuit-pane ${mobileTab === 'circuit' ? 'active' : ''}`}>
					<div class="circuit-scroll">
						<svg viewBox="0 0 1080 740" class="circuit-svg" role="img" aria-label="Mạch mô phỏng">
							<rect x={BOARD_X} y={BOARD_Y} width={BOARD_W} height={520} rx={18} fill="#18243b" />
							<text x={BOARD_X + BOARD_W / 2} y={BOARD_Y + 30} fill="#f8fafc" text-anchor="middle" font-size="14">
								{board?.ten}
							</text>

							{board?.chanTrai.map((pin, index) => {
								const point = getBoardPinPoint('trai', index);
								const id = `board-trai-${index}`;
								const chosen =
									selected?.type === 'board' && selected.side === 'trai' && selected.index === index;
								return (
									<g>
										<circle
											cx={point.x}
											cy={point.y}
											r={chosen ? 10 : 8}
											fill="#22c55e"
											stroke="#fff"
											stroke-width={chosen ? 3 : 1}
											tabindex={0}
											data-endpoint-id={id}
											data-endpoint-key={endpointKey({ type: 'board', side: 'trai', index })}
											onClick={() =>
												onEndpointClick({ type: 'board', side: 'trai', index } as BoardEndpoint)
											}
											onKeyDown={(event) => {
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault();
													onEndpointClick({ type: 'board', side: 'trai', index } as BoardEndpoint);
												}
											}}
										/>
										<text x={point.x + 12} y={point.y + 4} fill="#f8fafc" font-size="12">
											{pin.gpio !== null ? `${pin.nhan}/GPIO${pin.gpio}` : pin.nhan}
										</text>
									</g>
								);
							})}
							{board?.chanPhai.map((pin, index) => {
								const point = getBoardPinPoint('phai', index);
								const id = `board-phai-${index}`;
								const chosen =
									selected?.type === 'board' && selected.side === 'phai' && selected.index === index;
								return (
									<g>
										<circle
											cx={point.x}
											cy={point.y}
											r={chosen ? 10 : 8}
											fill="#22c55e"
											stroke="#fff"
											stroke-width={chosen ? 3 : 1}
											tabindex={0}
											data-endpoint-id={id}
											data-endpoint-key={endpointKey({ type: 'board', side: 'phai', index })}
											onClick={() =>
												onEndpointClick({ type: 'board', side: 'phai', index } as BoardEndpoint)
											}
											onKeyDown={(event) => {
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault();
													onEndpointClick({ type: 'board', side: 'phai', index } as BoardEndpoint);
												}
											}}
										/>
										<text x={point.x - 12} y={point.y + 4} text-anchor="end" fill="#f8fafc" font-size="12">
											{pin.gpio !== null ? `${pin.nhan}/GPIO${pin.gpio}` : pin.nhan}
										</text>
									</g>
								);
							})}

							{components.map((comp) => {
								const mod = moduleMap.get(comp.moduleId);
								if (!mod) return null;
								return (
									<g>
										<rect x={comp.x} y={comp.y} width={MODULE_WIDTH} height={120} rx={12} fill="#fffef9" stroke="#d1d5db" />
										<text x={comp.x + 10} y={comp.y + 22} font-size="13" font-weight="700" fill="#1f2937">
											{mod.ten}
										</text>
										{mod.chan.map((pin, idx) => {
											const y = comp.y + 52 + idx * 28;
											const endpoint: ModuleEndpoint = {
												type: 'module',
												compId: comp.compId,
												moduleId: comp.moduleId,
												pinLabel: pin.nhan
											};
											const chosen =
												selected?.type === 'module' &&
												selected.compId === comp.compId &&
												selected.pinLabel === pin.nhan;
											return (
												<g>
													<circle
														cx={comp.x + MODULE_WIDTH}
														cy={y}
														r={chosen ? 10 : 8}
														fill="#d97706"
														stroke="#fff"
														stroke-width={chosen ? 3 : 1}
														tabindex={0}
														data-endpoint-id={`${comp.compId}-${pin.nhan}`}
														data-endpoint-key={endpointKey(endpoint)}
														onClick={() => onEndpointClick(endpoint)}
														onKeyDown={(event) => {
															if (event.key === 'Enter' || event.key === ' ') {
																event.preventDefault();
																onEndpointClick(endpoint);
															}
														}}
													/>
													<text x={comp.x + MODULE_WIDTH - 10} y={y + 4} text-anchor="end" font-size="12">
														{pin.nhan}
													</text>
												</g>
											);
										})}

										{comp.moduleId === 'led-dien-tro-220' && (
											<circle
												cx={comp.x + 40}
												cy={comp.y + 78}
												r={18 + ledGlow * 8}
												fill={`rgba(255, 90, 90, ${0.35 + ledGlow * 0.55})`}
											/>
										)}
									</g>
								);
							})}

							{wires.map((wire) => {
								const a = endpointPosition(wire.a);
								const b = endpointPosition(wire.b);
								if (!a || !b) return null;
								const check = checkWire(
									{
										boardId,
										wires,
										wifiEnabled: runtimeState.wifiEnabled
									},
									wire
								);
								const isBad = check.level === 'warn' || check.level === 'err';
								const stroke = check.level === 'err' ? '#dc2626' : check.level === 'warn' ? '#ea580c' : '#2563eb';
								return (
									<g onClick={() => onDeleteWire(wire.id)}>
										<path
											d={`M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`}
											fill="none"
											stroke={stroke}
											stroke-width={isBad ? 4 : 3}
											stroke-dasharray={isBad ? '8 6' : undefined}
											data-wire-id={wire.id}
										/>
										{isBad && (
											<text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 10} fill={stroke} font-size="16" font-weight="700">
												!
											</text>
										)}
									</g>
								);
							})}
						</svg>
					</div>

					<section class="guide">
						<h2>Hướng dẫn bước hiện tại</h2>
						<p data-testid="led-state">LED: {ledGlow > 0.1 ? 'Sáng' : 'Tắt'}</p>
						{project && currentStep ? (
							<div>
								<p>
									Bước {stepIndex + 1}/{project.steps.length}: <strong>{currentStep.title}</strong>
								</p>
								<p>{currentStep.description}</p>
								<p>Tiến độ: {doneCount}/{project.steps.length}</p>
								<div class="guide-actions">
									<button type="button" class="btn" onClick={() => setHintLevel((prev) => Math.min(prev + 1, 2))}>
										Em cần gợi ý
									</button>
									<button type="button" class="btn" onClick={autoWireOne}>
										Nối giúp em 1 dây
									</button>
								</div>
								{hintLevel >= 0 && <p>💡 {currentStep.hints.level1}</p>}
								{hintLevel >= 1 && <p>🔎 {currentStep.hints.level2}</p>}
								{hintLevel >= 2 && <p>🪄 {currentStep.hints.level3}</p>}
							</div>
						) : (
							<p>Chưa có preset.</p>
						)}
						<p>{lastMessage}</p>
					</section>

					<section class="sensor">
						<h2>Bảng điều khiển cảm biến</h2>
						<label>
							Nhiệt độ: {tempValue}°C
							<input type="range" min="10" max="45" value={tempValue} onInput={(e) => setTempValue(Number((e.target as HTMLInputElement).value))} />
						</label>
						<label>
							Biến trở: {potValue}
							<input type="range" min="0" max="4095" value={potValue} onInput={(e) => setPotValue(Number((e.target as HTMLInputElement).value))} />
						</label>
						<label>
							Độ ẩm: {humValue}%
							<input type="range" min="20" max="95" value={humValue} onInput={(e) => setHumValue(Number((e.target as HTMLInputElement).value))} />
						</label>
						<button
							type="button"
							class={`press-btn ${buttonPressed ? 'on' : ''}`}
							onMouseDown={() => setButtonPressed(true)}
							onMouseUp={() => setButtonPressed(false)}
							onMouseLeave={() => setButtonPressed(false)}
							onTouchStart={() => setButtonPressed(true)}
							onTouchEnd={() => setButtonPressed(false)}
						>
							Giữ để nhấn nút
						</button>
					</section>
				</div>
			</div>

			<section id="lenh-ho-tro" class="support">
				<h2>Danh sách lệnh hỗ trợ</h2>
				<ul>
					{supportedArduinoCommands.map((item) => (
						<li>{item}</li>
					))}
				</ul>
			</section>
		</section>
	);
}
