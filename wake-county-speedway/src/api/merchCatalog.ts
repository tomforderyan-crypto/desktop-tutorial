export interface MerchProduct {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  imageUrl: string;
  sizes?: string[];
  category: 'apparel' | 'accessories' | 'collectibles';
}

const USE_MOCK = true;

const mockProducts: MerchProduct[] = [
  {
    id: 'tee-track-logo',
    name: 'Track Logo Tee',
    description: 'Soft cotton tee with the Wake County Speedway checkered logo.',
    priceUsd: 24,
    imageUrl: 'https://placehold.co/500x500/16181d/f5f5f5?text=Track+Tee',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'apparel',
  },
  {
    id: 'hoodie-victory-lane',
    name: 'Victory Lane Hoodie',
    description: 'Heavyweight pullover hoodie, embroidered front logo.',
    priceUsd: 48,
    imageUrl: 'https://placehold.co/500x500/16181d/f5f5f5?text=Hoodie',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'apparel',
  },
  {
    id: 'hat-snapback',
    name: 'Speedway Snapback',
    description: 'Adjustable snapback cap, embroidered No. 1 fan patch.',
    priceUsd: 22,
    imageUrl: 'https://placehold.co/500x500/16181d/f5f5f5?text=Hat',
    category: 'accessories',
  },
  {
    id: 'koozie-checkered',
    name: 'Checkered Flag Koozie',
    description: 'Insulated can koozie with checkered flag print.',
    priceUsd: 8,
    imageUrl: 'https://placehold.co/500x500/16181d/f5f5f5?text=Koozie',
    category: 'accessories',
  },
  {
    id: 'diecast-champion',
    name: "Champion's Car Diecast (1:24)",
    description: "Collectible diecast replica of last season's champion car.",
    priceUsd: 35,
    imageUrl: 'https://placehold.co/500x500/16181d/f5f5f5?text=Diecast',
    category: 'collectibles',
  },
];

/** Real integration point: a commerce backend / product feed behind the CMS. */
export async function getMerchCatalog(): Promise<MerchProduct[]> {
  if (USE_MOCK) return mockProducts;
  return [];
}
