export const CATEGORY_NAV_GROUPS = [
  { label: 'Flowers', children: ['Hybrid', 'Indica', 'Sativa'] },
  { label: 'CBD' },
  { label: 'Concentrates' },
  { label: 'Edibles' },
  { label: 'Nerds' },
  { label: 'gummies' },
  { label: 'Hash' },
  { label: 'mixed' },
  { label: 'Prerolls' },
  { label: 'Rolling papers' },
  { label: 'Space Monkey Meds' },
  { label: 'Vape pen' },
  { label: 'Vapes & Disposables', children: ['STIIIIZY'] },
  { label: 'Cartridges' },
  { label: 'Weed Baggies' },
];

export const FOOTER_CATEGORY_LINKS = [
  'Flowers',
  'Hybrid',
  'Indica',
  'Sativa',
  'CBD',
  'Concentrates',
  'Edibles',
  'Nerds',
  'gummies',
  'Hash',
  'mixed',
  'Prerolls',
  'Rolling papers',
  'Space Monkey Meds',
  'Vape pen',
  'Vapes & Disposables',
  'STIIIIZY',
  'Cartridges',
  'Weed Baggies',
];

export const CATEGORY_ALIASES = {
  'vapes &amp; disposables': 'Vapes & Disposables',
};

export const CATEGORY_ROUTE_MAP = {
  Flowers: '/product-category/flowers/',
  Hybrid: '/product-category/hybrid/',
  Indica: '/product-category/indica/',
  Sativa: '/product-category/sativa/',
  CBD: '/product-category/cbd/',
  Concentrates: '/product-category/concentrates/',
  Edibles: '/product-category/edibles/',
  Nerds: '/product-category/edibles/nerds/',
  gummies: '/product-category/gummies/',
  Hash: '/product-category/hash/',
  mixed: '/product-category/mixed/',
  Prerolls: '/product-category/prerolls/',
  'Rolling papers': '/product-category/rolling-papers/',
  'Space Monkey Meds': '/product-category/space-monkey-meds/',
  'Vape pen': '/product-category/vape-pen/',
  'Vapes & Disposables': '/product-category/vapes-disposables/',
  STIIIIZY: '/product-category/stiiiizy/',
  Cartridges: '/product-category/vapes-disposables/cartridges/',
  'Weed Baggies': '/product-category/weed-baggies/',
};

export function getCanonicalCategory(category = '') {
  const trimmed = String(category).trim();
  if (!trimmed) return '';
  const alias = CATEGORY_ALIASES[trimmed.toLowerCase()];
  return alias || trimmed;
}

export function toCategorySlug(label = '') {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function fromCategorySlug(slug = '') {
  const normalized = String(slug).trim().toLowerCase();
  if (!normalized) return '';

  const matched = CATEGORY_NAV_GROUPS.flatMap((group) => [
    group.label,
    ...(group.children || []),
  ]).find((label) => toCategorySlug(label) === normalized);

  return matched || '';
}

export function fromCategoryPath(pathname = '') {
  const normalized = String(pathname).trim().toLowerCase();
  if (!normalized) return '';

  const matched = Object.entries(CATEGORY_ROUTE_MAP)
    .sort((a, b) => b[1].length - a[1].length)
    .find(([, route]) => normalized.startsWith(route.toLowerCase()));

  return matched ? matched[0] : '';
}

export function toCategoryRoute(label = '') {
  return CATEGORY_ROUTE_MAP[label] || '/';
}
