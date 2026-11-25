/**
 * Gentelella v4 Design System Tokens & Runtime CSS Custom Property Helpers
 * Reference: ColorlibHQ/gentelella v4.2.0
 */

export const gentelellaTokens = {
  sidebar: {
    width: 252,
    collapsedWidth: 64,
  },
  radii: {
    sm: '4px',
    default: '6px',
    lg: '8px',
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '24px',
    6: '32px',
    7: '48px',
    8: '64px',
  },
  typography: {
    baseSize: '0.875rem',
    lineHeight: 1.4286,
  },
} as const;

export function readCssToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export interface ChartThemeTokens {
  primary: string;
  primaryDk: string;
  blue: string;
  green: string;
  yellow: string;
  borderColor: string;
  borderLight: string;
  text: string;
  textMuted: string;
  bgSurface: string;
}

export function getChartThemeTokens(): ChartThemeTokens {
  return {
    primary: readCssToken('--primary', '#1ABB9C'),
    primaryDk: readCssToken('--primary-dk', '#169f85'),
    blue: readCssToken('--blue', '#066fd1'),
    green: readCssToken('--green', '#2fb344'),
    yellow: readCssToken('--yellow', '#f59f00'),
    borderColor: readCssToken('--border-color', '#e6e7eb'),
    borderLight: readCssToken('--border-color-light', '#eff0f3'),
    text: readCssToken('--text', '#1e2633'),
    textMuted: readCssToken('--text-muted', '#7e8896'),
    bgSurface: readCssToken('--bg-surface', '#ffffff'),
  };
}
