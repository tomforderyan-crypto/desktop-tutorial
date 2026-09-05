import express, { Router } from 'express';
import Stripe from 'stripe';
import { priceLookup } from '../productPricing';
import { createOrder, getOrderById, updateOrderStatusByPaymentIntent } from '../orderStore';
import type { OrderLine, ShippingAddress } from '../types';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return new Stripe(key);
}

export const checkoutRouter = Router();

interface CreatePaymentIntentBody {
  lines: Array<{ productId: string; size?: string; quantity: number }>;
  address: ShippingAddress;
}

/**
 * Merch is a physical, shipped good — this is the external-payment-processor
 * checkout path (Apple Guideline 3.1.5(a) exempts physical goods from IAP,
 * and Apple doesn't allow StoreKit to be used for one anyway). Only the
 * flat monthly Fan Pass subscription goes through StoreKit; see the RN
 * app's services/subscription.ts and README for that half.
 */
checkoutRouter.post('/create-payment-intent', async (req, res) => {
  const body = req.body as CreatePaymentIntentBody;
  if (!Array.isArray(body?.lines) || body.lines.length === 0 || !body?.address) {
    res.status(400).json({ error: 'Request must include non-empty lines[] and an address.' });
    return;
  }

  const prices = await priceLookup();
  const orderLines: OrderLine[] = [];
  let totalUsd = 0;

  for (const line of body.lines) {
    const product = prices.get(line.productId);
    if (!product || !Number.isInteger(line.quantity) || line.quantity < 1) {
      res.status(400).json({ error: `Unknown product or bad quantity for "${line.productId}".` });
      return;
    }
    orderLines.push({
      productId: product.id,
      name: product.name,
      size: line.size,
      quantity: line.quantity,
      unitPriceUsd: product.priceUsd,
    });
    totalUsd += product.priceUsd * line.quantity;
  }

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalUsd * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      shipping: {
        name: body.address.fullName,
        address: {
          line1: body.address.line1,
          city: body.address.city,
          state: body.address.state,
          postal_code: body.address.zip,
          country: 'US',
        },
      },
      description: orderLines.map((l) => `${l.quantity}x ${l.name}${l.size ? ` (${l.size})` : ''}`).join(', '),
    });

    const order = await createOrder({
      lines: orderLines,
      totalUsd,
      address: body.address,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
    });

    res.json({ clientSecret: paymentIntent.client_secret, orderId: order.id, totalUsd });
  } catch (err) {
    console.error('Failed to create payment intent', err);
    res.status(502).json({ error: 'Unable to start checkout with Stripe right now.' });
  }
});

checkoutRouter.get('/orders/:id', async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  res.json(order);
});

/**
 * Mounted separately (before express.json()) in server.ts because Stripe's
 * signature check needs the exact raw request bytes.
 */
export const stripeWebhookRouter = Router();

stripeWebhookRouter.post(
  '/',
  // Applied here rather than globally so every other route still gets
  // normal JSON parsing.
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.header('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
      res.status(500).json({ error: 'Webhook is not configured.' });
      return;
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed', err);
      res.status(400).send('Invalid signature.');
      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await updateOrderStatusByPaymentIntent(intent.id, 'paid');
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await updateOrderStatusByPaymentIntent(intent.id, 'failed');
    }

    res.json({ received: true });
  }
);
