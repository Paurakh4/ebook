const FREE_BOOK_LIMIT = 8;

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export const getFreeBookLimit = () => FREE_BOOK_LIMIT;

export const getSubscriptionSnapshot = (user) => {
  const stripeStatus = user?.stripe?.status || "";
  const expiry = user?.stripe?.currentPeriodEnd || user?.subscriptionExpiry || null;
  const expiryDate = expiry ? new Date(expiry) : null;
  const isActive =
    ACTIVE_SUBSCRIPTION_STATUSES.has(stripeStatus) &&
    expiryDate &&
    expiryDate > new Date();

  return {
    isActive: Boolean(isActive),
    status: stripeStatus,
    expiryDate,
  };
};

export const applySubscriptionState = (user, subscription) => {
  const periodEnd =
    subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;
  const status = subscription?.status || "";
  const isActive =
    ACTIVE_SUBSCRIPTION_STATUSES.has(status) &&
    periodEnd &&
    periodEnd > new Date();

  user.stripe = {
    customerId: subscription?.customer
      ? String(subscription.customer)
      : user?.stripe?.customerId || "",
    subscriptionId: subscription?.id || user?.stripe?.subscriptionId || "",
    status,
    currentPeriodEnd: periodEnd,
  };
  user.isSubscribed = Boolean(isActive);
  user.subscriptionExpiry = isActive ? periodEnd : null;

  return user;
};
