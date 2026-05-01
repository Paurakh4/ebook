import * as WebBrowser from "expo-web-browser";
import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/api";

export const getStripeConfig = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.STRIPE_CONFIG);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load Stripe config",
    };
  }
};

export const prepareStripeSubscription = async () => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.STRIPE_SUBSCRIPTION_PREPARE);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to prepare Stripe subscription",
    };
  }
};

export const confirmStripeSubscription = async (subscriptionId: string) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.STRIPE_SUBSCRIPTION_CONFIRM, {
      subscriptionId,
    });
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to confirm Stripe subscription",
    };
  }
};

export const createStripePortalSession = async () => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.STRIPE_PORTAL);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to open billing portal",
    };
  }
};

export const openBillingPortal = async () => {
  const portalRes = await createStripePortalSession();
  if (!portalRes.success || !portalRes.data?.url) {
    return portalRes;
  }

  try {
    await WebBrowser.openBrowserAsync(portalRes.data.url);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: "Could not open billing portal in browser",
    };
  }
};

