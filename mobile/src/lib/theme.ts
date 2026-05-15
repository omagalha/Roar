export const colors = {
  red: '#E8002D',
  gold: '#FFD700',
  green: '#00C853',
  blue: '#2979FF',
  purple: '#AA00FF',
  cyan: '#00B8D9',
  dark: '#06060f',
  card: '#0d0d1a',
  border: '#1a1a2e',
  muted: '#55557a',
  subtle: '#6E6A8A',
  text: '#e0e0f0',
  white: '#ffffff',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const

export const font = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 28,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
} as const
