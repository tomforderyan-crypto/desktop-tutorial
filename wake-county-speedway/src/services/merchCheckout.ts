/**
 * App Store policy note (Guideline 3.1.5(a)): physical goods and services
 * purchased and consumed outside the app are explicitly EXEMPT from
 * Apple's in-app purchase requirement — and Apple does not allow StoreKit
 * to be used for a shipped physical good in the first place. Every item in
 * the merch catalog (tees, hats, diecast, etc.) is a physical, shipped
 * good, so checkout here MUST go through an external payment processor,
 * never react-native-iap/StoreKit.
 *
 * This is a thin mock over that external processor (e.g. Stripe or
 * Shopify's Storefront API + Payment Intents) so the UI flow is real; wire
 * `processCardPayment` to that processor's client SDK once one is chosen.
 * Only the flat monthly subscription (services/subscription.ts) is digital
 * content unlocked inside the app, so only that one uses StoreKit.
 */
export interface ShippingAddress {
  fullName: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface CheckoutResult {
  success: boolean;
  orderId: string;
}

export async function processMerchCheckout(
  totalUsd: number,
  address: ShippingAddress
): Promise<CheckoutResult> {
  // TODO: replace with a real external processor call (Stripe PaymentIntent,
  // Shopify checkout, etc.) — this app never handles raw card numbers.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    success: true,
    orderId: `WCS-${Date.now().toString(36).toUpperCase()}`,
  };
}
