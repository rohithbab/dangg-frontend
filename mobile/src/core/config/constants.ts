/** App-wide constants — non-secret values used across features. */
export const APP_NAME = 'Dangg';

/** User-Agent suffix added to outgoing requests where customisable. */
export const USER_AGENT = 'Dangg-Mobile/1.0';

// --- Networking ----------------------------------------------------------
export const HTTP_CONNECT_TIMEOUT_MS = 15_000;
export const HTTP_RECEIVE_TIMEOUT_MS = 20_000;

// --- Pagination ----------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// --- Retry policy --------------------------------------------------------
export const RETRY_MAX_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 500;

// --- Search / debounce --------------------------------------------------
export const SEARCH_DEBOUNCE_MS = 350;

// --- Image cache --------------------------------------------------------
export const IMAGE_CACHE_MAX_BYTES = 100 * 1024 * 1024;

// --- OTP ----------------------------------------------------------------
export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN_S = 30;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_LOCKOUT_S = 60;

// --- Misc ---------------------------------------------------------------
export const SUPPORT_EMAIL = 'support@dangg.app';
export const PRIVACY_POLICY_URL = 'https://dangg.app/privacy';
export const TERMS_URL = 'https://dangg.app/terms';

/** Deep-link URL prefix used by React Navigation linking config. */
export const DEEP_LINK_PREFIX = 'dangg://';
