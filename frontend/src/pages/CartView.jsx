import React from 'react';
import CartSummary from '../components/CartSummary';
import ServiceTrustStrip from '../components/ServiceTrustStrip';

export default function CartView({
  cartItems,
  total,
  onUpdateQuantity,
  onClear,
  onCheckout,
  message,
  isPlacingOrder,
}) {
  return (
    <div className="mainContent">
      <div className="contentGrid">
        <div className="productPane">
          <section className="productSection">
            <div className="sectionHeader">
              <div>
                <h2>Cart</h2>
              </div>
            </div>
          </section>
          <CartSummary
            cartItems={cartItems}
            total={total}
            onUpdateQuantity={onUpdateQuantity}
            onClear={onClear}
            onCheckout={onCheckout}
            message={message}
            isPlacingOrder={isPlacingOrder}
          />
          <ServiceTrustStrip />
        </div>
      </div>
    </div>
  );
}
