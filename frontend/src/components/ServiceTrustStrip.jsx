import React from 'react';

export default function ServiceTrustStrip() {
  return (
    <section className="trustStrip" aria-label="Store policies">
      <article className="trustCard">
        <span className="trustIcon" aria-hidden="true">
          ⌖
        </span>
        <div className="trustTextWrap">
          <strong>same day Delivery</strong>
          <span>On all orders</span>
        </div>
      </article>
      <article className="trustCard">
        <span className="trustIcon" aria-hidden="true">
          ⇄
        </span>
        <div className="trustTextWrap">
          <strong>Easy 30 days returns</strong>
          <span>30 days money back guarantee</span>
        </div>
      </article>
      <article className="trustCard">
        <span className="trustIcon" aria-hidden="true">
          ◍
        </span>
        <div className="trustTextWrap">
          <strong>International Warranty</strong>
          <span>Offered in the country of usage</span>
        </div>
      </article>
      <article className="trustCard">
        <span className="trustIcon" aria-hidden="true">
          ⌂
        </span>
        <div className="trustTextWrap">
          <strong>100% Secure Checkout</strong>
          <span>PayPal / MasterCard / Visa</span>
        </div>
      </article>
    </section>
  );
}
