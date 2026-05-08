// Eagerly side-effect-load every stylesheet in styles/themes/ so dropping
// a new `<id>.css` there is enough to ship its styles. The THEMES array
// below is independent: it controls what appears in the picker UI.
void import.meta.glob('../styles/themes/*.css', { eager: true });

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
	'theme-default': 'Padrão Jurídico',
	'theme-classic': 'Clássico Editorial',
	'theme-abnt': 'ABNT (Times 12, 1.5)',
	'theme-cnj': 'CNJ / STF-STJ (Arial 12)',
	'theme-oab': 'OAB Tradicional',
	'theme-contrato': 'Contrato',
	'theme-cyberpunk': '🌃 Cyberpunk Noturno',
	'theme-vintage': '📜 Manuscrito Vintage',
	'theme-pastel': '🌸 Pastel Sereno',
	'theme-brutalist': '⬛ Brutalista',
	'theme-festa': '🎉 Petição Festa',
};

export const THEME_GROUPS: { label: string; themes: Theme[] }[] = [
	{
		label: '⚖️ Protocolo seguro',
		themes: ['theme-default', 'theme-abnt', 'theme-cnj', 'theme-oab', 'theme-contrato'],
	},
	{
		label: '✍️ Petição com alma',
		themes: ['theme-classic', 'theme-vintage', 'theme-pastel'],
	},
	{
		label: '🚨 Tipografia absolutamente ilegal',
		themes: ['theme-cyberpunk', 'theme-brutalist', 'theme-festa'],
	},
];

export const STORAGE_KEYS = {
	content: 'formatolegal_content',
	theme: 'formatolegal_theme',
} as const;

export function isTheme(value: string): value is Theme {
	return (THEMES as readonly string[]).includes(value);
}
