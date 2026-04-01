// Design token constants — mirrors CSS custom properties in index.css
export const theme = {
  colors: {
    bg: 'var(--bg)',
    bgSurface: 'var(--bg-surface)',
    bgCard: 'var(--bg-card)',
    bgCardHover: 'var(--bg-card-hover)',
    border: 'var(--border)',
    borderAccent: 'var(--border-accent)',

    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',

    red: '#ff3b3b',
    redSoft: 'rgba(255,59,59,0.15)',
    indigo: '#6366f1',
    indigoSoft: 'rgba(99,102,241,0.15)',
    emerald: '#10b981',
    emeraldSoft: 'rgba(16,185,129,0.15)',
    amber: '#f59e0b',
    amberSoft: 'rgba(245,158,11,0.15)',
    violet: '#8b5cf6',
    violetSoft: 'rgba(139,92,246,0.15)',
    cyan: '#06b6d4',
    cyanSoft: 'rgba(6,182,212,0.15)',
    pink: '#ec4899',
    pinkSoft: 'rgba(236,72,153,0.15)',
    orange: '#f97316',
    orangeSoft: 'rgba(249,115,22,0.15)',

    chartPalette: [
      '#6366f1', '#10b981', '#f59e0b', '#ec4899',
      '#06b6d4', '#8b5cf6', '#f97316', '#84cc16',
    ],
  },

  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
  },

  shadow: {
    card: 'var(--shadow-card)',
    glow: (color: string) => `0 0 20px ${color}33`,
  },

  glass: {
    background: 'var(--card-glass-bg)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
  },
} as const;
