import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import guidesRouter from "./guides";
import repairLeadsRouter from "./repairLeads";
import customersRouter from "./customers";
import { requireAdminSession } from "../lib/adminAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
// Every other /admin/* route requires the shared-password admin session.
router.use("/admin", requireAdminSession);
router.use(guidesRouter);
router.use(repairLeadsRouter);
router.use(customersRouter);

export default router;
