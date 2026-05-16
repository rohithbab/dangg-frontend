// Re-export of the navigation-tree PlaceholderScreen. Lives here so
// `features/common/` owns every cross-cutting screen — including the
// "coming soon" stand-in — even though the navigator imports it directly
// from `@navigation/PlaceholderScreen`.
export { default } from '@navigation/PlaceholderScreen';
