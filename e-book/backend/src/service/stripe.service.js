import Stripe from "stripe";
import userModel from "../model/user.model.js";
import { AppError } from "../utils/error.js";
import {
  applySubscriptionState,
  getFreeBookLimit,
  getSubscriptionSnapshot,
} from "./subscription.service.js";

let stripeClient;

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe secret key is not configured", 500);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

const getPublishableKey = () => {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new AppError("Stripe publishable key is not configured", 500);
  }

  return process.env.STRIPE_PUBLISHABLE_KEY;
};

const getStripePriceReference = async () => {
  const rawReference = (process.env.STRIPE_PRICE_ID || "").trim();
  if (!rawReference) {
    throw new AppError("Stripe price configuration is missing", 500);
  }

  console.log("[Stripe Config] STRIPE_PRICE_ID raw value:", rawReference);

  if (rawReference.startsWith("price_")) {
    console.log("[Stripe Config] Using direct price ID:", rawReference);
    return rawReference;
  }

  if (!rawReference.startsWith("prod_")) {
    throw new AppError("Stripe price configuration is invalid", 500);
  }

  // It's a product ID — need to resolve to a price ID
  console.log("[Stripe Config] Resolving product to price for:", rawReference);
  const stripe = getStripeClient();

  let product;
  try {
    product = await stripe.products.retrieve(rawReference, {
      expand: ["default_price"],
    });
    console.log("[Stripe Config] Product retrieved:", {
      id: product.id,
      name: product.name,
      active: product.active,
      default_price_type: typeof product.default_price,
      default_price_id:
        typeof product.default_price === "object"
          ? product.default_price?.id
          : product.default_price,
    });
  } catch (err) {
    console.error("[Stripe Config] Failed to retrieve product:", err.message);
    throw new AppError(
      `Stripe product ${rawReference} not found or inaccessible: ${err.message}`,
      500,
    );
  }

  const defaultPrice = product.default_price;
  if (
    defaultPrice &&
    typeof defaultPrice !== "string" &&
    defaultPrice.id &&
    defaultPrice.recurring
  ) {
    console.log("[Stripe Config] Using product default_price:", defaultPrice.id, {
      unit_amount: defaultPrice.unit_amount,
      currency: defaultPrice.currency,
      interval: defaultPrice.recurring?.interval,
    });
    return defaultPrice.id;
  }

  console.log("[Stripe Config] default_price not suitable (no recurring), listing prices...");

  const prices = await stripe.prices.list({
    product: rawReference,
    active: true,
    limit: 10,
  });

  console.log("[Stripe Config] Found prices:", prices.data.map((p) => ({
    id: p.id,
    unit_amount: p.unit_amount,
    currency: p.currency,
    type: p.type,
    recurring: p.recurring ? { interval: p.recurring.interval } : null,
  })));

  const recurringPrice = prices.data.find((price) => Boolean(price.recurring));
  if (!recurringPrice) {
    throw new AppError(
      `No active recurring Stripe price found for product ${rawReference}. ` +
      `Found ${prices.data.length} prices but none are recurring. ` +
      `Please create a recurring price in the Stripe Dashboard, or set STRIPE_PRICE_ID to a valid price_* ID.`,
      500,
    );
  }

  console.log("[Stripe Config] Selected recurring price:", recurringPrice.id, {
    unit_amount: recurringPrice.unit_amount,
    currency: recurringPrice.currency,
    interval: recurringPrice.recurring?.interval,
  });

  return recurringPrice.id;
};


const getOrCreateCustomer = async (user) => {
  const stripe = getStripeClient();

  if (user?.stripe?.customerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripe.customerId);
      if (!customer.deleted) {
        return customer.id;
      }
    } catch (error) {
      console.warn("[Stripe] Stored customer lookup failed:", error.message);
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: String(user._id),
    },
  });

  user.stripe = {
    ...(user.stripe || {}),
    customerId: customer.id,
  };
  await user.save();

  return customer.id;
};

const releaseIncompleteSubscription = async (user) => {
  const stripe = getStripeClient();
  const subscriptionId = user?.stripe?.subscriptionId;

  if (!subscriptionId) {
    return null;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.status === "incomplete") {
      await stripe.subscriptions.cancel(subscription.id);
      return null;
    }

    if (subscription.status === "incomplete_expired") {
      return null;
    }

    return subscription;
  } catch (error) {
    console.warn("[Stripe] Existing subscription lookup failed:", error.message);
    return null;
  }
};

