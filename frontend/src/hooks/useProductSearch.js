import { useState, useCallback } from 'react';
import { listProducts } from '../api';

export default function useProductSearch() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);

    try {
      setProducts(await listProducts(query));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, search };
}
