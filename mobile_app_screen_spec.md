# Mobile App — Complete Screen Specification

## Document Purpose
Source of truth for every screen in the mobile application. Use as input to the magic prompter project to generate individual Stitch prompts (one per screen).

## App Overview
- **Type:** Text-based paid chat marketplace (no audio/video calls in v1)
- **Platform:** Mobile (iOS + Android), Flutter
- **User types:** **Female** (service provider / earner) and **Male** (buyer / coin holder)
- **Core mechanic:** Male buys coins → spends coins to chat with online females → females earn → request payouts
- **Phase 1 scope (this document):** Onboarding, sign-up/login, account management, browsing, chat-request initiation and notifications, like/dislike rating, payment flows, all supporting screens
- **Phase 2 scope (not detailed here):** Active chat experience (text/image/video messaging), queue management, in-chat controls — listed at the end for context only

## Visual Design Guidance (apply to all Stitch prompts)
- Mobile-first, modern, clean. Light theme by default.
- Card-based layouts with rounded corners (12–16px) and soft elevation/shadows.
- **Female-side accents:** soft pink / coral (#F8D7DA / #E91E63 family).
- **Male-side accents:** soft blue / teal (#A5D8FF / #1E6FCF family).
- Common neutrals: warm grays, off-white backgrounds (#FAFAFA, #F5F5F5).
- Typography: clean sans-serif (Inter / SF Pro / Roboto). Body 14–16px, headings 18–24px, large display 28–32px.
- Iconography: consistent outlined or filled style (Phosphor, Material Symbols, or Heroicons).
- Aspect ratio for Stitch: 9:19.5 (modern phones) or 9:16.

---

# SECTION 0 — APP-WIDE COMMON SCREENS

## 0.1 Splash Screen
**Type:** Full-screen, first launch and every re-launch
**Purpose:** Boot screen while session/auth is checked
**Layout:**
- Centered app logo (large)
- App name below logo
- Optional one-line tagline
- Subtle loading indicator at bottom (optional)
**Routing logic (after checks):**
- First-time user → Account Type Selection
- Returning logged-out user → Login
- Returning logged-in user → Home (Male or Female)

## 0.2 Account Type Selection
**Type:** Full-screen, shown only on first launch
**Purpose:** Choose role before sign-up
**Layout:**
- App logo top center
- Headline: "How will you use the app?"
- Two large tappable cards stacked or side-by-side:
  - **Card 1:** Female icon + "I'm a Female" + sub "Chat with users and earn"
  - **Card 2:** Male icon + "I'm a Male" + sub "Browse and chat"
- Bottom: "Already have an account? **Login**" link
**Behavior:** Tap card → routes to corresponding sign-up flow

## 0.3 Camera Permission Request
**Type:** Native OS dialog (preceded by in-app explainer if needed)
**Triggered before:** Face verification capture, profile picture capture
**Components:** Camera icon + 1-line explanation + "Allow" / "Not Now"

## 0.4 Storage / Gallery Permission Request
**Type:** Native OS dialog
**Triggered before:** Choosing profile picture from gallery (male side)

## 0.5 Notification Permission Request
**Type:** Native OS dialog + in-app primer screen (recommended)
**Primer screen:**
- Icon + "Stay in the loop"
- Body: "Get notified about chat requests, payment confirmations, and payout updates"
- "Enable Notifications" primary + "Maybe Later" secondary

## 0.6 No Internet / Offline Screen
**Type:** Full-screen overlay (auto-shown on connection loss)
**Layout:**
- Centered illustration (cloud with slash or unplugged icon)
- Headline: "You're offline"
- Body: "Check your internet connection and try again."
- "Retry" button
**Auto-dismisses** when connection restored

## 0.7 Update Available Screen
**Type:** Modal (soft update) or full-screen blocker (force update)
**Variants:**
- **Soft:** "Update Available" + "What's new" bullets + "Update Now" / "Later"
- **Force:** "Update Required" + "Update Now" only (no dismiss)

## 0.8 Maintenance Mode Screen
**Type:** Full-screen blocker
**Layout:** Illustration + "We're doing some maintenance" + estimated return time + "Try Again" button

## 0.9 Account Suspended / Blocked
**Type:** Full-screen, after failed login attempt with blocked account
**Layout:** Warning icon + "Your account has been suspended" + reason + "Contact Support" button (opens email or support form)

## 0.10 Session Expired
**Type:** Modal popup
**Triggered:** When backend rejects session token
**Layout:** "Session expired" + "Please log in again" + "Login" button → routes to Login

## 0.11 Generic Error Screen
**Type:** Full-screen or inline placeholder
**Layout:** Illustration + "Something went wrong" + body text + "Retry" + "Go Home" buttons

## 0.12 Loading / Skeleton States
**Used inline:** Skeleton placeholders for cards and lists during data fetch.
**Used full-screen:** Spinner + caption during blocking operations (payment, verification).

---

# SECTION 1 — FEMALE USER FLOW

## 1.1 Female Sign Up — Basic Info
**Type:** Full-screen form
**Layout:**
- Top app bar: Back arrow (left) · "Create Account" title · small "Female" subtitle
- Body (vertical form, scrollable):
  1. **Name** — text input
  2. **Age** — number input or dropdown (18+ only)
  3. **Gender** — pre-filled "Female" (read-only or selectable)
  4. **Password** — with show/hide toggle and strength meter
  5. **Confirm Password** — with show/hide
  6. **Mobile Number** — with country code prefix (+91 default)
- Primary button: "Generate OTP" (full-width, sticky bottom)
- Footer: "Already have an account? **Login**" link
**Validation:** All fields required · Password ≥ 8 chars · Passwords match · Valid 10-digit mobile

## 1.2 Female Sign Up — OTP Verification
**Type:** Full-screen
**Layout:**
- Top app bar: Back · "Verify Mobile" title
- Body:
  - "Enter the 6-digit code sent to +91 XXXXX XX[masked]"
  - 6 OTP input boxes (auto-advance, auto-fill from SMS if supported)
  - Resend timer: "Resend in 30s" → becomes tappable "Resend OTP" after countdown
  - "Change Number" link
- Primary button: "Verify & Continue"

## 1.3 Female Sign Up — Bank/UPI Details
**Type:** Full-screen
**Purpose:** Collect payout account (skippable)
**Layout:**
- Top app bar: Back · "Payout Details" title · **"Skip"** link top-right
- Body:
  - Subtitle: "Where should we send your earnings? You can update this anytime."
  - Toggle/segmented: [Bank Account] | [UPI]
  - **Bank fields:**
    - Account Holder Name
    - Account Number
    - Confirm Account Number
    - IFSC Code
  - **UPI field:**
    - UPI ID (with validation pattern)
- Primary button: "Save & Continue"
**Skip behavior:** Routes to next step; reminder banner shown on Earnings Dashboard until completed

## 1.4 Female Sign Up — Verification Info
**Type:** Full-screen informational
**Layout:**
- Top app bar: Back · "Verify You're You" title
- Centered illustration (face inside camera frame)
- Headline: "One quick photo"
- Body: "We verify your gender with a clear photo of your face. Our team will review it within 2 days."
- Bullet checklist with icons:
  - "Good lighting"
  - "Face clearly visible"
  - "No filters, sunglasses, or accessories"
- Primary button: "Open Camera"

## 1.5 Female Sign Up — Face Capture
**Type:** Full-screen camera view
**Layout:**
- Camera preview fills screen (front camera default)
- Top: Close (X) left · Flip camera right
- Center: Face outline guide (oval overlay)
- Bottom: Large shutter button (white circle with ring)
- After capture: preview state with image fullscreen + bottom buttons "Retake" (secondary) · "Submit" (primary)
**Important:** Live capture only. Gallery upload not allowed.

## 1.6 Female Sign Up — Verification Submitted
**Type:** Full-screen confirmation
**Layout:**
- Centered success illustration (clock or shield with check)
- Headline: "Verification submitted"
- Body: "Our team will review your photo within 2 days. We'll notify you once approved."
- Sub-body: "Until then, you can log in to check status."
- Primary button: "Got it" → routes to Login

## 1.7 Female Login — Phone Entry
**Type:** Full-screen
**Layout:**
- Top app bar: Back · "Welcome back" title · "Female" subtitle
- Body:
  - Mobile Number input with country code
  - "Forgot Password?" small underlined link below input (right-aligned)
- Primary button: "Continue"
**Behavior on Continue:** Backend checks photo status, routes to next screen accordingly

## 1.8 Female Login — Verification Pending Popup
**Type:** Modal popup over Phone Entry
**Triggered when:** Photo uploaded but verification incomplete
**Layout:**
- Icon (animated clock or hourglass)
- Headline: "Verification in progress"
- Body: "Our team is still reviewing your photo. Please check back later."
- Single "OK" button → dismisses popup, user stays on Phone Entry screen (NOT logged out)

## 1.9 Female Login — Photo Missing Reroute
**Type:** Not a screen — routing behavior
**When:** User reached login but never uploaded photo
**Action:** Auto-redirects to Verification Info (1.4) → Face Capture (1.5)

## 1.10 Female Login — Password Entry
**Type:** Full-screen
**Triggered when:** Verification status is "Verified"
**Layout:**
- Top app bar: Back · "Welcome back, [First Name]"
- Optional: profile pic and name shown above input
- Password input with show/hide toggle
- "Forgot Password?" link
- Primary button: "Login"

## 1.11 Forgot Password — Phone Entry
**Type:** Full-screen
**Layout:** "Reset Password" title · Mobile Number input · "Send OTP" primary button

## 1.12 Forgot Password — OTP Verification
**Type:** Full-screen (same pattern as 1.2)

## 1.13 Forgot Password — New Password
**Type:** Full-screen
**Layout:** "Create New Password" title · New Password input · Confirm New Password input · "Reset Password" primary button → success toast → routes to Login

## 1.14 Female Home Screen
**Type:** Full-screen, default tab after login
**Persistent bottom nav (across all main tabs):** Home (active) · Earnings · Profile
**Layout:**
- Top app bar:
  - Left: Greeting "Hi, [Name] 👋" (or just "Hi, [Name]")
  - Right: "Today's Earnings: ₹XXX" pill badge with subtle background
- Body (scrollable):
  1. **Availability card (full-width, prominent):**
     - Large toggle switch
     - Status text: "You're online" / "You're offline"
     - Sub-status: "Males can request chats" / "You won't receive chat requests"
     - Background color shifts (green tint when online, gray when offline)
  2. **Stats grid (2×2):**
     - Total Earnings (₹ value, "Total Earnings" label)
     - Today's Earnings (₹ value)
     - Ratings (★ X.X / 10)
     - Total No. of Chats (count)
     - Each cell is a small card with icon
  3. **Recent Chat Activity section:**
     - Section title "Recent Activity"
     - List of 3 most recent chat rows (no "See more"):
       - Each row: small avatar · Male username · "Spent 12 min" · "2h ago"
     - If empty: "No chats yet. Toggle online to start receiving requests."

## 1.15 Female Earnings Dashboard
**Type:** Full-screen tab
**Bottom nav:** Home · Earnings (active) · Profile
**Layout:**
- Top app bar: "Earnings" title
- Body (scrollable):
  1. **Stats row (4 horizontally scrollable cards or 2×2 grid):**
     - Total Earnings · Claimed · Requested · Available (all in ₹)
  2. **Payout Request card:**
     - Title "Withdraw earnings"
     - Big "Request Payout" primary button (disabled if Available = 0 or active payout exists)
     - Below button: status banner for latest payout (only shown if there is one):
       - **Pending:** Yellow background + clock icon + "Payout requested · ₹XXX · 2 days ago" + small "Tap to see status" link
       - **Claimed/Completed:** Green + check + "Paid out ₹XXX on [date]"
       - **Rejected:** Red + X + "Rejected · [reason]" + "Contact Support" link
  3. **Bank/UPI Details card:**
     - "Payout Account" title
     - Display: masked bank/UPI (e.g., "HDFC ••••3421" or "ramesh@upi")
     - "Update" link (right side) → routes to Bank/UPI Update screen
     - If not set: "Add bank/UPI details to receive payouts" with "Add" button
  4. **Chat History section:**
     - Section title "Chat History"
     - Filter pill row: [Today] [This Week] [This Month] (single-select, default Today)
     - Vertical list of chat rows:
       - Each row: small male avatar · Male username · "12 min" duration · "2h ago"
     - Infinite scroll
     - Empty state per filter: "No chats [today / this week / this month]"

## 1.16 Payout Request Confirmation Popup
**Type:** Modal centered popup
**Triggered:** Tap "Request Payout"
**Layout:**
- "Request Payout?" headline
- Body: "₹XXX will be requested. Only one payout can be active at a time, so you can't request another until this one is processed."
- Buttons: "Cancel" (secondary) · "Confirm Request" (primary)
**On confirm:** Success toast "Payout requested · We'll process within 2-3 days" + banner appears in Pending state

## 1.17 Bank/UPI Update Screen
**Type:** Full-screen
**Layout:** Same fields as 1.3 · Current saved info shown at top in non-editable summary card · "Save Changes" button + "Cancel" link

## 1.18 Female Profile Screen
**Type:** Full-screen tab
**Bottom nav:** Home · Earnings · Profile (active)
**Layout:**
- Top app bar: "Profile" title
- Body:
  - **Avatar block:** Large circular profile pic (centered) with small camera-overlay icon (bottom-right of circle) indicating tap-to-edit
  - **Username** below avatar (large text, centered)
  - "Edit profile" small link
  - **Menu list** (full-width tappable rows with leading icon and trailing chevron):
    - Help & Support
    - About App
    - Settings
    - Delete Account (text in red)
    - Logout (text in red)
**Default avatar:** If no pic uploaded, app's default female avatar (illustrated) is shown

## 1.19 Edit Profile Picture
**Type:** Bottom sheet (slides up from bottom)
**Triggered:** Tap profile pic or camera-overlay icon
**Options (large tappable rows):**
- 📷 Take Photo (opens camera)
- 🖼️ Choose from Gallery
- 🗑️ Remove Photo (only shown if a pic exists; red text)
- Cancel (closes sheet)

## 1.20 Help & Support
**Type:** Full-screen
**Layout:**
- Top app bar: Back · "Help & Support" title
- Body:
  - **FAQ accordion** — collapsible questions:
    - "How do I get verified?"
    - "When will I receive my payout?"
    - "How are ratings calculated?"
    - "What if I have a dispute?"
    - (more)
  - **Contact section:**
    - "Email us: support@[appname].com"
    - "Call: +91 XXXXXXXXXX"
  - "Report an Issue" primary button at bottom → Report Form

## 1.21 Report an Issue Form
**Type:** Full-screen or bottom sheet
**Layout:**
- "Report an Issue" title
- Category dropdown (Payment / Verification / Chat / Account / Other)
- Description textarea (multi-line)
- "Attach Screenshot" button (optional, opens gallery)
- Email field (pre-filled if user has email)
- Submit button → success toast "Report submitted · We'll respond within 24h"

## 1.22 About App
**Type:** Full-screen
**Layout:**
- App logo (centered, large)
- App name + version (e.g., "v1.0.0")
- Tagline
- Menu rows:
  - Terms of Service (→ in-app webview)
  - Privacy Policy (→ in-app webview)
  - Open-Source Licenses
- Footer: "© [Year] [Company Name]"

## 1.23 Settings
**Type:** Full-screen
**Layout:**
- Top app bar: Back · "Settings" title
- Body, grouped sections:
  - **Account:**
    - Change Password row
  - **Notifications:**
    - Push Notifications toggle
    - Sound toggle
    - Vibration toggle
  - **Privacy:**
    - Show online status toggle (optional)
  - **Language** (if multilingual support planned)

## 1.24 Change Password
**Type:** Full-screen
**Fields:**
- Current Password (with show/hide)
- New Password (with strength meter)
- Confirm New Password
**Button:** "Update Password" → success toast → back to Settings

## 1.25 Delete Account Confirmation
**Type:** Full-screen flow (multi-step to prevent accidents)
**Step 1 (Warning screen):**
- Red warning illustration
- "Delete your account?"
- Body: "This is permanent. We'll remove your earnings history, chats, and profile. Pending payouts must be cleared first."
- Buttons: "Cancel" · "Continue" (red)
**Step 2 (Confirmation):**
- "Type DELETE to confirm" input
- Password re-entry
- "Permanently Delete Account" red button
**On success:** Logout + back to Account Type Selection

## 1.26 Logout Confirmation
**Type:** Modal popup
**Layout:** "Logout?" · "You'll need to log in again to access the app." · Buttons: "Cancel" · "Logout"

## 1.27 Notifications Screen
**Type:** Full-screen
**Triggered:** Tap bell icon (if added to app bar) or from notification permission flow
**Layout:**
- Top app bar: Back · "Notifications" title · "Mark all read" link top-right
- Body: List of notification rows
  - Each row: icon (type-based) · title · short body · timestamp · unread dot
  - Notification types: New chat request received · Payout approved · Payout rejected · Verification approved · System updates
- Empty state: "You're all caught up!" with illustration

## 1.28 Incoming Chat Request Popup
**Type:** High-priority modal overlay (over any screen, even from home)
**Triggered:** When a male sends a chat request while female is online
**Layout:**
- Male's profile pic (large, centered top)
- Male's username (bold, below pic)
- "wants to chat with you"
- Auto-decline countdown: "Auto-declines in 30s" (with shrinking progress bar)
- Two buttons:
  - "Decline" (secondary, gray) — left
  - "Accept" (primary, prominent) — right (larger)
- Small "Block User" link at top-right corner (opens Block/Report bottom sheet)
**On Accept:** Routes to Active Chat Screen (Phase 2)
**On Decline:** Closes popup, no further action
**On Auto-decline:** Closes popup, female stays on prior screen

## 1.29 Block / Report Male
**Type:** Bottom sheet
**Triggered:** From chat request popup or (Phase 2) from chat screen
**Options:**
- "Block this user" — prevents future requests from this male
- "Report" — opens sub-sheet with reason picker:
  - Harassment
  - Spam
  - Fraud / scam
  - Inappropriate behavior
  - Other (with optional comment)
- Cancel
**On submit:** Toast "Report submitted, we'll review"

---

# SECTION 2 — MALE USER FLOW

## 2.1 Male Sign Up — Basic Info
**Type:** Full-screen form
**Layout:**
- Top app bar: Back · "Create Account" title · "Male" subtitle
- Body (form fields):
  1. Name
  2. Age (18+ only)
  3. Gender — pre-filled "Male"
  4. Password
  5. Confirm Password
  6. Mobile Number with country code
- Primary button: "Generate OTP"
- Footer: "Already have an account? **Login**"

## 2.2 Male Sign Up — OTP Verification
**Type:** Same pattern as 1.2

## 2.3 Male Onboarding / Welcome (3-slide carousel)
**Type:** Full-screen swipeable carousel, shown only on first sign-up completion
**Slide 1:**
- Illustration: females in a row of cards
- Headline: "Browse available females"
- Body: "Find someone you'd like to chat with from females who are online now."
**Slide 2:**
- Illustration: coin stack + chat bubble
- Headline: "Buy coins, send chat requests"
- Body: "Top up your wallet and send a chat request anytime."
**Slide 3:**
- Illustration: messaging bubbles
- Headline: "Chat when she accepts"
- Body: "Once she accepts, start chatting. Coins deduct per chat session."
**Common UI:**
- Pagination dots at bottom
- "Skip" link top-right (on slides 1 & 2)
- Slide 3 has "Get Started" primary button → routes to Home Screen

## 2.4 Male Login — Phone & Password
**Type:** Full-screen (one screen, both fields together since no verification gate)
**Layout:**
- Top app bar: Back · "Welcome back" title · "Male" subtitle
- Body:
  - Mobile Number input
  - Password input
  - "Forgot Password?" link
- Primary button: "Login"

## 2.5 Male Forgot Password Flow
**Same as 1.11–1.13** (Phone Entry → OTP → New Password)

## 2.6 Male Home Screen
**Type:** Full-screen tab (default after login)
**Bottom nav:** Wallet · Home (active) · Profile
**Layout:**
- Top app bar:
  - Left: Greeting "Hi, [Name]"
  - Right: Coin balance pill — coin icon + "XXX coins" (tappable, routes to Wallet)
- Body (scrollable):
  1. **Search/Filter bar (optional but recommended):**
     - Search by username input
     - Filter icon → opens filter sheet (sort by rating, online only, etc.)
  2. **Favourites section** (only if user has favourited anyone):
     - Section title "Your Favourites" with "See all" link
     - Horizontal carousel of female cards (each ~140px wide)
     - Each carousel card:
       - Profile pic (round, with status indicator dot)
       - Username
       - Star rating
       - Small chat icon at bottom-right (tappable → triggers chat request)
  3. **Available Females section:**
     - Section title "Available Now"
     - Filter chip row (optional): [All] [Online] [Available]
     - Vertical list of female cards
     - Each card row (~90px tall):
       - Left: Profile pic (round, ~64px), with status indicator dot (green=online, gray=offline, yellow=available/optionable)
       - Middle column:
         - Username (bold)
         - Rating "★ X.X/10"
         - Favourites count "♡ XXX favs"
       - Right column:
         - Heart icon (filled red if already favourited, outlined otherwise) — tap to toggle favourite
         - Chat icon (primary CTA, prominent) — tap to send chat request
     - Pull-to-refresh
     - Infinite scroll
**Empty state:** "No females online right now. Check back soon!" with illustration

## 2.7 Female Profile Preview Screen
**Type:** Full-screen
**Triggered:** Male taps on a female's card body (not the chat icon)
**Layout:**
- Top app bar: Back · Share icon (optional) · More icon (block/report)
- Hero section:
  - Large profile pic (full-width or centered)
  - Status indicator dot
- Below hero:
  - Username (large)
  - Age · Rating "★ X.X/10" · Total chats · Favourited count
  - Bio / description (if she added one)
  - Member since [date]
- Sticky bottom action bar:
  - Heart button (favourite toggle) — left
  - "Send Chat Request" primary button — right (full-width minus heart)
**On Send Chat Request:** Check coin balance → if insufficient, show Insufficient Coins popup; else proceed to Chat Request Sent waiting screen

## 2.8 Male Wallet / Transaction Tab
**Type:** Full-screen tab with internal slider/segmented control
**Bottom nav:** Wallet (active) · Home · Profile
**Layout:**
- Top app bar: "Wallet" title
- Top of body: Segmented control with two pills [Wallet] | [Transaction] — Wallet selected by default. Tapping or swiping switches the view.

### 2.8a Wallet view (default)
- **Balance hero card (prominent):**
  - "My Balance" label
  - Large coin amount (e.g., "1,250 coins")
  - Subtitle: "Total Coins Spent: 4,800"
  - Background color: gradient or solid accent
- **Purchase Coins section:**
  - Section title "Buy More Coins"
  - Grid of 6 coin packages (2 columns × 3 rows):
    - Each package card:
      - Coin amount (large, bold) — e.g., "100 coins"
      - Price (₹XX)
      - Optional "Best Value" or "Popular" tag on 1-2 cards
    - Tap → Coin Purchase Confirmation popup

### 2.8b Transaction view
- Filter pill row: [Coins Purchased] | [Coins Spent] (single-select, default Purchased)
- **Coins Purchased rows:**
  - Date + time
  - Amount paid (₹) + coins received
  - Transaction ID (small)
  - Status indicator (Success / Failed / Pending) — colored
- **Coins Spent rows:**
  - Date + time
  - Female username (with small avatar)
  - Duration / type
  - Coins consumed (e.g., "-200 coins")
- Empty state per filter: "No transactions yet" + illustration

## 2.9 Coin Purchase Confirmation Popup
**Type:** Modal
**Triggered:** Tap a coin package card
**Layout:**
- "Buy XX coins?" headline
- Summary block:
  - Package: XX coins
  - Price: ₹XX
  - New balance after purchase: XX coins
- Buttons:
  - "Cancel" (secondary)
  - "Pay ₹XX" (primary) → triggers Razorpay redirect

## 2.10 Payment Processing
**Type:** Full-screen loader (Razorpay's flow + return state)
**Layout:** Spinner + "Processing payment..." + "Don't close the app"

## 2.11 Payment Success
**Type:** Full-screen confirmation
**Layout:**
- Centered green check / success illustration (animated burst optional)
- Headline: "Payment Successful! 🎉"
- Coins added: "+XXX coins"
- New balance: "Your balance is now XXX coins"
- Transaction ID (small)
- Primary button: "Continue" → back to Wallet
- Secondary: "View Receipt" link → opens receipt screen or PDF

## 2.12 Payment Failed
**Type:** Full-screen
**Layout:**
- Centered red X / failure illustration
- Headline: "Payment Failed"
- Reason from gateway (e.g., "Bank declined the transaction")
- Buttons: "Try Again" (primary) · "Cancel" (secondary)
- "Need help? Contact Support" link

## 2.13 Insufficient Coins Warning
**Type:** Modal popup
**Triggered:** Male tries to send chat request without enough coins
**Layout:**
- Coin icon with X overlay
- Headline: "Not enough coins"
- Body: "You need at least XX coins to start a chat. You have XX coins."
- Buttons:
  - "Cancel"
  - "Buy Coins" (primary) → routes to Wallet

## 2.14 Male Profile Screen
**Type:** Full-screen tab
**Bottom nav:** Wallet · Home · Profile (active)
**Layout:**
- Top app bar: "Profile" title
- Body:
  - **Avatar block:** Large circular profile pic with tap-to-edit overlay icon
  - **Username** below
  - **Menu list** (icons + chevrons):
    - Help & Support
    - About App
    - Wallet (shortcut to Wallet tab)
    - Transaction (shortcut to Wallet → Transaction view)
    - Settings
    - Delete Account (red)
    - Logout (red)
**Default avatar:** If no pic uploaded, app's default male avatar (illustrated)

## 2.15 Edit Profile Picture (Male)
**Same as 1.19** (bottom sheet with Take Photo / Gallery / Remove)

## 2.16 Help & Support (Male)
**Type:** Full-screen
**Same pattern as 1.20** with male-relevant FAQs:
- "How do I buy coins?"
- "How do coins work?"
- "Can I get a refund?"
- "How do I report a female user?"

## 2.17 Report an Issue (Male) — Same as 1.21

## 2.18 About App — Same as 1.22

## 2.19 Settings (Male) — Same as 1.23 minus female-specific items

## 2.20 Change Password (Male) — Same as 1.24

## 2.21 Delete Account (Male) — Same as 1.25 (warning about coin balance forfeited if applicable)

## 2.22 Logout Confirmation (Male) — Same as 1.26

## 2.23 Notifications Screen (Male)
**Same as 1.27** with male-relevant notifications:
- Chat request accepted / declined
- Payment success / failure
- Favourite went online
- System updates

## 2.24 Chat Request Sent — Waiting Screen
**Type:** Full-screen
**Triggered:** Male taps chat icon on a female's card
**Layout:**
- Top app bar: "Sending request..."
- Hero: Female's profile pic (large, centered)
- Headline: "Waiting for [Name] to accept..."
- Subtitle: "She'll see your request now"
- Animated spinner or pulsing avatar effect
- Coin cost reminder: "This will cost XX coins per minute once she accepts"
- Bottom: "Cancel Request" button (secondary, red text)
**Behavior:**
- If accepted → routes to Active Chat (Phase 2)
- If declined → routes to Chat Request Declined screen
- If timeout (no response in X minutes) → routes to Timeout screen

## 2.25 Chat Request Accepted Notification
**Type:** Brief modal or auto-redirect with toast
**Layout:** Green check + "[Name] accepted! Opening chat..." → routes immediately to Active Chat Screen (Phase 2)

## 2.26 Chat Request Declined Screen
**Type:** Full-screen
**Layout:**
- Top app bar: Back
- Centered illustration (apologetic / hand wave)
- Headline: "[Name] declined your request"
- Subtitle: "No worries, plenty of others are available"
- Buttons:
  - "Browse Others" (primary) → back to Home
  - "Send Request Again" (secondary, optional)

## 2.27 Chat Request Timeout Screen
**Type:** Full-screen
**Layout:**
- "[Name] didn't respond"
- "Her request timed out. Try again later or browse others."
- Buttons: "Browse Others" · "Try Again"

## 2.28 Queue Position Screen (Phase 2 placeholder — UI design now, integrate later)
**Type:** Full-screen
**Triggered:** Male sends request to female who already has active queue
**Layout:**
- Female's profile pic at top
- Headline: "You're 3rd in line"
- Body: "She'll get to you in approximately 15 minutes"
- Visual queue indicator (positions shown as dots or numbered)
- Coin cost reminder
- "Cancel Request" button

## 2.29 Like / Dislike Rating Screen (post-chat)
**Type:** Full-screen, mandatory after a chat ends
**Triggered:** When chat session ends (Phase 2 chat will navigate here)
**Layout:**
- Top app bar: Skip link top-right (optional skip)
- Hero: Female's profile pic (medium, centered)
- Headline: "How was your chat with [Name]?"
- Two large action buttons centered vertically:
  - **Like button** — thumbs up icon (green tint), label "Like"
  - **Dislike button** — thumbs down icon (red tint), label "Dislike"
- (Optional) Quick comment textarea below: "Add a comment (optional)"
- Bottom: "Submit" primary button (disabled until Like or Dislike chosen, unless Skip)
**On submit:** Brief toast "Thanks for your feedback!" → routes to Home Screen
**Note:** This rating drives the female's rating score (rating = function of likes/dislikes over time) and appears in admin dashboard's Personal Data Female page.

## 2.30 Block / Report Female
**Same pattern as 1.29** with female-specific report reasons:
- Inappropriate behavior
- Scam / asking for off-platform contact
- Not responsive in chat
- Misrepresentation (didn't match profile)
- Other

---

# SECTION 3 — SHARED INTERACTION PATTERNS

## 3.1 Toast / Snackbar
- Appears at bottom of screen, auto-dismisses after 2-3 seconds
- Variants: Success (green), Info (blue), Error (red), Warning (yellow)
- Used for: confirmations of actions ("Payout requested"), brief errors, non-blocking info

## 3.2 Bottom Sheet
- Slides up from bottom with rounded top corners and a handle bar
- Used for: media picker actions, report/block options, contextual menus
- Has dimmed backdrop; tap outside to dismiss

## 3.3 Confirmation Dialogs
- Centered modal, semi-transparent backdrop
- Always: title + body + Cancel button + primary action button
- Destructive variants use red color for primary action

## 3.4 Pull-to-Refresh
- Available on: Female Home (Recent Activity), Male Home (Available Females), Earnings Chat History, Transaction History, Notifications

## 3.5 Empty States
- Used when: no chats, no transactions, no favourites, no notifications
- Pattern: illustration + headline + body explanation + (optional) action button

## 3.6 Loading States
- Skeleton placeholders for cards and lists during data fetch
- Spinner inside buttons when action is pending
- Full-screen loader for blocking ops (payment, verification submission)

## 3.7 Status Indicators (online/offline/available)
- Small colored dot positioned at bottom-right of female profile pic:
  - **Green dot:** Online (toggle ON)
  - **Gray dot:** Offline (toggle OFF, app closed)
  - **Yellow dot:** Available / Optionable (app open but toggle OFF)

---

# SECTION 4 — PHASE 2 SCREENS (Deferred — for context only)

These screens are part of the chat flow and not designed in this document. List provided so you don't miss them in planning:

- **Active Chat Screen** — message bubbles (male left / female right), text composer with send button, attachment icon, emoji picker, voice note button (?), typing indicator, message delivery states (sent/delivered/read), session timer / coins remaining indicator, "End Chat" button
- **Attachment Picker** — bottom sheet (Camera / Gallery for images; Camera / Gallery for videos)
- **Image Compose Preview** — before sending, with caption input
- **Video Compose Preview** — before sending, with caption input and trim option (if needed)
- **Full-screen Image Viewer** — for received images (pinch to zoom, swipe to dismiss)
- **Full-screen Video Player** — for received videos (play/pause, scrub bar)
- **Chat Ended Screen** — "Chat ended by [Name]" or "Time's up" + summary + "Rate" CTA (routes to 2.29)
- **Queue Management UI** — for females with multiple incoming requests (waitlist view)
- **5-Person Queue Logic UI** — when female has 5 pending requests, new ones go to queue with 20-min timeout
- **Coin Deduction Real-time Feedback** — visible coin counter ticking down during chat
- **Low Coin Warning Mid-Chat** — popup when coins drop below threshold during active chat
- **Connection Lost During Chat** — overlay with auto-reconnect indicator

---

# SECTION 5 — STITCH PROMPT GENERATION TIPS

When converting each screen above into a Stitch prompt, include:

1. **Screen identifier:** e.g., "Female Home Screen (1.14)"
2. **User context:** logged-in female, default tab after login
3. **Layout structure:** top bar / body sections / bottom navigation
4. **Specific components:** with sample text/copy (use realistic placeholder data)
5. **Visual style cues:** light theme, soft pink accents, rounded 16px cards, soft shadows
6. **Reference apps (optional):** "Card style like Notion, list rows like WhatsApp, hero card like Cred"
7. **Mobile aspect ratio:** 9:19.5
8. **Component states (when relevant):** active state, disabled state, empty state

### Example Stitch prompt (for 1.14 Female Home):
> Mobile app home screen for a female user on a paid chat platform.
>
> Top app bar with "Hi, Priya 👋" on the left and a pill badge on the right showing "Today's Earnings: ₹420".
>
> Below the app bar: a large prominent card with a big toggle switch labeled "You're online — males can request chats" with a green-tinted background.
>
> Below that: a 2×2 grid of stat cards: "Total Earnings ₹12,400", "Today's Earnings ₹420", "Ratings ★ 8.6/10", "Total Chats 142". Each card has a small icon and rounded corners.
>
> Below the grid: section title "Recent Activity" with 3 rows of recent chats — each row has a small male avatar, username, duration (e.g., "Spent 12 min"), and timestamp ("2h ago").
>
> Bottom navigation bar with 3 tabs: Home (active, pink), Earnings, Profile.
>
> Style: light theme, soft pink/coral accents, rounded 16px cards, soft shadows, clean sans-serif type. Mobile aspect ratio 9:19.5.

Use this template structure for every screen.

---

# Appendix — Open Design Decisions (not blockers for Stitch)

1. **Coin deduction model:** Per-minute vs per-message vs flat per-session — to be finalized before Phase 2.
2. **Chat session duration cap:** Is there a max length per session? Auto-end?
3. **Delete chat behavior:** Hard vs soft delete on transcript admin dashboard.
4. **Multiple admin logins:** Single shared vs role-based with audit trail.
5. **Refund policy for failed chats:** What if female disconnects mid-chat?
6. **Female photo retake:** Allowed after verification? Currently not in flow.
