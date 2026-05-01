import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  confirmSubscriptionController,
  createPortalSessionController,
  getStripeConfigController,
  prepareSubscriptionController,
  stripeWebhookController,
} from "../controller/stripe.controller.js";

const router = express.Router();

router.get("/config", getStripeConfigController);
router.post("/webhook", stripeWebhookController);
router.post("/subscription/prepare", verifyToken, prepareSubscriptionController);
router.post("/subscription/confirm", verifyToken, confirmSubscriptionController);
router.post("/portal", verifyToken, createPortalSessionController);

export default router;
