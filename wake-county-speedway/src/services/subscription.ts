/**
 * The flat monthly subscription (replacing the old pay-per-view model) is
 * digital content consumed inside the app — premium livestream access —
 * so per Apple Guideline 3.1.1 it MUST go through Apple's in-app purchase
 * (StoreKit), via react-native-iap. Do not route this through an external
 * payment processor; that would fail App Review.
 *
 * react-native-iap needs a native build (EAS Build / bare workflow) and a
 * subscription group configured in App Store Connect, both blocked until
 * the pending Apple Developer enrollment clears. This module is written
 * against react-native-iap's real API so it's ready to wire in once that
 * enrollment and the subscription product ("wcs_monthly_fan_pass") exist;
 * until then USE_MOCK keeps the app runnable and testable end to end.
 */
import { Platform } from 'react-native';

export const MONTHLY_SUBSCRIPTION_SKU = 'wcs_monthly_fan_pass';

const USE_MOCK = true;

export interface SubscriptionStatus {
  isActive: boolean;
  productId: string | null;
  expiresIso: string | null;
}

let mockActive = false;

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (USE_MOCK) {
    return {
      isActive: mockActive,
      productId: mockActive ? MONTHLY_SUBSCRIPTION_SKU : null,
      expiresIso: mockActive ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() : null,
    };
  }

  const RNIap = require('react-native-iap');
  const purchases = await RNIap.getAvailablePurchases();
  const active = purchases.find((p: { productId: string }) => p.productId === MONTHLY_SUBSCRIPTION_SKU);
  return {
    isActive: Boolean(active),
    productId: active?.productId ?? null,
    expiresIso: null, // Derive from server-side receipt validation in production.
  };
}

export async function purchaseMonthlySubscription(): Promise<SubscriptionStatus> {
  if (Platform.OS !== 'ios') {
    throw new Error('Subscriptions are only available on iOS in this build.');
  }

  if (USE_MOCK) {
    mockActive = true;
    return getSubscriptionStatus();
  }

  const RNIap = require('react-native-iap');
  await RNIap.initConnection();
  try {
    await RNIap.requestSubscription({ sku: MONTHLY_SUBSCRIPTION_SKU });
    // In production: verify the receipt against Apple's server (via your
    // own backend) before unlocking content, then call finishTransaction.
  } finally {
    await RNIap.endConnection();
  }
  return getSubscriptionStatus();
}
