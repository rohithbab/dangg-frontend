/** Account role. */
export enum UserRole {
  Female = 'female',
  Male = 'male',
  Admin = 'admin',
}

/** Female verification lifecycle — stored on `females.verification_status`. */
export enum VerificationStatus {
  None = 'none',
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
}

export function parseUserRole(raw: unknown): UserRole | null {
  if (raw === UserRole.Female || raw === UserRole.Male || raw === UserRole.Admin) {
    return raw;
  }
  return null;
}

export function parseVerificationStatus(raw: unknown): VerificationStatus {
  switch (raw) {
    case VerificationStatus.Pending:
    case VerificationStatus.Verified:
    case VerificationStatus.Rejected:
      return raw;
    default:
      return VerificationStatus.None;
  }
}

/**
 * Placeholder cross-feature user model.
 *
 * Only fields the foundation cares about are modelled — `id`, `name`,
 * `role`, plus `verificationStatus` consulted by the navigation root.
 * Feature-specific fields (avatar URL, age, coin balance, etc.) get added
 * as their owning features land.
 */
export type User = {
  id: string;
  name: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
};
