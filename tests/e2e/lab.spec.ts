import { expect, test } from '@playwright/test';

test('preset nhay-led: nối 2 dây và chạy LED', async ({ page }) => {
	await page.goto('/phong-lab?preset=nhay-led');

	await page.locator('[data-endpoint-key="m:led1:LED (+)"]').click();
	await page.locator('[data-endpoint-key="b:phai:11"]').click(); // GPIO2

	await page.locator('[data-endpoint-key="m:led1:LED (-)"]').click();
	await page.locator('[data-endpoint-key="b:phai:13"]').click(); // GND

	await page.getByRole('button', { name: 'Chạy' }).click();

	await page.waitForFunction(() => {
		const text = document.querySelector('[data-testid="led-state"]')?.textContent ?? '';
		return text.includes('Sáng');
	}, { timeout: 2000 });

	await expect(page.locator('[data-testid="led-state"]')).toContainText('Sáng');
});
