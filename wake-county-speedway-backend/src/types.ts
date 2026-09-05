export interface BannerAd {
  id: string;
  imageUrl: string;
  headline: string;
  linkUrl?: string;
  startsIso?: string;
  endsIso?: string;
}

export interface FoodVendor {
  id: string;
  name: string;
  description: string;
  menuUrl?: string;
  photoUrl?: string;
}

export interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram';
  handle: string;
  displayName: string;
}

export interface OrderLine {
  productId: string;
  name: string;
  size?: string;
  quantity: number;
  unitPriceUsd: number;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface Order {
  id: string;
  lines: OrderLine[];
  totalUsd: number;
  address: ShippingAddress;
  status: 'pending' | 'paid' | 'failed';
  stripePaymentIntentId: string;
  createdIso: string;
  updatedIso: string;
}
