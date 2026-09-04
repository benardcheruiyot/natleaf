import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { formatUsdCents } from '../utils/currency';
import ServiceTrustStrip from '../components/ServiceTrustStrip';
import { CARD_DECLINED_SUPPORT_PHONE } from '../constants/payments';
import styles from './order-received-view.module.css';

function formatOrderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function OrderReceivedView({ lastOrder }) {
  const location = useLocation();
  const { orderNumber } = useParams();
  const order = location.state?.order || lastOrder;

  if (!order || String(order.orderNumber) !== String(orderNumber)) {
    return (
      <div className="mainContent">
        <section className={styles.missingOrder}>
          <h2>Order not found</h2>
          <p>We could not find that order in this session.</p>
          <Link to="/shop" className={styles.returnLink}>
            Return to shop
          </Link>
        </section>
        <ServiceTrustStrip />
      </div>
    );
  }

  const itemRows = order.items || [];
  const formattedDate = formatOrderDate(order.createdAt);
  const fullName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim();
  const cityStateZip = [order.customer?.city, order.customer?.state].filter(Boolean).join(', ');
  const cityStateZipLine =
    `${cityStateZip}${order.customer?.zip ? ` ${order.customer.zip}` : ''}`.trim();

  return (
    <div className="mainContent">
      <section className={styles.wrap}>
        <h1 className={styles.received}>Thank you — your order is confirmed</h1>

        <ul className={styles.metaList}>
          <li>
            Order number: <strong>{order.orderNumber}</strong>
          </li>
          <li>
            Date: <strong>{formattedDate}</strong>
          </li>
          <li>
            Total: <strong>{formatUsdCents(order.total_cents || 0)}</strong>
          </li>
          <li>
            Payment method: <strong>{order.paymentMethod || 'Zelle pay'}</strong>
          </li>
        </ul>

        <p className={styles.paymentHint}>
          {order.paymentHint ||
            `Kindly text/call us on ${CARD_DECLINED_SUPPORT_PHONE} for payment instructions`}
        </p>

        <section className={styles.detailsSection}>
          <h2>Order details</h2>
          <table className={styles.detailsTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/product/${item.id}`}>{item.title}</Link>{' '}
                    <strong>x {item.quantity}</strong>
                  </td>
                  <td>{formatUsdCents((item.price_cents || 0) * (item.quantity || 0))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Subtotal:</th>
                <td>{formatUsdCents(order.total_cents || 0)}</td>
              </tr>
              <tr>
                <th>Payment method:</th>
                <td>{order.paymentMethod || 'Zelle pay'}</td>
              </tr>
              <tr>
                <th>Total:</th>
                <td>
                  <strong>{formatUsdCents(order.total_cents || 0)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className={styles.billingSection}>
          <h2>Billing address</h2>
          <address>
            {fullName ? <p>{fullName}</p> : null}
            {order.customer?.address1 ? <p>{order.customer.address1}</p> : null}
            {order.customer?.address2 ? <p>{order.customer.address2}</p> : null}
            {cityStateZipLine ? <p>{cityStateZipLine}</p> : null}
            {order.customer?.phone ? <p>{order.customer.phone}</p> : null}
            {order.customer?.email ? <p>{order.customer.email}</p> : null}
          </address>
        </section>
      </section>

      <ServiceTrustStrip />
    </div>
  );
}
