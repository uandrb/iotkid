export type BadgeId =
	| 'thap-sang-dau-tien'
	| 'khong-chap-mach'
	| 'tham-tu-so-do-chan'
	| 'ky-su-iot-nhi'
	| 'nha-sang-che';

export interface BadgeDefinition {
	id: BadgeId;
	title: string;
	description: string;
}

export interface BadgeProgressInput {
	completedLessons: number;
	completedProjects: number;
	catalogViews: number;
	firstLightDone: boolean;
	projectWithoutWireErrorDone: boolean;
}

export const BADGES: BadgeDefinition[] = [
	{
		id: 'thap-sang-dau-tien',
		title: 'Thắp sáng đầu tiên',
		description: 'Hoàn thành bài nháy LED đầu tiên.'
	},
	{
		id: 'khong-chap-mach',
		title: 'Không chập mạch',
		description: 'Hoàn thành 1 dự án mà không nối sai dây.'
	},
	{
		id: 'tham-tu-so-do-chan',
		title: 'Thám tử sơ đồ chân',
		description: 'Đã xem ít nhất 5 linh kiện/board.'
	},
	{
		id: 'ky-su-iot-nhi',
		title: 'Kỹ sư IoT nhí',
		description: 'Hoàn thành 5 bài học.'
	},
	{
		id: 'nha-sang-che',
		title: 'Nhà sáng chế',
		description: 'Hoàn thành 3 dự án.'
	}
];

export function evaluateUnlockedBadges(input: BadgeProgressInput): BadgeId[] {
	const unlocked: BadgeId[] = [];
	if (input.firstLightDone) unlocked.push('thap-sang-dau-tien');
	if (input.projectWithoutWireErrorDone) unlocked.push('khong-chap-mach');
	if (input.catalogViews >= 5) unlocked.push('tham-tu-so-do-chan');
	if (input.completedLessons >= 5) unlocked.push('ky-su-iot-nhi');
	if (input.completedProjects >= 3) unlocked.push('nha-sang-che');
	return unlocked;
}

export function badgeSvg(id: BadgeId): string {
	const palette: Record<BadgeId, { bg: string; fg: string; icon: string }> = {
		'thap-sang-dau-tien': { bg: '#fef3c7', fg: '#b45309', icon: '💡' },
		'khong-chap-mach': { bg: '#dcfce7', fg: '#166534', icon: '🛡️' },
		'tham-tu-so-do-chan': { bg: '#dbeafe', fg: '#1e40af', icon: '🧭' },
		'ky-su-iot-nhi': { bg: '#ede9fe', fg: '#5b21b6', icon: '🧑‍🔧' },
		'nha-sang-che': { bg: '#fee2e2', fg: '#9f1239', icon: '🏆' }
	};
	const color = palette[id];
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="${id}">
		<circle cx="90" cy="90" r="84" fill="${color.bg}" stroke="${color.fg}" stroke-width="8"/>
		<text x="90" y="102" text-anchor="middle" font-size="52">${color.icon}</text>
	</svg>`;
}
