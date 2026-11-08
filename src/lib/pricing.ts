export function parseVietnamesePriceRange(text: string): { min: number; max: number } | null {
	const numbers = text.match(/\d[\d.]*/g)?.map((item) => Number(item.replaceAll('.', ''))) ?? [];
	if (numbers.length === 0) return null;
	if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
	return { min: Math.min(numbers[0], numbers[1]), max: Math.max(numbers[0], numbers[1]) };
}

export function formatVnd(value: number): string {
	return new Intl.NumberFormat('vi-VN').format(value);
}
