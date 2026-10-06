import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  GetAdminSessionResponse,
} from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import {
  clearAdminCookie,
  clearLoginFailures,
  clientKey,
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
  isAdminPasswordConfigured,
  loginRetryAfterMs,
  recordLoginFailure,
  setAdminCookie,
  verifyAdminPassword,
} from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/admin/session", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const configured = isAdminPasswordConfigured();
  const session = configured ? await getAdminSession(req) : null;
  if (!session) clearAdminCookie(res);
  res.json(
    GetAdminSessionResponse.parse({
      authenticated: !!session,
      configured,
      ...(session ? { expiresAt: session.expiresAt } : {}),
    }),
  );
});

router.post("/admin/login", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  if (!isAdminPasswordConfigured()) {
    req.log.warn("Admin login refused: ADMIN_PASSWORD is not configured");
    res.status(503).json({ error: "Admin access is not configured yet." });
    return;
  }
  const key = clientKey(req);
  const retryAfterMs = loginRetryAfterMs(key);
  if (retryAfterMs > 0) {
    res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
    res.status(429).json({
      error: `Too many incorrect attempts. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).`,
    });
    return;
  }
  const body = AdminLoginBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Enter the admin password." });
    return;
  }
  if (!verifyAdminPassword(body.data.password)) {
    await recordLoginFailure(key);
    req.log.warn("Rejected admin login with incorrect password");
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  clearLoginFailures(key);
  const { token, expiresAt } = await createAdminSession();
  setAdminCookie(res, token, expiresAt);
  req.log.info("Admin signed in");
  res.json(AdminLoginResponse.parse({ authenticated: true, configured: true, expiresAt }));
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  await destroyAdminSession(req);
  clearAdminCookie(res);
  res.json(
    AdminLogoutResponse.parse({
      authenticated: false,
      configured: isAdminPasswordConfigured(),
    }),
  );
});

export default router;
