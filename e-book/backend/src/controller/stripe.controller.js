import successResponse from "../utils/success.response.js";
import {
  confirmSubscriptionService,
  createPortalSessionService,
  getStripeConfigService,
  handleStripeWebhookService,
  prepareSubscriptionService,
} from "../service/stripe.service.js";

export const getStripeConfigController = async (req, res, next) => {
  try {
    const data = await getStripeConfigService();
    successResponse(
      {
        success: true,
        message: "Stripe config fetched successfully",
        data,
      },
      res,
    );
  } catch (error) {
    next(error);
  }
};

export const prepareSubscriptionController = async (req, res, next) => {
  try {
    const data = await prepareSubscriptionService(req.user.userId);
    successResponse(
      {
        success: true,
        message: "Stripe subscription prepared successfully",
        data,
      },
      res,
    );
  } catch (error) {
    next(error);
  }
};

export const confirmSubscriptionController = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;
    const data = await confirmSubscriptionService(req.user.userId, subscriptionId);
    successResponse(
      {
        success: true,
        message: "Stripe subscription confirmed successfully",
        data,
      },
      res,
    );
  } catch (error) {
    next(error);
  }
};

export const createPortalSessionController = async (req, res, next) => {
  try {
    const data = await createPortalSessionService(req.user.userId);
    successResponse(
      {
        success: true,
        message: "Stripe billing portal created successfully",
        data,
      },
      res,
    );
  } catch (error) {
    next(error);
  }
};

export const stripeWebhookController = async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];
    const data = await handleStripeWebhookService(signature, req.body);
    successResponse(
      {
        success: true,
        message: "Stripe webhook processed successfully",
        data,
      },
      res,
    );
  } catch (error) {
    next(error);
  }
};
