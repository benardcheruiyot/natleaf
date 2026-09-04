import React from 'react';
import CheckoutPage from '../components/CheckoutPage';
import ServiceTrustStrip from '../components/ServiceTrustStrip';

export default function CheckoutView({ cartItems, total, onPlaceOrder, onCancel, isPlacingOrder }) {
  return (
    <div className="mainContent">
      <div className="productPane">
        <CheckoutPage
          cartItems={cartItems}
          total={total}
          onPlaceOrder={onPlaceOrder}
          onCancel={onCancel}
          isPlacingOrder={isPlacingOrder}
        />
        <ServiceTrustStrip />
      </div>
    </div>
  );
}
