# Dangg Mobile — Visual Design & UI Style Guide

This document serves as the single source of truth for the color themes, styling tokens, typography, and visual design rules implemented in the **Dangg Mobile** frontend codebase (React Native CLI). 

It details the core design token systems, shared UI component styles, and provides a page-by-page visual style analysis of all screens.

---

## 1. Core Styling Foundations

The theme is organized inside the [src/theme/](file:///Users/jagadeeshwaran/Projects/dangg/dangg-frontend/mobile/src/theme/) directory. All pages consume standard layout tokens rather than hardcoding style properties.

### 1.1 Color Theme (`colors.ts`)
The application is configured to use a **Dark Theme by default**. Although both `lightColors` and `darkColors` objects exist, the colors are proxied dynamically and map to a dark palette centered around deep grays, blacks, and vibrant pink accents.

| Token | Hex Value | Description / Core Use-Cases |
| :--- | :--- | :--- |
| **`primary`** | `#E91E63` | Accent color, female indicator, primary button fill, links |
| **`primaryDark`** | `#B5179E` | Deep violet-pink, headings, coin balance highlights |
| **`primaryLight`** | `#FF6B9D` | Soft pink highlight, borders, gradient endings |
| **`primarySubtle`** | `#3A1321` | Dark rose-black overlay, background of gold coin pills/badges |
| **`background`** | `#1C1C1C` | Deep neutral background for all screens and safe areas |
| **`surface`** | `#242424` | Primary card background, dialog boxes, elevated sheets |
| **`surfaceVariant`** | `#2E2E2E` | Secondary/inner surfaces, loading skeletons, progress tracks |
| **`onPrimary`** | `#FFFFFF` | Text/icons inside primary buttons and badges |
| **`onSurface`** | `#FFFFFF` | General title and body text on surface cards and pages |
| **`onSurfaceMuted`**| `#A0A0A8` | Subtitles, footnotes, placeholder text, description summaries |
| **`onSurfaceDisabled`**| `#4A4A55` | Disabled action labels, deactivated fields |
| **`border`** | `#3A3A3A` | Card outline borders, input outline fields |
| **`divider`** | `#3A3A3A` | Hairline dividers between list items |
| **`onlineGreen`** | `#10B981` / `#34D399` | User online status indicator dot, success states |
| **`availableYellow`**| `#EAB308` | User available/busy status dot |
| **`offlineGray`** | `#4A4A55` | User offline status dot |
| **`coinGold`** | `#F59E0B` | Gold coin packages, coin icon vector fill |
| **`coinGoldLight`** | `#FDE047` | Soft glow on coin packages |
| **`coinGoldDark`** | `#D97706` | Deep shadow contours on coin packages |
| **`splashBackground`**| `#FF66C4` | Vibrant pink background used exclusively on the Splash screen |
| **`scrim`** | `rgba(0,0,0,0.7)` | Translucent backdrop overlay for modals and sheets |

#### Theme Scheme Selection Logic
The system enforces the dark scheme via a proxy:
```typescript
let themeScheme: 'light' | 'dark' = 'dark';
export const AppColors = new Proxy(lightColors, {
  get(_target, prop) {
    const key = prop as keyof typeof lightColors;
    if (themeScheme === 'dark') {
      return darkColors[key] ?? lightColors[key];
    }
    return lightColors[key];
  },
}) as typeof lightColors;
```

---

### 1.2 Typography System (`typography.ts`)
Typography utilizes three primary font families mapping to deterministic line heights and letter spacing.

*   **Headings Font:** `Poppins` (Bold & Semibold headings)
*   **Body Font:** `Plus Jakarta Sans` (Standard readability and paragraphs)
*   **UI Font:** `Nunito` (Captions, badges, and interface widgets)

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing | Target Mappings |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`displayLarge`** | `Poppins` | 34 | 700 | 40 | -0.5 | Hero headings, large numbers (coin balance) |
| **`headlineLarge`** | `Poppins` | 34 | 700 | 40 | -0.5 | Large titles (e.g. Genie Profile overlay) |
| **`headlineMedium`**| `Poppins` | 24 | 600 | 30 | Standard | Page Headers (e.g. "Create Account", "Hi, [Name]") |
| **`titleLarge`** | `Poppins` | 18 | 600 | 24 | Standard | Modal titles, card section titles |
| **`titleMedium`** | `Poppins` | 16 | 500 | 22 | Standard | Small headers, sub-menus, card descriptions |
| **`bodyLarge`** | `Plus Jakarta Sans`| 16 | 400 | 24 | Standard | General user bio text, list details |
| **`bodyMedium`** | `Nunito` | 14 | 400 | 20 | Standard | Sub-headlines, input helpers, toast text |
| **`bodySmall`** | `Nunito` | 12 | 400 | 16 | Standard | Timestamps, muted info lines (e.g. "2h ago") |
| **`labelLarge`** | `Nunito` | 14 | 600 | 18 | 0.1 | Primary button text, coin pill values |
| **`labelSmall`** | `Nunito` | 12 | 500 | 16 | 0.3 | Category badges, filter counters |

---

### 1.3 Layout System (`radii.ts`, `spacing.ts`, `shadows.ts`)

#### Spacing Tokens
Standard layout spacing offsets for margins, padding, and gaps:
*   `xs`: **4px** (Fine gaps, details)
*   `sm`: **8px** (Sub-headers, list rows spacing)
*   `md`: **16px** (Standard screen margins, card inner padding)
*   `lg`: **24px** (Major blocks padding, layout splits)
*   `xl`: **32px** (Hero elements vertical separation)
*   `xxl`: **48px** (Spacers, full-height margins)

#### Border Radii Tokens
*   `sm`: **8px** (Input fields, small tags)
*   `md`: **12px** (Medium cards, buttons)
*   `lg`: **16px** (Main feature cards, transaction rows)
*   `xl`: **24px** (Modal containers, large action boxes)
*   `full`: **999px** (Circular avatar rings, pills, toggles)

#### Elevation / Shadow Tokens
Shadow configurations bundle iOS shadow parameters and Android elevation so that a single token spread works cross-platform:

*   **`e0`**: No shadow (flat elements).
*   **`e1` (Light Lift)**: `shadowColor: '#000'`, `shadowOffset: {0, 4}`, `shadowOpacity: 0.03`, `shadowRadius: 12`, `elevation: 2`. Used for discovery grids, cards, and list tiles.
*   **`e2` (Medium Lift)**: `shadowColor: '#000'`, `shadowOffset: {0, 8}`, `shadowOpacity: 0.05`, `shadowRadius: 24`, `elevation: 4`. Used for bottom sheets, popovers, and filters.
*   **`e3` (High Lift)**: `shadowColor: '#000'`, `shadowOffset: {0, 16}`, `shadowOpacity: 0.08`, `shadowRadius: 32`, `elevation: 8`. Used for dialog boxes, full-screen loaders, and notification popups.

---

## 2. Core Shared UI Components

These components are reused app-wide and serve as styling blocks for the screens:

1.  **`PrimaryButton.tsx`**: Filled background mapping to `AppColors.primary` (pink), `AppColors.error` (red, destructive), or `AppColors.success` (green). Height is 52px, border-radius is `AppRadii.md` (12px), text uses `AppTypography.labelLarge` (white). Features a pressed opacity of `0.85`, disabled state opacity of `0.55`, and houses an `ActivityIndicator` (white spinner) when loading.
2.  **`SecondaryButton.tsx`**: Outlined button variation. Features a border width of 1.5px using `AppColors.border`, background of `AppColors.surface` (`#242424`), and typography colored in `AppColors.primary`.
3.  **`Card.tsx`**: Solid visual wrapper. Built with a default background of `AppColors.surface` (`#242424`), border-radius of `AppRadii.lg` (16px), and default elevation `AppShadows.e1`. Tappable cards drop to `0.85` opacity when pressed.
4.  **`Avatar.tsx`**: Circular cached image utilizing `FastImage`. Fits a fallback initials overlay using `AppTypography.titleMedium` inside a solid color block when the image is missing or loading.
5.  **`TextField.tsx`**: Underlined/bordered form input with customizable left icon placeholders (like country code badges). Uses standard `AppColors.border` (`#3A3A3A`), error states highlight borders and helpers in `AppColors.error` (`#EF4444`).
6.  **`OtpInput.tsx`**: Renders 6 distinct bordered square boxes with character advance logic. Focused box triggers active `AppColors.primary` outlines.
7.  **`AppBar.tsx`**: Layout header containing title (`AppTypography.headlineMedium`), custom back triggers, and accessory columns in `AppColors.primaryDark` (pink-violet).

---

## 3. Screen-by-Screen Styling Analysis

### 3.1 Splash & Onboarding

#### Splash Screen (`SplashScreen.tsx`)
*   **Background:** Solid vibrant `AppColors.splashBackground` (`#FF66C4`).
*   **Layout:** Centered aspect-ratio canvas. Displays a custom white SVG vector rendering of the brand wordmark **"D a n g g"** split into 5 individual absolute-positioned vector assets (`D`, paper plane `a`, `n`, `g1`, `g2`).
*   **Typography:** The tagline word bubbles at the bottom ("TALK WITH LOVE") use bold white text (`#FFFFFF`) using font-weight `800` staggered into letter-by-letter Reanimated animations.
*   **Animations:** SVG letter entries scale and overshoot dynamically using spring/timing functions. The paper plane wing curves diagonally in from the bottom-right on a custom quadratic Bezier path:
    $$B(p) = (1-p)^2 \cdot P_0 + 2(1-p)p \cdot P_1 + p^2 \cdot P_2$$
    where $P_0$ is $(300, 200)$, $P_1$ is $(0, 200)$, and $P_2$ is $(0, 0)$.

#### Account Type Selection (`AccountTypeScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Header:** Centered vector `DanggLogo` (140px width).
*   **Main Container:** Scrolling box padded with `AppSpacing.lg` (24px) that contains stacked selection cards.
*   **Cards (`AccountTypeCard.tsx`):**
    *   Row container with a height of 110px, background in `AppColors.surface` (`#242424`), border radius `AppRadii.lg` (16px), and outlines in `AppColors.gradientRoseSubtleStart` (`#1F0E16`).
    *   Features a glowing shadow in `AppColors.primary` (opacity: 0.18, radius: 20px, elevation: 4).
    *   **Female Icon:** Venus symbol (♀) centered inside a pink-gradient circular vector (`#FF66C4` to `#E91E63`).
    *   **Male Icon:** Mars symbol (♂) centered inside a violet-pink gradient circular vector (`#B5179E` to `#E91E63`).
    *   Chevrons use `AppColors.primary` (female) or `AppColors.primaryDark` (male).
*   **Footer:** Centered, containing standard text links with action highlights colored in `AppColors.primary`.

---

### 3.2 Authorization & Verification Flows

#### Signup Basic Info Screen (`FemaleSignupBasicInfoScreen.tsx` / `MaleSignupBasicInfoScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Component Structure:** Renders the shared `BasicInfoForm.tsx`.
*   **Card Container:** Form fields are grouped inside a curved block with a border radius of 24px and border width of 1px.
    *   **Female Styling:** Border matches `AppColors.gradientRoseSubtleStart` (`#1F0E16`), shadow glow maps to `AppColors.primary` (pink, opacity: 0.16).
    *   **Male Styling:** Border uses a slightly softer gray-rose outline (`#EAD5DA`), shadow glow maps to `AppColors.primaryDark` (violet-pink, opacity: 0.14).
*   **Inputs:** Multi-field inputs with a fixed gender preview badge:
    *   **Female:** Disabled gender card background is `AppColors.primarySubtle` (`#3A1321`), border uses `AppColors.border`, text uses `AppColors.primary` (`#E91E63`).
    *   **Male:** Disabled gender card background uses a soft pink-red surface tint (`#F9EBEE`), border is `#EAD5DA`, text is `AppColors.primaryDark` (`#B5179E`).
*   **Typography:** Form headers use `AppTypography.titleLarge` (`#FFFFFF`). Password meter values display custom semantic progress bars (Red → Orange → Green).
*   **Primary CTA:** Full-width "Generate OTP" `PrimaryButton` anchored at the card bottom.

#### OTP Verification Screen (`OtpVerificationScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered card wrapper. Displays the phone number confirmation followed by 6 character inputs.
*   **Typography:** The title uses `AppTypography.titleLarge`, and description lines use `AppTypography.bodyMedium` with colored phone markers.
*   **CTAs:** A prominent "Verify & Continue" button is supplemented by a resend timer link that transitions to active `AppColors.primary` once the 30-second cooldown expires.

#### Bank/UPI Payout Details Screen (`BankUpiDetailsScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Full-screen form. The header includes a navigation back trigger and a "Skip" action link in `AppColors.primary` at the top-right.
*   **Segment Selection:** Uses a customized toggle block split between [Bank Account] and [UPI]. The active segment utilizes `AppColors.primary` background with white text, while the inactive segment uses `AppColors.surfaceVariant` with gray labels.
*   **Inputs:** Bordered input grid (`Account Holder Name`, `Account Number`, `IFSC Code` or `UPI ID`) utilizing standard form validators.

#### Verification Info Screen (`VerificationInfoScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Center Illustration:** Camera frame illustration with highlighted good lighting vectors using `AppColors.primarySubtle`.
*   **Checklist:** A vertical list of points ("Good lighting", "No sunglasses") styled with green checkmark vectors (`AppColors.success`).
*   **CTA:** Full-width primary button labeled "Open Camera".

#### Face Capture Camera Screen (`FaceCaptureScreen.tsx`)
*   **Background:** Black (`#000000`).
*   **Layout:** Full-viewport viewfinder preview.
*   **Camera Guides:** Overlay template containing a centered semi-transparent oval frame mask (`rgba(0,0,0,0.6)` overlaying the camera viewport) to help align the user's face.
*   **Bottom Actions:** Features a large white circular shutter button. The post-capture preview screen presents side-by-side action buttons: "Retake" (secondary button) and "Submit" (primary button).

#### Verification Submitted Screen (`VerificationSubmittedScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered layout.
*   **Illustration:** Centered checkmark shield vector colored in green (`AppColors.success`) and surrounded by circular pulse rings.
*   **Typography:** Headline in `AppTypography.displayLarge`, body explanation in `AppTypography.bodyMedium` (`AppColors.onSurfaceMuted`).
*   **CTA:** Full-width "Got it" button at the bottom.

#### Login Screens (`FemaleLoginScreen.tsx` / `MaleLoginScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered card forms. Returning female accounts display their profile avatar preview inside a circular frame with a subtle pink ring.
*   **Input Fields:** Bordered fields for Phone, Password, and confirmation toggles. Includes a right-aligned "Forgot Password?" text button.
*   **CTA:** Centered "Login" button utilizing `PrimaryButton`.

#### Forgot Password Flow (`ForgotPasswordPhoneScreen.tsx` / `ForgotPasswordNewScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Standardized forms mapping fields (`Mobile Number`, `New Password`, `Confirm Password`) to inputs, styled with validation borders.

---

### 3.3 Female Home & Payouts

#### Female Home Screen (`FemaleHomeScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Header:** Standard greeting line ("Hi, [Name]!") in `AppTypography.headlineMedium` and `AppColors.primaryDark`. Includes a chat bubble icon (`ChatsHeaderIcon`) pointing to the chat inbox.
*   **Verification Banner:** Displayed only for unverified/pending profiles. Uses a light pink card background (`#FDECEF`) with a border width of 1.5px in `AppColors.error` (`#EF4444`). The text displays status summaries.
*   **Availability Toggle Card:**
    *   Card container with a border width of 1.5px in `AppColors.border`.
    *   **Online State:** Highlights the status dot in `AppColors.onlineGreen` (`#10B981`) and displays "You are online and visible".
    *   **Offline State:** Toggles the status dot to `AppColors.offlineGray` (`#4A4A55`) and displays "You are offline".
*   **Stats Grid (2x2):**
    *   Four cells representing: `Today's Earnings`, `This Week`, `Chats Today`, and `Rating`.
    *   Each cell is styled with a border width of 1.5px in `AppColors.border`, card background in `AppColors.surface` (`#242424`), and values in `AppTypography.headlineMedium` and `AppColors.primaryDark` (pink-violet).
*   **Recent Activity Feed:** List of the 3 most recent chat rows separated by hairline borders in `AppColors.divider`.
*   **Shake Toast Component (`ShakeToast`):** Custom banner popup that appears at the top. Features a background of `AppColors.primaryDark` and border-radius of `AppRadii.md` (12px), styled with shadow properties (`elevation: 6`). It triggers a Reanimated horizontal shake animation when mounted.

#### Female Earnings Dashboard (`EarningsDashboardScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Scrollable layout with a padding of `AppSpacing.md` (16px).
*   **Earnings Card:** Displays the user's available balance in `AppTypography.displayLarge` and `AppColors.primaryDark` (pink-violet).
*   **Payout Banner Statuses:**
    *   **Pending:** Yellow banner overlay (`#FEF3C7`) with a clock icon.
    *   **Completed:** Green banner overlay (`#D1FAE5`) with a checkmark vector.
    *   **Rejected:** Red banner overlay (`#FEE2E2`) with an error indicator.
*   **Payout Account Block:** Masked details inside a card showing the bank outline (e.g. `•••• 3421`) or UPI details (e.g. `user@upi`) with a right-aligned "Update" link.
*   **History Segment:** Displays a chronological list of earnings, styled with vertical dividers and coin indicator tags.

#### Bank/UPI Details Update Screen (`BankUpiUpdateScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Full-page scrollable form. The header displays current banking entries, and the bottom contains editable fields with a "Save Changes" action button.

#### Payout Request & Review Screens (`PayoutRequestScreen.tsx` / `PayoutInReviewScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered card forms with detailed feedback columns. Includes action buttons that trigger confirmation dialogs before requests are submitted.

---

### 3.4 Male Home & Discovery

#### Male Home Screen (`MaleHomeScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Header:** Displays a greeting, the user's current coin balance pill, and a chat inbox trigger icon.
    *   **Coin Pill:** Capsule container with a height of 32px, background in `AppColors.primarySubtle` (`#3A1321`), and border-radius `AppRadii.full`. Text displays the coin amount in bold `AppColors.primaryDark` (violet-pink).
*   **Favorites Carousel:** Horizontal scrolling list of cards.
    *   **`FavoriteItem`:** Features a circular frame avatar ring (3px border width in `AppColors.primary`), name tag at the bottom, and a status dot in `AppColors.onlineGreen` positioned at the bottom-right of the avatar ring.
*   **Filter Bar:** Input search bar with a circular filter button wrapper in `AppColors.surface` and `AppColors.border`. Includes a badge overlay in `AppColors.primary` that displays the active filter count.
*   **Discovery Grid:** Two-column grid (`numColumns={2}`) utilizing Shopify `FlashList`.
    *   **`AvailableFemaleCard.tsx`:** Elevated card (`AppShadows.e1`) with a background of `AppColors.surface`. Displays the user's thumbnail, name, rating badge, and a chat icon button.
*   **Genie Transition Modal (Animated Detailed Preview):**
    *   A custom full-screen modal overlay that animates when a user selects a profile.
    *   The overlay starts as a circular avatar bubble matches the position of the selected favorite item. It expands to cover the viewport:
        *   `left`: interpolates from $x$ to $0$.
        *   `top`: interpolates from $y$ to $0$.
        *   `width`: interpolates from $diameter$ to $SCREEN\_WIDTH$.
        *   `height`: interpolates from $diameter$ to $SCREEN\_HEIGHT$.
        *   `borderRadius`: interpolates from $diameter / 2$ to $0$.
    *   **Hero Image Section:** Occupies 60% of the screen height, overlayed at the bottom with a dark SVG gradient using `AppColors.scrim` (`rgba(0,0,0,0.7)`).
    *   **Floating Navigation Buttons:** A row containing a Back arrow button and a favorite Heart button. Uses an `AppColors.surface` background with `0.92` opacity, positioned outside the clipping overlay.
    *   **Pricing Pill:** Displays the chat cost in a pill with a background of `AppColors.primarySubtle` and text in `AppColors.primaryDark`.
    *   **Stats Card:** Contains columns for `Chats`, `Rating`, and `Response` times. Styled with a background of `AppColors.surface` and divider borders in `AppColors.divider`.
    *   **Action Bar:** Anchored at the bottom with a primary button that displays `Send Chat Request — [Price] coins`.

#### Female Profile Preview Screen (`FemaleProfilePreviewScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Full-viewport detailed page. Displays a large profile image card, a details column (Age, Chats count, Favourites count), a bio description block, and a sticky bottom action row (favorite Heart button next to a primary "Send Chat Request" button).

---

### 3.5 Wallet & Payments

#### Wallet Screen (`WalletScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Header Segment:** Standard page title. Includes a sliding segment control (`SliderTabs`) that toggles the page between the **Wallet** and **Transaction** views.
*   **Wallet View:**
    *   **Current Balance Hero Card:** Custom rectangular container. Displays the balance in large text (`AppTypography.displayLarge`) with a golden coin icon next to it.
        *   **Background Gradient:** Uses an SVG `LinearGradient` background transitioning from `AppColors.primaryDark` (`#B5179E`) to `AppColors.primaryLight` (`#FF6B9D`).
        *   **Decorative Elements:** Houses two semi-transparent white circles (opacities: `0.12` and `0.06`) to add visual depth.
    *   **Quick Summary Row:** Displays three small cards (Purchased, Chats, Spent) styled with a background of `AppColors.surface` and text in `AppColors.primaryDark`.
    *   **Package Grid:** Displays 6 coin packages in a 2x3 grid using `CoinPackageCard` components.
        *   **`CoinPackageCard`:** Elevated card (`AppShadows.e1`) with a background of `AppColors.surface`. Outlined packages highlight borders and prices in gold (`AppColors.coinGold` / `#F59E0B`). Includes tag overlays like "Popular" in `AppColors.primary`.
    *   **Recent Activity:** Teaser list showing the most recent transactions inside a card, separated by line dividers.
    *   **Sticky Buy Button:** Anchored at the bottom, displayed only when a package is selected.
*   **Transaction View:**
    *   **Analytics Overview Card:** Card with a background of `AppColors.surface`. Displays metrics for Purchased, Spent, and Refunded. Includes a proportional segmented progress bar (success green segment, primary pink segment, and info blue segment).
    *   **Search Input Field:** Bordered input field with a search icon and an active "Sort" toggle button in `AppColors.primary`.
    *   **Transaction Rows:** Listed chronologically. Uses status icon graphics (success checks, refund icons, chat bubble badges).

#### Payment Processing Screen (`PaymentProcessingScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered layout containing a loading indicator (`ActivityIndicator` in `AppColors.primary`) and helper text ("Processing payment...", "Don't close the app").

#### Payment Success Screen (`PaymentSuccessScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered layout.
*   **Illustration:** Centered checkmark circular vector in green (`AppColors.success`).
*   **Typography:** Title in `AppTypography.displayLarge`, added balance in bold text, transaction ID in `AppTypography.bodySmall`.
*   **CTA:** Large action button labeled "Continue" that routes back to the Wallet view.

#### Payment Failed Screen (`PaymentFailedScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Illustration:** Centered error cross icon in red (`AppColors.error`).
*   **Layout:** Renders failure details and provides "Try Again" (primary) and "Cancel" (secondary) action buttons.

---

### 3.6 Chat Request Status Flows

#### Chat Request Sent Screen (`ChatRequestSentScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Header:** Displays a top-left close icon button with a background of `AppColors.primarySubtle` (`#3A1321`) and icon fill in `AppColors.primaryDark` (`#B5179E`).
*   **Radar Animation (`RadarStage`):**
    *   Displays 5 static concentric rings with decreasing opacities (`0.22`, `0.15`, `0.1`, `0.06`, `0.04`) in `AppColors.primary`.
    *   Includes three Reanimated pulse rings that expand and fade out:
        *   `scale`: animates from $1.0$ to $1.55$.
        *   `opacity`: fades from $0.55$ to $0.0$.
    *   **Orbit Avatars:** Four small floating avatar bubbles placed around the center avatar. Features a Reanimated floating vertical translation of -6px to 0px.
    *   **Center Avatar:** Centered avatar bubble with a shadow glow in `AppColors.primary` (radius: 18px, elevation: 10).
*   **Countdown Card:** Card container with a border width of 1.5px in `AppColors.primaryLight` (`#FF6B9D`). Displays a timer in large bold text (`AppTypography.displayLarge`).
*   **Status Track:** Horizontal step tracker.
    *   **Request Sent Step:** Green checkmark badge with a background of `AppColors.successLight` (`#062E21`).
    *   **Waiting Step:** Pulsing gray badge using `AppColors.surfaceVariant` (`#2E2E2E`).
*   **Footer Button:** Elevated card button labeled "Cancel Request".

#### Outcome Screens (`ChatRequestAcceptedScreen.tsx`, `ChatRequestDeclinedScreen.tsx`, `ChatRequestTimeoutScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered layouts containing status illustrations, headers, and action buttons.

#### Chats Inbox Screen (`ChatsInboxScreen.tsx` / `FemaleChatSessionScreen.tsx` / `ChatSessionScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Scrolling message list and thread containers, styled with message preview rows and indicators.

#### Like / Dislike Rating Screen (`LikeDislikeRatingScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered rating card. Displays the provider's avatar profile picture, followed by two large action buttons:
    *   **Like Option:** Thumbs-up icon styled with a green highlight.
    *   **Dislike Option:** Thumbs-down icon styled with a red highlight.
*   **Comment Input:** Textarea field with a border in `AppColors.border`.
*   **CTA:** Centered "Submit" button, disabled until a selection is made.

---

### 3.7 Profile & Account Management

#### Profile Screens (`FemaleProfileScreen.tsx` / `MaleProfileScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Scrollable profile screen.
*   **Avatar Header:** Large circular profile photo centered on the page. Includes a camera icon overlay button at the bottom-right of the avatar ring to update the photo.
*   **Menu Options:** Vertical list of buttons. Each button row displays a leading icon, menu title, and a trailing chevron in `AppColors.primary`.
    *   Destructive options (`Logout`, `Delete Account`) highlight their titles in red (`AppColors.error`).

#### Edit Profile Bottom Sheet (`EditProfilePicSheet.tsx`)
*   **Background:** Card sheet using `AppColors.surface` (`#242424`) with a top handle bar, displayed over a dimmed background backdrop.
*   **Options:** Vertical list of actions: `Take Photo`, `Choose from Gallery`, and `Remove Photo` (red).

#### Settings Screen (`SettingsScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Standard menu list grouping preferences (`Account`, `Notifications`, `Privacy`) into sections separated by dividers, with switch triggers for alerts and notifications.

#### Help & Support Screen (`HelpSupportScreen.tsx` / `ReportIssueScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Collapsible FAQ accordion. Tapping a question expands a drawer showing the answer in `AppColors.onSurfaceMuted`.
*   **Form Inputs:** Multi-line textareas, dropdowns, and category selectors with file attachment buttons.

#### About Screen (`AboutAppScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered app brand logo, followed by app metadata versions and horizontal rows linking to legal pages.

#### Delete Account Flow Screens (`DeleteAccountWarningScreen.tsx` / `DeleteAccountConfirmScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Centered warning layouts.
*   **Illustration:** Warning icon colored in red (`AppColors.error`).
*   **Confirmation Input:** Bordered text field requiring the user to type "DELETE" to confirm, with a prominent red destructive confirmation button.

---

### 3.8 Common Overlay & Utility Screens

#### Account Suspended Screen (`AccountSuspendedScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Center Icon:** Red circular shield icon with a background opacity of `0.18`.
*   **Typography:** Headline in `AppTypography.headlineMedium`, description text in `AppTypography.bodyMedium` and `AppColors.onSurfaceMuted`.
*   **CTA:** Standard "Contact support" button.

#### Generic Error Screen (`GenericErrorScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Displays an error illustration, details, and provides "Retry" and "Go Home" buttons.

#### Maintenance Screen (`MaintenanceScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Displays an illustrations screen with return estimates and a "Try Again" button.

#### Notification Permission Primer (`NotificationPermissionPrimerScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Displays a notification bell icon with details, next to "Enable Notifications" (primary button) and "Maybe Later" (secondary button).

#### Update Required Screen (`UpdateRequiredScreen.tsx`)
*   **Background:** Deep dark `AppColors.background` (`#1C1C1C`).
*   **Layout:** Lock screen layout containing updates description info and a single "Update Now" button.
