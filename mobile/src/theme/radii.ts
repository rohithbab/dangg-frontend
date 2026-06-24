/** Border-radius tokens. `full` is effectively circular for pill buttons / dots. */
export const AppRadii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  /** Neue card corner. */
  card: 22,
  /** Neue CTA / button corner. */
  button: 18,
  full: 999,
} as const;

export type RadiusToken = keyof typeof AppRadii;
