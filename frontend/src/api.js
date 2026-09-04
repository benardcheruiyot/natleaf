import axios from 'axios';

const apiOrigin = String(import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');
const API_BASE_PATH = apiOrigin ? `${apiOrigin}/api` : '/api';
const IMAGE_PROXY_BASE = apiOrigin ? `${apiOrigin}/api/image` : '/api/image';

const API = axios.create({ baseURL: API_BASE_PATH });

export async function listProducts(q = '') {
  const response = await API.get('/products', { params: { q } });
  return response.data;
}

export async function getProduct(id) {
  const response = await API.get(`/products/${id}`);
  return response.data;
}

export async function createOrder(payload) {
  const response = await API.post('/orders', payload);
  return response.data;
}

export function getImageUrl(src = '') {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) {
    return `${IMAGE_PROXY_BASE}?url=${encodeURIComponent(src)}`;
  }

  const normalizedSrc = String(src).trim();
  if (normalizedSrc.startsWith('/')) {
    const basePath = import.meta.env.BASE_URL || '/';
    return `${basePath.replace(/\/$/, '')}${normalizedSrc}`;
  }

  return normalizedSrc;
}