export const getStripeConfigService = async () => {
  const priceReference = await getStripePriceReference();

  return {
    publishableKey: getPublishableKey(),
    freeBookLimit: getFreeBookLimit(),
    priceReference,
    returnUrl: "smartshelf://stripe-redirect",
  };
};

export const prepareSubscriptionService = async (userId) => {
  const stripe = getStripeClient();
  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const currentState = getSubscriptionSnapshot(user);
  if (currentState.isActive) {
    return {
      alreadySubscribed: true,
      subscriptionStatus: currentState.status,
      subscriptionExpiry: currentState.expiryDate,
    };
  }

  const priceId = await getStripePriceReference();
  console.log("[Stripe Prepare] Resolved price ID:", priceId);

  const customerId = await getOrCreateCustomer(user);
  console.log("[Stripe Prepare] Customer ID:", customerId);

  await releaseIncompleteSubscription(user);

  console.log("[Stripe Prepare] Creating subscription with:", {
    customer: customerId,
    priceId,
    payment_behavior: "default_incomplete",
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
    metadata: {
      userId: String(user._id),
    },
  });

  console.log("[Stripe Prepare] Subscription created:", {
    id: subscription.id,
    status: subscription.status,
    latest_invoice_type: typeof subscription.latest_invoice,
    latest_invoice_id:
      typeof subscription.latest_invoice === "object"
        ? subscription.latest_invoice?.id
        : subscription.latest_invoice,
  });

  // Extract payment intent — handle both old and new Stripe API versions
  // In newer Stripe API versions (2025+), invoice.payment_intent has been removed.
  // The PaymentIntent is still created but must be retrieved via the customer.
  const invoice = subscription.latest_invoice;
  let paymentIntent = null;

  // Strategy 1: Try the legacy invoice.payment_intent field (older API versions)
  if (invoice && typeof invoice === "object" && invoice.payment_intent) {
    paymentIntent = invoice.payment_intent;
    console.log("[Stripe Prepare] Found payment_intent on invoice (legacy API):", {
      type: typeof paymentIntent,
      id: typeof paymentIntent === "object" ? paymentIntent?.id : paymentIntent,
    });
  } else if (typeof invoice === "string") {
    // Invoice was not expanded — try fetching it
    console.log("[Stripe Prepare] Invoice not expanded, fetching:", invoice);
    const fullInvoice = await stripe.invoices.retrieve(invoice, {
      expand: ["payment_intent"],
    });
    if (fullInvoice.payment_intent) {
      paymentIntent = fullInvoice.payment_intent;
    }
  }

  // If paymentIntent is a string ID, expand it
  if (typeof paymentIntent === "string") {
    console.log("[Stripe Prepare] Expanding payment intent string ID:", paymentIntent);
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent);
  }

  // Strategy 2: If invoice.payment_intent is gone (new Stripe API 2025+),
  // retrieve the PaymentIntent from the customer's recent payment intents
  if (!paymentIntent || !paymentIntent.client_secret) {
    console.log("[Stripe Prepare] invoice.payment_intent not available (new Stripe API). Searching customer PaymentIntents...");
    
    const customerPaymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 5,
    });

    // Find the PaymentIntent that matches this subscription's invoice amount
    const invoiceAmount = typeof invoice === "object" ? invoice.amount_due : null;
    
    // Prefer the most recent PI with status requires_payment_method
    paymentIntent = customerPaymentIntents.data.find(
      (pi) => pi.status === "requires_payment_method" && 
              (invoiceAmount === null || pi.amount === invoiceAmount)
    ) || customerPaymentIntents.data[0];

    if (paymentIntent) {
      console.log("[Stripe Prepare] Found PaymentIntent via customer lookup:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        client_secret: paymentIntent.client_secret ? "Present" : "MISSING",
      });
    }
  }

  if (!paymentIntent || !paymentIntent.client_secret) {
    console.error("[Stripe Prepare] FAILED — no payment intent found by any method.", {
      subscription_id: subscription.id,
      subscription_status: subscription.status,
      invoice_type: typeof invoice,
      invoice_amount_due:
        typeof invoice === "object" ? invoice?.amount_due : "N/A",
    });
    throw new AppError(
      "Stripe did not return a payment intent. The subscription was created but payment could not be initialized.",
      500,
    );
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2024-06-20" },
  );

  applySubscriptionState(user, subscription);
  await user.save();

  console.log("[Stripe Prepare] SUCCESS — returning client secret.");

  return {
    alreadySubscribed: false,
    customerId,
    subscriptionId: subscription.id,
    ephemeralKey: ephemeralKey.secret,
    clientSecret: paymentIntent.client_secret,
    publishableKey: getPublishableKey(),
    returnUrl: "smartshelf://stripe-redirect",
  };
};


