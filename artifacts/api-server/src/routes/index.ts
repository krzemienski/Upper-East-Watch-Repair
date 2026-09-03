import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import guidesRouter from "./guides";
import repairLeadsRouter from "./repairLeads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(guidesRouter);
router.use(repairLeadsRouter);

export default router;
