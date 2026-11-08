import { describe, expect, it } from 'vitest';
import { evaluateUnlockedBadges } from './badges';

describe('badge unlock rules', () => {
	it('mở Thắp sáng đầu tiên khi hoàn thành bài LED đầu tiên', () => {
		const ids = evaluateUnlockedBadges({
			completedLessons: 1,
			completedProjects: 0,
			catalogViews: 0,
			firstLightDone: true,
			projectWithoutWireErrorDone: false
		});
		expect(ids).toContain('thap-sang-dau-tien');
	});

	it('mở Không chập mạch khi xong 1 dự án không lỗi dây', () => {
		const ids = evaluateUnlockedBadges({
			completedLessons: 1,
			completedProjects: 1,
			catalogViews: 0,
			firstLightDone: false,
			projectWithoutWireErrorDone: true
		});
		expect(ids).toContain('khong-chap-mach');
	});

	it('mở Thám tử sơ đồ chân khi xem >= 5 linh kiện', () => {
		const ids = evaluateUnlockedBadges({
			completedLessons: 0,
			completedProjects: 0,
			catalogViews: 5,
			firstLightDone: false,
			projectWithoutWireErrorDone: false
		});
		expect(ids).toContain('tham-tu-so-do-chan');
	});

	it('mở Kỹ sư IoT nhí khi xong 5 bài', () => {
		const ids = evaluateUnlockedBadges({
			completedLessons: 5,
			completedProjects: 0,
			catalogViews: 0,
			firstLightDone: false,
			projectWithoutWireErrorDone: false
		});
		expect(ids).toContain('ky-su-iot-nhi');
	});

	it('mở Nhà sáng chế khi xong 3 dự án', () => {
		const ids = evaluateUnlockedBadges({
			completedLessons: 0,
			completedProjects: 3,
			catalogViews: 0,
			firstLightDone: false,
			projectWithoutWireErrorDone: false
		});
		expect(ids).toContain('nha-sang-che');
	});
});