export const confirmSubscriptionService = async (userId, subscriptionId) => {
  if (!subscriptionId) {
    throw new AppError("Subscription ID is required", 400);
  }

  const stripe = getStripeClient();
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Retrieve the subscription, expanding the latest invoice and its payment_intent
  let subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice"],
  });

  if (String(subscription.metadata?.userId || "") !== String(user._id)) {
    throw new AppError("Subscription does not belong to this user", 403);
  }

  console.log("[Stripe Confirm] Subscription status:", subscription.status);

  // Handle the race condition: presentPaymentSheet() completes before Stripe
  // transitions the subscription from 'incomplete' → 'active'.
  // We check the payment intent status directly to confirm payment succeeded.
  if (subscription.status === "incomplete") {
    const invoice = subscription.latest_invoice;
    let paymentSucceeded = false;

    // Strategy 1: Check invoice.payment_intent if present (legacy Stripe API)
    if (invoice && typeof invoice === "object" && invoice.payment_intent) {
      const pi = typeof invoice.payment_intent === "string"
        ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
        : invoice.payment_intent;
      console.log("[Stripe Confirm] PaymentIntent status (from invoice):", pi.status);
      paymentSucceeded = pi.status === "succeeded";
    }

    // Strategy 2: New Stripe API — find PaymentIntent via customer (no invoice.payment_intent)
    if (!paymentSucceeded) {
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      const customerPIs = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 5,
      });

      const invoiceAmount = typeof invoice === "object" ? invoice?.amount_due : null;
      const matchedPI = customerPIs.data.find(
        (pi) =>
          pi.status === "succeeded" &&
          (invoiceAmount === null || pi.amount === invoiceAmount)
      );

      if (matchedPI) {
        console.log("[Stripe Confirm] PaymentIntent succeeded (via customer lookup):", matchedPI.id);
        paymentSucceeded = true;
      } else {
        console.log("[Stripe Confirm] Customer PIs:", customerPIs.data.map(pi => ({
          id: pi.id, status: pi.status, amount: pi.amount
        })));
      }
    }

    if (paymentSucceeded) {
      // Payment went through — manually activate subscription state.
      // The Stripe webhook will eventually sync the real subscription.status.
      console.log("[Stripe Confirm] Payment confirmed — force-activating subscription state.");

      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback: +30 days

      user.stripe = {
        customerId: typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id || user?.stripe?.customerId || "",
        subscriptionId: subscription.id,
        status: "active",
        currentPeriodEnd,
      };
      user.isSubscribed = true;
      user.subscriptionExpiry = currentPeriodEnd;
      await user.save();

      console.log("[Stripe Confirm] User saved as subscribed. Expiry:", currentPeriodEnd);
    } else {
      // Payment genuinely not yet completed — apply whatever Stripe says
      console.log("[Stripe Confirm] Payment not confirmed yet, applying current subscription state.");
      applySubscriptionState(user, subscription);
      await user.save();
    }
  } else {
    // Subscription is already active/trialing/etc — apply normally
    applySubscriptionState(user, subscription);
    await user.save();
    console.log("[Stripe Confirm] Applied subscription state:", subscription.status);
  }

  return {
    isSubscribed: user.isSubscribed,
    subscriptionExpiry: user.subscriptionExpiry,
    status: user?.stripe?.status || "",
  };
};


export const createPortalSessionService = async (userId) => {
  const stripe = getStripeClient();
  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const customerId = await getOrCreateCustomer(user);
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: process.env.STRIPE_PORTAL_RETURN_URL || "smartshelf://settings",
  });

  return { url: portalSession.url };
};

export const handleStripeWebhookService = async (signature, rawBody) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError("Stripe webhook secret is not configured", 500);
  }

  const stripe = getStripeClient();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    throw new AppError(`Webhook Error: ${error.message}`, 400);
  }

  const syncSubscription = async (subscriptionLike) => {
    const customerId = subscriptionLike?.customer
      ? String(subscriptionLike.customer)
      : "";
    if (!customerId) {
      return;
    }

    const user = await userModel.findOne({ "stripe.customerId": customerId });
    if (!user) {
      return;
    }

    applySubscriptionState(user, subscriptionLike);
    await user.save();
  };

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      if (event.data.object.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          event.data.object.subscription,
        );
        await syncSubscription(subscription);
      }
      break;
    default:
      break;
  }

  return { received: true };
};
