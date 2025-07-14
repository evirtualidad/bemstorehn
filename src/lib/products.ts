export interface Product {
  id: string;
  name: string;
  image: string;
  aiHint?: string;
  price: number;
  description: string;
  category: 'Skincare' | 'Makeup' | 'Haircare';
}

export const products: Product[] = [
  {
    id: 'prod_001',
    name: 'Glow Serum',
    image: 'https://placehold.co/400x400.png',
    aiHint: 'skincare serum',
    price: 45.00,
    description: 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.',
    category: 'Skincare',
  },
  {
    id: 'prod_002',
    name: 'Hydra-Boost Moisturizer',
    image: 'https://placehold.co/400x400.png',
    aiHint: 'face cream',
    price: 38.50,
    description: 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.',
    category: 'Skincare',
  },
  {
    id: 'prod_003',
    name: 'Velvet Matte Lipstick',
    image: 'https://placehold.co/400x400.png',
    aiHint: 'red lipstick',
    price: 24.00,
    description: 'A long-lasting, highly pigmented matte lipstick in a classic red shade. Enriched with vitamin E.',
    category: 'Makeup',
  },
  {
    id: 'prod_004',
    name: 'Luminous Foundation',
    image: 'https://placehold.co/400x400.png',
    aiHint: 'makeup foundation',
    price: 52.00,
    description: 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.',
    category: 'Makeup',
  },
  {
    id: 'prod_005',
    name: 'Argan Oil Hair Repair',
    image: 'https://placehold.co/400x400.png',
    aiHint: 'hair oil',
    price: 30.00,
    description: 'Nourishing argan oil treatment to tame frizz, add shine, and protect hair from heat damage.',
    category: 'Haircare',
  },
  {
    id: 'prod_006',
    name: 'Volumizing Dry Shampoo',
    image: 'https://placehold.co/400x400.png',
    aiHint: 'hair shampoo',
    price: 22.00,
    description: 'Absorbs oil and adds instant volume and texture, leaving hair feeling fresh and clean.',
    category: 'Haircare',
  },
  {
    id: 'prod_007',
    name: 'Purifying Clay Mask',
    image: 'https://placehold.co/400x400.png',
    aiHint: 'face mask',
    price: 28.00,
    description: 'A deep-cleansing clay mask with activated charcoal to detoxify pores and refine skin texture.',
    category: 'Skincare',
  },
  {
    id: 'prod_008',
    name: 'Waterproof Mascara',
    image: 'https://placehold.co/400x400.png',
    aiHint: 'eye mascara',
    price: 26.00,
    description: 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.',
    category: 'Makeup',
  },
];
