import type { AuthUser } from "@workspace/api-zod";

const ADMIN_IDS_ENV = "ADMIN_REPLIT_USER_IDS";

function getConfiguredAdminIds(): Set<string> {
  return new Set(
    (process.env[ADMIN_IDS_ENV] ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

/**
 * Fail-closed editor authorization. Authentication alone never grants access.
 * Configure one or more stable Replit OIDC subject IDs as a comma-separated
 * ADMIN_REPLIT_USER_IDS environment variable.
 */
export function isAdminUser(user: Pick<AuthUser, "id"> | null | undefined): boolean {
  return !!user?.id && getConfiguredAdminIds().has(user.id);
}