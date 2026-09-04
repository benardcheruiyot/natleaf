import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE_PRODUCTS_API = 'https://www.greenstoneretail.shop/wp-json/wc/store/v1/products';
const WP_PRODUCT_CATEGORIES_API =
  'https://www.greenstoneretail.shop/wp-json/wp/v2/product_cat?per_page=100';
const DEFAULT_PRODUCT_IMAGE = '/images/placeholder.svg';

const MENU_CATEGORIES = [
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

function decodeHtml(value = '') {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8211;|&ndash;/gi, '-')
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/&#8220;|&#8221;|&quot;/gi, '"')
    .replace(/&#038;/gi, '&');
}

function stripHtml(value = '') {
  return decodeHtml(String(value).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizeCategoryName(value = '') {
  return decodeHtml(value).trim().toLowerCase();
}

function toProductShape(product) {
  const imageList = Array.isArray(product.images) ? product.images : [];
  const categoryList = Array.isArray(product.categories) ? product.categories : [];
  const tagList = Array.isArray(product.tags) ? product.tags : [];
  const priceMinorUnits = Number.parseInt(product?.prices?.price ?? '0', 10);
  const title = decodeHtml(product.name || '').trim();
  const normalizedCategories = [
    ...new Set(categoryList.map((category) => decodeHtml(category?.name || '').trim()).filter(Boolean)),
  ];
  const cleanedDescription = stripHtml(product.short_description || product.description || '');
  const fallbackDescription = `${title || 'Product'} from Green Rise Cannabis Delivery. Category: ${
    normalizedCategories[0] || 'Cannabis'
  }.`;
  const normalizedImages = imageList.map((image) => image?.src).filter(Boolean);

  return {
    id: String(product.id),
    title,
    description: cleanedDescription || fallbackDescription,
    price_cents: Number.isFinite(priceMinorUnits) ? priceMinorUnits : 0,
    currency: product?.prices?.currency_code || 'USD',
    sku: product.sku || '',
    inventory: product.is_in_stock ? 25 : 0,
    weight_grams: null,
    tags: [...new Set(tagList.map((tag) => decodeHtml(tag?.name || '').trim()).filter(Boolean))],
    categories: normalizedCategories,
    images: normalizedImages.length ? normalizedImages : [DEFAULT_PRODUCT_IMAGE],
    variants: [],
    attributes: {
      source_type: product.type || 'simple',
      on_sale: Boolean(product.on_sale),
      average_rating: product.average_rating || '0',
    },
    metadata: {
      source: 'greenstoneretail.shop',
      source_id: product.id,
      slug: product.slug || '',
      permalink: product.permalink || '',
    },
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function fetchAllCategoryTaxonomy() {
  const firstUrl = `${WP_PRODUCT_CATEGORIES_API}&page=1`;
  const firstResponse = await fetch(firstUrl);
  if (!firstResponse.ok) {
    throw new Error(`Failed to fetch product categories: ${firstResponse.status}`);
  }

  const totalPages = Number.parseInt(firstResponse.headers.get('x-wp-totalpages') || '1', 10);
  const firstPageData = await firstResponse.json();
  const pages = [firstPageData];

  for (let page = 2; page <= totalPages; page += 1) {
    pages.push(await fetchJson(`${WP_PRODUCT_CATEGORIES_API}&page=${page}`));
  }

  return pages.flat();
}

async function fetchProductsForCategoryId(categoryId) {
  const perPage = 100;
  let page = 1;
  const all = [];

  while (true) {
    const url = `${STORE_PRODUCTS_API}?category=${categoryId}&per_page=${perPage}&page=${page}`;
    const batch = await fetchJson(url);
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }
    all.push(...batch);
    if (batch.length < perPage) {
      break;
    }
    page += 1;
  }

  return all;
}

async function main() {
  const taxonomy = await fetchAllCategoryTaxonomy();
  const categoryByName = new Map(
    taxonomy.map((entry) => [normalizeCategoryName(entry?.name || ''), entry]).filter(([key]) => key)
  );

  const menuCategoryEntries = MENU_CATEGORIES.map((label) => {
    const match = categoryByName.get(normalizeCategoryName(label));
    return { label, id: match?.id ?? null };
  });

  const missingCategories = menuCategoryEntries.filter((entry) => !entry.id).map((entry) => entry.label);
  const matchedCategoryIds = [...new Set(menuCategoryEntries.map((entry) => entry.id).filter(Boolean))];

  const rawProductsById = new Map();
  for (const categoryId of matchedCategoryIds) {
    const products = await fetchProductsForCategoryId(categoryId);
    for (const product of products) {
      rawProductsById.set(product.id, product);
    }
  }

  const normalizedProducts = [...rawProductsById.values()]
    .map(toProductShape)
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputFilePath = path.resolve(__dirname, '..', 'backend', 'data', 'products.json');

  await writeFile(outputFilePath, `${JSON.stringify(normalizedProducts, null, 2)}\n`, 'utf8');

  console.log(`Synced ${normalizedProducts.length} products into backend/data/products.json`);
  if (missingCategories.length) {
    console.log(`Categories with no taxonomy match on source: ${missingCategories.join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
