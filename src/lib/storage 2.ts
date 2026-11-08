export function readLocal<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) {
			return fallback;
		}
		return JSON.parse(raw) as T;
	} catch (error) {
		console.error(`Không thể đọc localStorage cho key "${key}"`, error);
		return fallback;
	}
}

export function writeLocal<T>(key: string, value: T): boolean {
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (error) {
		console.error(`Không thể ghi localStorage cho key "${key}"`, error);
		return false;
	}
}
