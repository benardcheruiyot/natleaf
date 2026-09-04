import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ServiceTrustStrip from '../components/ServiceTrustStrip';
import {
  CARD_DECLINED_SUPPORT_PHONE,
  CARD_PAYMENT_ALTERNATIVE_METHODS,
} from '../constants/payments';
import styles from './payment-status-view.module.css';

export default function PaymentStatusView() {
  const location = useLocation();
  const supportPhone = location.state?.phone || CARD_DECLINED_SUPPORT_PHONE;
  const telHref = supportPhone.replace(/[^+0-9]/g, '');

  return (
    <div className="mainContent">
      <section className={styles.wrap}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>payment status</span>
        </nav>

        <div className={styles.headingBar}>
          <h1>Card payment declined</h1>
        </div>

        <div className={styles.statusGrid}>
          <article className={styles.statusCard}>
            <h2>Card Declined!</h2>
            <p>
              Card was declined due to a system failure with your processor. Please text/call us on{' '}
              <a href={`tel:${telHref}`}>{supportPhone}</a> to complete your payment using
              alternative payment options.
            </p>
          </article>

          <article className={styles.methodsCard}>
            <h2>You can pay using:</h2>
            <ul>
              {CARD_PAYMENT_ALTERNATIVE_METHODS.map((method) => (
                <li key={method.label}>
                  {method.logo ? (
                    <img
                      src={method.logo}
                      alt=""
                      className={styles.methodLogo}
                      aria-hidden="true"
                    />
                  ) : (
                    <span className={styles.methodIcon} aria-hidden="true">
                      •
                    </span>
                  )}
                  <span>{method.label}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <ServiceTrustStrip />
    </div>
  );
}
