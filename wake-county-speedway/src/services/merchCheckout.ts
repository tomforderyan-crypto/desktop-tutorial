import { CMS_BASE_URL } from '../api/cms';
import type { CartLine } from '../context/CartContext';

/**
 * App Store policy note (Guideline 3.1.5(a)): physical goods and services
 * purchased and consumed outside the app are explicitly EXEMPT from
 * Apple's in-app purchase requirement — and Apple does not allow StoreKit
 * to be used for a shipped physical good in the first place. Every item in
 * the merch catalog (tees, hats, diecast, etc.) is a physical, shipped
 * good, so checkout here goes through Stripe, never react-native-iap/
 * StoreKit. Only the flat monthly subscription (services/subscription.ts)
 * is digital content unlocked inside the app, so only that one uses
 * StoreKit.
 *
 * Real checkout needs the backend in wake-county-speedway-backend/ (it
 * holds the Stripe secret key and is the source of truth for prices — see
 * its README). Without EXPO_PUBLIC_CMS_BASE_URL configured, checkout falls
 * back to a mock success so the UI flow can still be demoed end to end.
 */
export const STRIPE_CHECKOUT_CONFIGURED = Boolean(CMS_BASE_URL);

export interface ShippingAddress {
  fullName: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  orderId: string;
  totalUsd: number;
}

export async function createMerchPaymentIntent(
  lines: CartLine[],
  address: ShippingAddress
): Promise<PaymentIntentResponse> {
  const res = await fetch(`${CMS_BASE_URL}/checkout/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lines: lines.map((l) => ({ productId: l.product.id, size: l.size, quantity: l.quantity })),
      address,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Checkout failed: ${res.status}`);
  }
  return res.json();
}

export interface MockCheckoutResult {
  success: boolean;
  orderId: string;
}

/** Used only when no backend is configured — see STRIPE_CHECKOUT_CONFIGURED above. */
export async function mockMerchCheckout(): Promise<MockCheckoutResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true, orderId: `WCS-MOCK-${Date.now().toString(36).toUpperCase()}` };
}
