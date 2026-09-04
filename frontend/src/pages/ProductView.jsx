import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getProduct, listProducts } from '../api';
import ProductPage from '../components/ProductPage';
import styles from '../components/product-page.module.css';

export default function ProductView({ onAddToCart }) {
  const { id } = useParams();
  const location = useLocation();
  const initialProduct = location.state?.product || null;
  const [product, setProduct] = useState(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    setIsLoading(true);
    setLoadError('');

    getProduct(id)
      .then((p) => {
        if (!mounted) return;
        setProduct(p);
      })
      .catch(() => {
        if (!mounted) return;
        if (!initialProduct) {
          setProduct(null);
        }
        setLoadError('Unable to load the product. Please refresh or try again later.');
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, initialProduct]);

  useEffect(() => {
    let mounted = true;
    if (!product?.id) {
      setRelatedProducts([]);
      return () => {
        mounted = false;
      };
    }

    const categories = (product.categories || []).map((category) => String(category).toLowerCase());

    listProducts()
      .then((items) => {
        if (!mounted) return;
        const related = items
          .filter((item) => String(item.id) !== String(product.id))
          .filter((item) =>
            (item.categories || []).some((category) =>
              categories.includes(String(category).toLowerCase())
            )
          )
          .slice(0, 4);
        setRelatedProducts(related);
      })
      .catch(() => {
        if (mounted) {
          setRelatedProducts([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [product]);

  if (!product) {
    return (
      <div className={styles.page}>
        <div className={styles.breadcrumbs} aria-hidden="true">
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLine} />
        </div>
        <div className={styles.productMain}>
          <div className={styles.skeletonImage} />
          <div className={styles.productInfo}>
            <span className={styles.skeletonTitle} />
            <span className={styles.skeletonText} />
            <span className={styles.skeletonText} />
            <span className={styles.skeletonTextShort} />
            <span className={styles.skeletonButton} />
          </div>
        </div>
        {loadError ? <div className={styles.skeletonError}>{loadError}</div> : null}
      </div>
    );
  }

  return (
    <ProductPage
      product={product}
      relatedProducts={relatedProducts}
      onBack={() => navigate(-1)}
      onAddToCart={onAddToCart}
    />
  );
}
