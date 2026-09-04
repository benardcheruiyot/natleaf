import React from 'react';
import PropTypes from 'prop-types';
import styles from './cart-summary.module.css';
import { Link } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import { formatUsdCents } from '../utils/currency';

export default function CartSummary({
  cartItems,
  total,
  onUpdateQuantity,
  onClear,
  onCheckout,
  message,
  isPlacingOrder,
}) {
  if (!cartItems.length) {
    return (
      <section className={styles.cartSummary}>
        <div className={styles.empty}>Your cart is currently empty.</div>
        <Link to="/" className={styles.returnShopLink}>
          Return to shop
        </Link>
        {message && (
          <div className={styles.checkoutMessage} role="status" aria-live="polite">
            {message}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={styles.cartSummary}>
      <div className={styles.headerRow}>
        <h3>Cart</h3>
        <button type="button" className={styles.clearButton} onClick={onClear}>
          Clear cart
        </button>
      </div>

      <div className={styles.cartTableWrap}>
        <table className={styles.cartTable}>
          <thead>
            <tr>
              <th aria-label="Remove item">Remove item</th>
              <th aria-label="Thumbnail image">Thumbnail image</th>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <button
                    className={styles.removeIcon}
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, 0)}
                    aria-label={`Remove ${item.title}`}
                  >
                    ×
                  </button>
                </td>
                <td>
                  {item.image ? (
                    <ImageWithFallback
                      className={styles.productThumb}
                      src={item.image}
                      alt={item.title}
                    />
                  ) : (
                    <div className={styles.thumbPlaceholder} aria-hidden="true" />
                  )}
                </td>
                <td className={styles.itemTitle}>{item.title}</td>
                <td>{formatUsdCents(item.price_cents || 0)}</td>
                <td>
                  <div className={styles.quantityControls}>
                    <button
                      type="button"
                      className={styles.quantityButton}
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Decrease ${item.title} quantity`}
                    >
                      -
                    </button>
                    <span className={styles.quantityValue}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.quantityButton}
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Increase ${item.title} quantity`}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{formatUsdCents((item.price_cents || 0) * item.quantity)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} className={styles.couponRow}>
                <input
                  className={styles.couponInput}
                  type="text"
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                />
                <button type="button" className={styles.couponButton}>
                  Apply coupon
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.cartTotals}>
        <h4>Cart totals</h4>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span>{formatUsdCents(total || 0)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Total</span>
          <strong>{formatUsdCents(total || 0)}</strong>
        </div>
        <button type="button" className={styles.checkoutButton} onClick={onCheckout} disabled={isPlacingOrder}>
          {isPlacingOrder ? 'Processing order...' : 'Proceed to checkout'}
        </button>
      </div>

      {message && (
        <div className={styles.checkoutMessage} role="status" aria-live="polite">
          {message}
        </div>
      )}
    </section>
  );
}

CartSummary.propTypes = {
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      price_cents: PropTypes.number.isRequired,
      image: PropTypes.string,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
  total: PropTypes.number.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
  message: PropTypes.string,
  isPlacingOrder: PropTypes.bool,
};
