import { de } from './de.js';
import { en } from './en.js';
import { es } from './es.js';
import { zh } from './zh.js';
import { ja } from './ja.js';
import { ru } from './ru.js';
import { fr } from './fr.js';
import { hi } from './hi.js';
import { ar } from './ar.js';
import { bn } from './bn.js';
import { pt } from './pt.js';
import type { Translations } from './types.js';

export const LANGUAGE_CODES = ['de', 'en', 'es', 'zh', 'ja', 'ru', 'fr', 'hi', 'ar', 'bn', 'pt'] as const;
type Lang = typeof LANGUAGE_CODES[number];
const SUPPORTED: Lang[] = [...LANGUAGE_CODES];
const langs: Record<Lang, Translations> = { de, en, es, zh, ja, ru, fr, hi, ar, bn, pt };
let current: Lang = (SUPPORTED.includes(process.env.CC_LANGUAGE as Lang)
  ? process.env.CC_LANGUAGE as Lang : 'de');

export function t(): Translations { return langs[current]; }
export function setLanguage(lang: Lang) { current = lang; }
export function getLanguage(): Lang { return current; }
export function getSupportedLanguages(): Lang[] { return [...SUPPORTED]; }
export type { Lang, Translations };
