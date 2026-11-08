export interface StepConnection {
	compId: string;
	pinLabel: string;
	target: string;
	alternatives?: string[];
}

export interface ProjectStep {
	title: string;
	description: string;
	connections: StepConnection[];
	hints: {
		level1: string;
		level2: string;
		level3: string;
	};
}

export interface LabProject {
	id: string;
	title: string;
	boardId: 'esp32-devkit-v1' | 'esp32-s3-devkitc-1-n16r8';
	defaultCode: string;
	components: Array<{ compId: string; moduleId: string }>;
	steps: ProjectStep[];
}

export const arduinoSamples = {
	'nhay-led': `#define LED_PIN 2

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
}`,
	'nut-nhan': `#define BUTTON_PIN 4
#define LED_PIN 2

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(50);
}`,
	'bien-tro': `#define POT_PIN 34
#define LED_PIN 2

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int raw = analogRead(POT_PIN);
  int pwm = map(raw, 0, 4095, 0, 255);
  analogWrite(LED_PIN, pwm);
  delay(20);
}`,
	'tram-thoi-tiet': `#include <DHT.h>
#include "OLED.h"

#define DHT_PIN 4
DHT dht(DHT_PIN, DHT22);
OLED oled(21, 22);

void setup() {
  dht.begin();
  oled.begin();
}

void loop() {
  float nhietDo = dht.readTemperature();
  float doAm = dht.readHumidity();
  oled.clear();
  oled.println("TRAM THOI TIET");
  oled.println(String(nhietDo, 1) + " C");
  oled.println("Do am: " + String(doAm, 0) + "%");
  oled.display();
  delay(2000);
}`
};

export const labProjects: Record<string, LabProject> = {
	'nhay-led': {
		id: 'nhay-led',
		title: 'Nháy LED',
		boardId: 'esp32-devkit-v1',
		defaultCode: arduinoSamples['nhay-led'],
		components: [{ compId: 'led1', moduleId: 'led-dien-tro-220' }],
		steps: [
			{
				title: 'Nối LED vào GPIO2',
				description: 'Chân + của LED nhận tín hiệu điều khiển.',
				connections: [{ compId: 'led1', pinLabel: 'LED (+)', target: 'GPIO2' }],
				hints: {
					level1: 'Tìm hằng LED_PIN trong code để biết chân tín hiệu.',
					level2: 'Hãy nối chân LED (+) tới GPIO2.',
					level3: 'Mình đã nối sẵn dây LED (+) → GPIO2 cho em.'
				}
			},
			{
				title: 'Nối LED về GND',
				description: 'Chân - của LED phải về GND để mạch kín.',
				connections: [{ compId: 'led1', pinLabel: 'LED (-)', target: 'GND' }],
				hints: {
					level1: 'Mọi mạch điện cần một đường về mass.',
					level2: 'Hãy nối chân LED (-) tới một chân GND.',
					level3: 'Mình đã nối sẵn dây LED (-) → GND cho em.'
				}
			}
		]
	},
	'nut-nhan': {
		id: 'nut-nhan',
		title: 'Nút nhấn bật đèn',
		boardId: 'esp32-devkit-v1',
		defaultCode: arduinoSamples['nut-nhan'],
		components: [
			{ compId: 'led1', moduleId: 'led-dien-tro-220' },
			{ compId: 'btn1', moduleId: 'nut-nhan' }
		],
		steps: [
			{
				title: 'Nối nút nhấn',
				description: 'Một chân vào GPIO4, chân còn lại về GND.',
				connections: [
					{ compId: 'btn1', pinLabel: 'Chân 1', target: 'GPIO4' },
					{ compId: 'btn1', pinLabel: 'Chân 2', target: 'GND' }
				],
				hints: {
					level1: 'Với INPUT_PULLUP, nút nhấn thường kéo xuống GND khi nhấn.',
					level2: 'Nối Chân 1 → GPIO4, Chân 2 → GND.',
					level3: 'Mình đã nối giúp một dây của nút nhấn.'
				}
			}
		]
	},
	'bien-tro': {
		id: 'bien-tro',
		title: 'Biến trở chỉnh độ sáng',
		boardId: 'esp32-devkit-v1',
		defaultCode: arduinoSamples['bien-tro'],
		components: [
			{ compId: 'led1', moduleId: 'led-dien-tro-220' },
			{ compId: 'pot1', moduleId: 'bien-tro-10k' }
		],
		steps: [
			{
				title: 'Cấp nguồn cho biến trở',
				description: 'VCC nối 3V3 và GND nối mass.',
				connections: [
					{ compId: 'pot1', pinLabel: 'VCC', target: '3V3' },
					{ compId: 'pot1', pinLabel: 'GND', target: 'GND' }
				],
				hints: {
					level1: 'Biến trở cần đủ hai mức điện áp để tạo ra tín hiệu giữa.',
					level2: 'Nối VCC → 3V3 và GND → GND.',
					level3: 'Mình đã nối giúp một dây nguồn của biến trở.'
				}
			},
			{
				title: 'Nối chân tín hiệu biến trở',
				description: 'OUT nối vào ADC1 để analogRead hoạt động.',
				connections: [{ compId: 'pot1', pinLabel: 'SIG', target: 'GPIO34' }],
				hints: {
					level1: 'POT_PIN trong code cho em biết chân đọc analog.',
					level2: 'Nối SIG → GPIO34 (ADC1).',
					level3: 'Mình đã nối giúp dây OUT → GPIO34.'
				}
			}
		]
	},
	'tram-thoi-tiet': {
		id: 'tram-thoi-tiet',
		title: 'Trạm thời tiết mini',
		boardId: 'esp32-devkit-v1',
		defaultCode: arduinoSamples['tram-thoi-tiet'],
		components: [
			{ compId: 'dht1', moduleId: 'dht22' },
			{ compId: 'oled1', moduleId: 'oled-ssd1306-i2c' }
		],
		steps: [
			{
				title: 'Nối DHT22',
				description: 'DHT22 cần nguồn và chân DATA.',
				connections: [
					{ compId: 'dht1', pinLabel: 'VCC', target: '3V3', alternatives: ['5V'] },
					{ compId: 'dht1', pinLabel: 'DATA', target: 'GPIO4' },
					{ compId: 'dht1', pinLabel: 'GND', target: 'GND' }
				],
				hints: {
					level1: 'DHT_PIN trong code cho em biết chân DATA.',
					level2: 'Nối VCC → 3V3, DATA → GPIO4, GND → GND.',
					level3: 'Mình đã nối sẵn một dây cho DHT22.'
				}
			}
		]
	}
};

export function getProjectByPreset(preset?: string | null): LabProject | null {
	if (!preset) return null;
	return labProjects[preset] ?? null;
}

export const supportedArduinoCommands = [
	'#define',
	'setup()',
	'loop()',
	'if/for/while',
	'pinMode',
	'digitalWrite',
	'digitalRead',
	'analogRead',
	'analogWrite',
	'delay',
	'millis',
	'map',
	'Serial.print/println',
	'DHT',
	'OLED',
	'WiFi (giả lập)'
];
