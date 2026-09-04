import React from 'react';
import styles from './site-footer.module.css';

export default function SiteFooter() {
  return (
    <footer className={styles.footer} aria-label="Site footer">
      <div className={styles.footerTop}>
        <div className={styles.footerHouse}>
          <p className={styles.footerTagline}>Premium cannabis delivery with secure checkout and fast service.</p>
        </div>
        <div className={styles.footerTrust}>
          <span>Trusted, discreet delivery across the United States.</span>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <div className={styles.copyright}>© Greenline Wellness 2026</div>
        <div className={styles.paymentRow} aria-label="Accepted payment methods">
          <img
            src="/images/credit-cards.png"
            alt="Accepted cards: Visa, MasterCard, Maestro, PayPal, Discover"
            className={styles.paymentLogosImage}
            loading="lazy"
          />
        </div>
      </div>
    </footer>
  );
}
