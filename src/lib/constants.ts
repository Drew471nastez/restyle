export const PLATFORM_FEE_RATE = 0.08;
export const PRO_FEE_RATE = 0.03;
export const PRO_MONTHLY_PRICE = 2900; // $29 in cents
export const MIN_PAYOUT_AMOUNT = 500; // 5.00 RON in bani
export const MAX_IMAGES_PER_LISTING = 5;
export const MAX_IMAGE_SIZE_MB = 5;
export const ESCROW_AUTO_RELEASE_HOURS = 48;

export const CONDITIONS = [
  { value: 'new_with_tags', label: 'New with tags' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
] as const;

export const CATEGORIES = [
  {
    slug: 'women',
    label: 'Women',
    subcategories: ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags', 'sportswear'],
  },
  {
    slug: 'men',
    label: 'Men',
    subcategories: ['tops', 'bottoms', 'outerwear', 'shoes', 'accessories', 'bags', 'sportswear'],
  },
  {
    slug: 'kids',
    label: 'Kids',
    subcategories: ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'],
  },
] as const;

export const SIZES = {
  clothing: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  shoes_eu: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  numeric: ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50'],
} as const;

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'completed',
  'disputed',
  'refunded',
  'cancelled',
] as const;

export const SUPPORTED_COUNTRIES = [
  { code: 'RO', name: 'Romania', currency: 'RON' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'PL', name: 'Poland', currency: 'PLN' },
  { code: 'IT', name: 'Italy', currency: 'EUR' },
  { code: 'ES', name: 'Spain', currency: 'EUR' },
] as const;
