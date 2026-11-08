import boardsJson from '../data/boards.json';
import modulesJson from '../data/modules.json';
import { boardsSchema, modulesSchema, type Board, type Module } from './schema';

export const boards: Board[] = boardsSchema.parse(boardsJson);
export const modulesCatalog: Module[] = modulesSchema.parse(modulesJson);

export const boardMap = new Map(boards.map((item) => [item.id, item]));
export const moduleMap = new Map(modulesCatalog.map((item) => [item.id, item]));
