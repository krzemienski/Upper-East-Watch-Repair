import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db, sessionsTable } from "@workspace/db";
import { eq, lt } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger";

/**
 * Shared-password admin authentication.
 *
 * The password lives only in the ADMIN_PASSWORD secret. If it is missing,
 * every admin request is refused (fail closed) — there is no default.
 * Sessions are random tokens; only their SHA-256 hash is stored in the
 * sessions table, so a database read cannot be replayed as a cookie.
 * Each session also records a fingerprint of the password it was created
 * with, so changing the secret signs every browser out.
 */

export const ADMIN_SESSION_COOKIE = "uewr_admin";
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const ADMIN_ACTOR_ID = "shop-admin";

const MIN_PASSWORD_LENGTH = 8;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_CLIENT = 5;
const CLIENT_LOCKOUT_MS = 15 * 60 * 1000;
const MAX_FAILURES_GLOBAL = 50;
const GLOBAL_LOCKOUT_MS = 15 * 60 * 1000;
const FAILURE_DELAY_MS = 750;

interface AdminSessionRecord {
  kind: "admin_password";
  passwordFingerprint: string;
  createdAt: string;
}

function getConfiguredPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  if (!value || value.length < MIN_PASSWORD_LENGTH) return null;
  return value;
}

export function isAdminPasswordConfigured(): boolean {
  return getConfiguredPassword() !== null;
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function passwordFingerprint(password: string): string {
  return createHmac("sha256", "uewr-admin-session-v1").update(password).digest("hex");
}

export function verifyAdminPassword(candidate: string): boolean {
  const configured = getConfiguredPassword();
  if (!configured) return false;
  return timingSafeEqual(sha256(candidate), sha256(configured));
}

/* ---------------- Failed-attempt throttling ---------------- */

interface FailureBucket {
  failures: number;
  windowStart: number;
  lockedUntil: number;
}

const clientFailures = new Map<string, FailureBucket>();
const globalFailures: FailureBucket = { failures: 0, windowStart: 0, lockedUntil: 0 };

function freshBucket(bucket: FailureBucket, now: number) {
  if (now - bucket.windowStart > FAILURE_WINDOW_MS) {
    bucket.failures = 0;
    bucket.windowStart = now;
  }
}

export function clientKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

/** Milliseconds until another login attempt is allowed, or 0. */
export function loginRetryAfterMs(key: string): number {
  const now = Date.now();
  const bucket = clientFailures.get(key);
  const clientWait = bucket ? Math.max(0, bucket.lockedUntil - now) : 0;
  const globalWait = Math.max(0, globalFailures.lockedUntil - now);
  return Math.max(clientWait, globalWait);
}

export async function recordLoginFailure(key: string): Promise<void> {
  const now = Date.now();
  const bucket = clientFailures.get(key) ?? { failures: 0, windowStart: now, lockedUntil: 0 };
  freshBucket(bucket, now);
  bucket.failures += 1;
  if (bucket.failures >= MAX_FAILURES_PER_CLIENT) {
    bucket.lockedUntil = now + CLIENT_LOCKOUT_MS;
    bucket.failures = 0;
    logger.warn({ client: key }, "Admin login temporarily locked for client after repeated failures");
  }
  clientFailures.set(key, bucket);

  freshBucket(globalFailures, now);
  globalFailures.failures += 1;
  if (globalFailures.failures >= MAX_FAILURES_GLOBAL) {
    globalFailures.lockedUntil = now + GLOBAL_LOCKOUT_MS;
    globalFailures.failures = 0;
    logger.warn("Admin login temporarily locked globally after many failures");
  }

  // Slow down every wrong guess.
  await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
}

export function clearLoginFailures(key: string) {
  clientFailures.delete(key);
}

const pruneTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of clientFailures) {
    if (bucket.lockedUntil < now && now - bucket.windowStart > FAILURE_WINDOW_MS) {
      clientFailures.delete(key);
    }
  }
}, FAILURE_WINDOW_MS);
pruneTimer.unref();

/* ---------------- Sessions ---------------- */

function hashToken(token: string): string {
  return `admin:${createHash("sha256").update(token).digest("hex")}`;
}

export async function createAdminSession(): Promise<{ token: string; expiresAt: Date }> {
  const password = getConfiguredPassword();
  if (!password) throw new Error("Admin password is not configured");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
  const record: AdminSessionRecord = {
    kind: "admin_password",
    passwordFingerprint: passwordFingerprint(password),
    createdAt: new Date().toISOString(),
  };
  await db.insert(sessionsTable).values({
    sid: hashToken(token),
    sess: record as unknown as Record<string, unknown>,
    expire: expiresAt,
  });
  // Opportunistic cleanup of expired rows.
  void db
    .delete(sessionsTable)
    .where(lt(sessionsTable.expire, new Date()))
    .catch((error: unknown) => logger.warn({ err: error }, "Unable to prune expired sessions"));
  return { token, expiresAt };
}

/** Returns the session expiry when the request carries a valid admin session. */
export async function getAdminSession(req: Request): Promise<{ expiresAt: Date } | null> {
  const password = getConfiguredPassword();
  const token: unknown = req.cookies?.[ADMIN_SESSION_COOKIE];
  if (!password || typeof token !== "string" || token.length < 20 || token.length > 200) {
    return null;
  }
  const sid = hashToken(token);
  const [row] = await db.select().from(sessionsTable).where(eq(sessionsTable.sid, sid)).limit(1);
  if (!row) return null;
  const record = row.sess as unknown as Partial<AdminSessionRecord>;
  const valid =
    row.expire > new Date() &&
    record.kind === "admin_password" &&
    record.passwordFingerprint === passwordFingerprint(password);
  if (!valid) {
    await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
    return null;
  }
  return { expiresAt: row.expire };
}

export async function destroyAdminSession(req: Request): Promise<void> {
  const token: unknown = req.cookies?.[ADMIN_SESSION_COOKIE];
  if (typeof token === "string" && token.length > 0 && token.length <= 200) {
    await db.delete(sessionsTable).where(eq(sessionsTable.sid, hashToken(token)));
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/api",
};

export function setAdminCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(ADMIN_SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export function clearAdminCookie(res: Response) {
  res.clearCookie(ADMIN_SESSION_COOKIE, cookieOptions);
}

/** Paths under /api/admin that must stay reachable without a session. */
const PUBLIC_ADMIN_PATHS = new Set(["/login", "/logout", "/session"]);

/**
 * Mounted at /admin: every admin data route requires a valid session.
 * Individual routes also call `isAdminRequest` as defense in depth.
 */
export async function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  if (PUBLIC_ADMIN_PATHS.has(req.path)) {
    next();
    return;
  }
  if (!isAdminPasswordConfigured()) {
    req.log.warn("Rejected admin request: ADMIN_PASSWORD is not configured");
    res.status(503).json({ error: "Admin access is not configured" });
    return;
  }
  try {
    const session = await getAdminSession(req);
    if (!session) {
      clearAdminCookie(res);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.locals.adminSession = session;
    next();
  } catch (error) {
    next(error);
  }
}

export function isAdminRequest(res: Response): boolean {
  if (res.locals.adminSession) return true;
  res.status(401).json({ error: "Unauthorized" });
  return false;
}
