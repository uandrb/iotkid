import { z } from 'zod';

export const boardPinSchema = z.object({
	nhan: z.string().min(1),
	gpio: z.number().int().nonnegative().nullable(),
	loai: z.enum(['nguon3v3', 'nguon5v', 'gnd', 'dieukhien', 'gpio'])
});

export const boardSchema = z.object({
	id: z.string().min(1),
	ten: z.string().min(1),
	chip: z.string().min(1),
	moTa: z.string().min(1),
	chanTrai: z.array(boardPinSchema).min(1),
	chanPhai: z.array(boardPinSchema).min(1),
	nhomDacBiet: z.object({
		chiDoc: z.array(z.number().int().nonnegative()),
		strapping: z.array(z.number().int().nonnegative()),
		uart: z.array(z.string().min(1)),
		usb: z.array(z.number().int().nonnegative()),
		khongDung: z.array(z.number().int().nonnegative()),
		adc1: z.array(z.number().int().nonnegative()),
		adc2: z.array(z.number().int().nonnegative()),
		i2cMacDinh: z.object({
			sda: z.number().int().nonnegative(),
			scl: z.number().int().nonnegative()
		}),
		ledTrenBoard: z.union([z.number().int().nonnegative(), z.string().min(1)])
	}),
	cachDung: z.array(z.string().min(1)).min(1),
	moduleKetHop: z.array(z.string().min(1))
});

export const modulePinSchema = z.object({
	nhan: z.string().min(1),
	canNoi: z.enum([
		'gnd',
		'3v3',
		'chi3v3',
		'nguon',
		'gpio-ra',
		'gpio-vao',
		'gpio',
		'adc',
		'loa'
	])
});

export const moduleSchema = z.object({
	id: z.string().min(1),
	ten: z.string().min(1),
	icon: z.string().min(1),
	dienAp: z.string().min(1),
	moTa: z.string().min(1),
	chan: z.array(modulePinSchema).min(1),
	cachDung: z.array(z.string().min(1)).min(1),
	loiHayGap: z.array(z.string().min(1)).min(1),
	tuKhoaTimMua: z.string().min(1),
	giaThamKhao: z.string().min(1),
	codeMau: z.string().min(1)
});

export const boardsSchema = z.array(boardSchema).min(1);
export const modulesSchema = z.array(moduleSchema).min(1);

export type Board = z.infer<typeof boardSchema>;
export type BoardPin = z.infer<typeof boardPinSchema>;
export type Module = z.infer<typeof moduleSchema>;
