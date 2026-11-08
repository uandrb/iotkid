export interface WireConnection {
	from: string;
	to: string;
}

const FORBIDDEN_PAIRS = new Set(['VCC->GND', 'GND->VCC']);

export function isConnectionSafe(connection: WireConnection): boolean {
	return !FORBIDDEN_PAIRS.has(`${connection.from}->${connection.to}`);
}
