export function diagnoseBasicSyntax(source: string): string | null {
	const stack: Array<{ ch: string; line: number }> = [];
	const lines = source.split('\n');
	const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
		const line = lines[lineIndex];
		let quote: "'" | '"' | null = null;
		for (let i = 0; i < line.length; i += 1) {
			const ch = line[i];
			if (quote) {
				if (ch === '\\') {
					i += 1;
					continue;
				}
				if (ch === quote) quote = null;
				continue;
			}
			if (ch === '"' || ch === "'") {
				quote = ch;
				continue;
			}
			if (ch === '/' && line[i + 1] === '/') break;
			if ('({['.includes(ch)) {
				stack.push({ ch, line: lineIndex + 1 });
			} else if (')}]'.includes(ch)) {
				const top = stack.pop();
				if (!top || top.ch !== pairs[ch]) {
					return `Dòng ${lineIndex + 1}: thừa dấu “${ch}” hoặc thiếu dấu mở tương ứng.`;
				}
			}
		}
	}
	if (stack.length > 0) {
		const top = stack[stack.length - 1];
		return `Dòng ${top.line}: dấu “${top.ch}” chưa được đóng.`;
	}

	for (let i = 0; i < lines.length; i += 1) {
		const current = lines[i].replace(/\/\/.*$/g, '').trim();
		if (!current || current.startsWith('#')) continue;
		if (/^(if|else|for|while|switch|do)\b/.test(current)) continue;
		if (/[{};,]$/.test(current) || /^[{}]/.test(current)) continue;
		const next = (lines[i + 1] ?? '').trim();
		if (next.startsWith('.') || next.startsWith('+') || next.startsWith('&&') || next.startsWith('||')) {
			continue;
		}
		if (/[A-Za-z0-9_)\]"']$/.test(current)) {
			return `Dòng ${i + 1}: có thể em quên dấu ;`;
		}
	}
	return null;
}

function injectYieldInLoops(source: string): string {
	const re = /\b(while|for)\s*\(/g;
	const inserts: number[] = [];
	let match: RegExpExecArray | null = re.exec(source);
	while (match) {
		let i = match.index + match[0].length - 1;
		let depth = 0;
		for (; i < source.length; i += 1) {
			if (source[i] === '(') depth += 1;
			else if (source[i] === ')') {
				depth -= 1;
				if (depth === 0) break;
			}
		}
		let j = i + 1;
		while (j < source.length && /\s/.test(source[j])) j += 1;
		if (source[j] === '{') inserts.push(j + 1);
		match = re.exec(source);
	}
	let output = source;
	for (let idx = inserts.length - 1; idx >= 0; idx -= 1) {
		output = `${output.slice(0, inserts[idx])} await __yield(); ${output.slice(inserts[idx])}`;
	}
	return output;
}

export function transpileArduinoToJs(source: string): string {
	let out = source.replace(/\r/g, '');
	out = out.replace(/^\s*#include.*$/gm, '');
	out = out.replace(/^\s*#define\s+(\w+)\s+(.+?)\s*(\/\/.*)?$/gm, 'const $1 = $2;');
	out = out.replace(/\((?:unsigned\s+)?(?:int|long|float|double|byte)\)\s*/g, '');
	out = out.replace(
		/\b(?:void|int|long|float|double|bool|boolean|String|byte|unsigned\s+long|unsigned\s+int)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g,
		(_m, name, params) => {
			const parameterString = String(params).trim();
			const normalized =
				parameterString === '' || parameterString === 'void'
					? ''
					: parameterString
							.split(',')
							.map((p) =>
								p
									.trim()
									.replace(/[&*]/g, ' ')
									.trim()
									.split(/\s+/)
									.pop()
							)
							.join(', ');
			return `async function ${String(name)}(${normalized}) {`;
		}
	);
	out = out.replace(
		/^(\s*)(DHT|OLED)\s+([A-Za-z_]\w*)\s*(?:\(([^;]*)\))?\s*;/gm,
		(_m, indent, cls, name, args) => `${String(indent)}let ${String(name)} = new ${String(cls)}(${String(args ?? '')});`
	);
	out = out.replace(
		/\b(?:static\s+)?(?:const\s+)?(?:unsigned\s+)?(?:int|long|float|double|bool|boolean|byte|char|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t)\b\s*\*?\s*(?=[A-Za-z_]\w*\s*(?:=|;|,|\[))/g,
		'let '
	);
	out = out.replace(/\.length\(\)/g, '.length');
	out = out.replace(/\bdelay\s*\(/g, 'await delay(');
	out = out.replace(/\b([A-Za-z_]\w*)\.(begin|readTemperature|readHumidity|clear|println|display)\s*\(/g, 'await $1.$2(');
	out = injectYieldInLoops(out);
	return out;
}
