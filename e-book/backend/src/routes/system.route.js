import express from "express";
import { getSystemSettingsController, updateSystemSettingsController, getSystemStatsController } from "../controller/system.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getSystemSettingsController);
router.patch("/", verifyToken, isAdmin, updateSystemSettingsController);
router.get("/stats", verifyToken, isAdmin, getSystemStatsController);

export default router;
