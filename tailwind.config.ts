import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          dk: 'var(--primary-dk)',
          lt: 'var(--primary-lt)',
          md: 'var(--primary-md)',
          text: 'var(--primary-text)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          hover: 'var(--sidebar-hover)',
          active: 'var(--sidebar-active)',
          text: 'var(--sidebar-text)',
          'text-hover': 'var(--sidebar-text-hover)',
          'text-active': 'var(--sidebar-text-active)',
          border: 'var(--sidebar-border)',
        },
        surface: {
          body: 'var(--body-bg)',
          DEFAULT: 'var(--bg-surface)',
          secondary: 'var(--bg-surface-secondary)',
          border: 'var(--border-color)',
          'border-light': 'var(--border-color-light)',
        },
        ink: {
          DEFAULT: 'var(--text)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
        },
        semantic: {
          blue: 'var(--blue)',
          'blue-lt': 'var(--blue-lt)',
          azure: 'var(--azure)',
          'azure-lt': 'var(--azure-lt)',
          green: 'var(--green)',
          'green-lt': 'var(--green-lt)',
          yellow: 'var(--yellow)',
          'yellow-lt': 'var(--yellow-lt)',
          red: 'var(--red)',
          'red-lt': 'var(--red-lt)',
          purple: 'var(--purple)',
          'purple-lt': 'var(--purple-lt)',
          cyan: 'var(--cyan)',
          'cyan-lt': 'var(--cyan-lt)',
        },
        // Storefront brand blue reserved strictly for Live Customer Preview
        storefront: {
          400: '#38A4F6',
          500: '#0F87E8',
          600: '#026AC7',
        },
      },
      fontFamily: {
        sans: ['var(--font)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius)',
        lg: 'var(--radius-lg)',
        card: 'var(--radius-lg)',
        button: 'var(--radius)',
      },
      boxShadow: {
        subtle: 'var(--shadow)',
        card: 'var(--shadow-card)',
        overlay: 'var(--shadow-overlay)',
      },
      spacing: {
        sidebar: 'var(--sidebar-w)',
        'sidebar-collapsed': 'var(--sidebar-w-collapsed)',
      },
    },
  },
  plugins: [],
};

export default config;
