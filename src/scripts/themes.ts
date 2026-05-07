export const THEMES = [
	'theme-default',
	'theme-classic',
	'theme-abnt',
	'theme-cnj',
	'theme-oab',
	'theme-contrato',
	'theme-cyberpunk',
	'theme-vintage',
	'theme-pastel',
	'theme-brutalist',
	'theme-festa',
] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
	'theme-default': 'Padrão (Lora/Mont)',
	'theme-classic': 'Clássico (Times)',
	'theme-abnt': 'ABNT (Times 12, 1,5)',
	'theme-cnj': 'CNJ / STF-STJ (Arial 12)',
	'theme-oab': 'OAB Tradicional (numerais)',
	'theme-contrato': 'Contrato (Times 11, cláusulas)',
	'theme-cyberpunk': '🌃 Cyberpunk Noturno',
	'theme-vintage': '📜 Manuscrito Vintage',
	'theme-pastel': '🌸 Pastel Sereno',
	'theme-brutalist': '⬛ Brutalista',
	'theme-festa': '🎉 Petição Festa',
};

export const STORAGE_KEYS = {
	content: 'formatolegal_content',
	theme: 'formatolegal_theme',
} as const;

export const safeLocalStorage = {
	get: (key: string): string | null => {
		try {
			return localStorage.getItem(key);
		} catch (e) {
			console.warn('LocalStorage access failed:', e);
			return null;
		}
	},
	set: (key: string, value: string): void => {
		try {
			localStorage.setItem(key, value);
		} catch (e) {
			console.warn('LocalStorage write failed:', e);
		}
	}
};

export function isTheme(value: string): value is Theme {
	return (THEMES as readonly string[]).includes(value);
}
