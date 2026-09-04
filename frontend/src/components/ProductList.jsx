import React from 'react';
import PropTypes from 'prop-types';
import ProductCard from './ProductCard';
import styles from './product-list.module.css';

export default function ProductList({ products, onSelect, onAddToCart }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={() => onSelect(product)}
          onAddToCart={() => onAddToCart(product)}
        />
      ))}
    </div>
  );
}

ProductList.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      price_cents: PropTypes.number.isRequired,
      images: PropTypes.arrayOf(PropTypes.string),
      categories: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
};
