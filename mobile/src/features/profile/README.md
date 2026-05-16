# Profile (spec 1.18 → 1.26, 2.14 → 2.22)

## Screens

- FemaleProfileScreen
- MaleProfileScreen
- HelpSupportScreen
- ReportIssueScreen
- AboutAppScreen
- SettingsScreen
- ChangePasswordScreen
- DeleteAccountFlowScreens (multi-step)

## Components

- EditProfilePicSheet (bottom sheet — Take Photo / Gallery / Remove)
- LogoutConfirmationModal

## Architecture notes

- Profile pic update: image-picker / vision-camera → `image_cropper`-equivalent
  square crop → `cloudinaryService.fetchSignature` → upload → PATCH
  `users.avatar_url`.
- Delete-account checks pending payouts for female; blocks deletion if any.
- Change password is auth'd: Supabase `auth.updateUser({ password })`.

## External integrations

- Cloudinary (signed-upload pattern).
- Supabase Storage (only via auth verification, not here).
