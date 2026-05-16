/** Border-radius tokens. `full` is effectively circular for pill buttons / dots. */
export const AppRadii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export type RadiusToken = keyof typeof AppRadii;
