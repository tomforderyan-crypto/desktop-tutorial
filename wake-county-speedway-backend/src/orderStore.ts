import { randomUUID } from 'crypto';
import { readJson, writeJson } from './jsonStore';
import type { Order } from './types';

async function getOrders(): Promise<Order[]> {
  return readJson<Order[]>('orders', []);
}

export async function createOrder(input: Omit<Order, 'id' | 'createdIso' | 'updatedIso'>): Promise<Order> {
  const orders = await getOrders();
  const now = new Date().toISOString();
  const order: Order = { ...input, id: `WCS-${randomUUID().slice(0, 8).toUpperCase()}`, createdIso: now, updatedIso: now };
  orders.push(order);
  await writeJson('orders', orders);
  return order;
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id);
}

export async function updateOrderStatusByPaymentIntent(
  stripePaymentIntentId: string,
  status: Order['status']
): Promise<Order | undefined> {
  const orders = await getOrders();
  const order = orders.find((o) => o.stripePaymentIntentId === stripePaymentIntentId);
  if (!order) return undefined;
  order.status = status;
  order.updatedIso = new Date().toISOString();
  await writeJson('orders', orders);
  return order;
}
