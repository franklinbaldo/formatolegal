export const THEMES = [
  'theme-default',
  'theme-classic',
  'theme-modern',
  'theme-minimal',
] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  'theme-default': 'Padrão (Lora/Mont)',
  'theme-classic': 'Clássico (Times)',
  'theme-modern': 'Moderno (Sans)',
  'theme-minimal': 'Minimalista',
};

export const STORAGE_KEYS = {
  content: 'formatolegal_content',
  theme: 'formatolegal_theme',
} as const;

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}
