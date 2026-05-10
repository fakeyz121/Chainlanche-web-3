import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import freelancersRouter from "./freelancers";
import servicesRouter from "./services";
import ordersRouter from "./orders";
import escrowRouter from "./escrow";
import walletRouter from "./wallet";
import messagesRouter from "./messages";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(freelancersRouter);
router.use(servicesRouter);
router.use(ordersRouter);
router.use(escrowRouter);
router.use(walletRouter);
router.use(messagesRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);

export default router;
