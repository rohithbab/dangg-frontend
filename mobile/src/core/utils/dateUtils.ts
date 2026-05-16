import {
  isToday as fnsIsToday,
  isYesterday as fnsIsYesterday,
  startOfDay as fnsStartOfDay,
  startOfMonth as fnsStartOfMonth,
  startOfWeek as fnsStartOfWeek,
} from 'date-fns';

/**
 * Pure date helpers — thin wrappers over `date-fns` with project-default
 * options pre-applied (weekStartsOn = Monday, India convention).
 */
export const AppDates = {
  startOfDay: (d: Date): Date => fnsStartOfDay(d),
  startOfWeek: (d: Date): Date => fnsStartOfWeek(d, { weekStartsOn: 1 }),
  startOfMonth: (d: Date): Date => fnsStartOfMonth(d),
  isToday: (d: Date): boolean => fnsIsToday(d),
  isYesterday: (d: Date): boolean => fnsIsYesterday(d),
};
