import { readJson } from './jsonStore';
import seedProducts from '../data/products.seed.json';

/**
 * Authoritative prices for checkout total calculation, kept separate from
 * whatever the client sends — a checkout endpoint that trusts a
 * client-supplied price lets anyone pay $0.01 for a hoodie. This list must
 * currently be kept in sync BY HAND with wake-county-speedway/src/api/merchCatalog.ts;
 * unifying the two into one product source (this backend serving the app's
 * catalog too) is the natural next step once this needs to scale past a
 * handful of SKUs.
 */
export interface PricedProduct {
  id: string;
  name: string;
  priceUsd: number;
}

export async function getProductPricing(): Promise<PricedProduct[]> {
  return readJson<PricedProduct[]>('products', seedProducts as PricedProduct[]);
}

export async function priceLookup(): Promise<Map<string, PricedProduct>> {
  const products = await getProductPricing();
  return new Map(products.map((p) => [p.id, p]));
}
