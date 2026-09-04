import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './checkout-page.module.css';
import { Link } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import { formatUsdCents } from '../utils/currency';
import { PAYMENT_METHODS } from '../constants/payments';

const CHECKOUT_STORAGE_KEY = 'green-rise-checkout-demo-v1';

function readStoredCheckout() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      firstName: parsed.firstName || '',
      lastName: parsed.lastName || '',
      company: parsed.company || '',
      country: parsed.country || 'United States (US)',
      address1: parsed.address1 || '',
      address2: parsed.address2 || '',
      city: parsed.city || '',
      state: parsed.state || 'New York',
      zip: parsed.zip || '',
      phone: parsed.phone || '',
      email: parsed.email || '',
      notes: parsed.notes || '',
      paymentMethod: parsed.paymentMethod || 'zelle_pay',
      deliveryWindow: parsed.deliveryWindow || '',
      cardNumberMasked: parsed.cardNumberMasked || '',
    };
  } catch {
    return null;
  }
}

function writeStoredCheckout(customer) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const persistableCustomer = {
    firstName: customer.firstName.trim(),
    lastName: customer.lastName.trim(),
    company: customer.company.trim(),
    country: customer.country.trim(),
    address1: customer.address1.trim(),
    address2: customer.address2.trim(),
    city: customer.city.trim(),
    state: customer.state.trim(),
    zip: customer.zip.trim(),
    phone: customer.phone.trim(),
    email: customer.email.trim(),
    notes: customer.notes.trim(),
    paymentMethod: customer.paymentMethod,
    deliveryWindow: customer.deliveryWindow,
  };

  try {
    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(persistableCustomer));
  } catch {
    // ignore storage quota or browser-policy failures for a demo flow
  }
}

const US_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

export default function CheckoutPage({ cartItems, total, onPlaceOrder, onCancel, isPlacingOrder }) {
  const storedCheckout = readStoredCheckout();

  const [customer, setCustomer] = useState({
    firstName: storedCheckout?.firstName || '',
    lastName: storedCheckout?.lastName || '',
    company: storedCheckout?.company || '',
    country: storedCheckout?.country || 'United States (US)',
    address1: storedCheckout?.address1 || '',
    address2: storedCheckout?.address2 || '',
    city: storedCheckout?.city || '',
    state: storedCheckout?.state || 'New York',
    zip: storedCheckout?.zip || '',
    phone: storedCheckout?.phone || '',
    email: storedCheckout?.email || '',
    notes: storedCheckout?.notes || '',
    paymentMethod: storedCheckout?.paymentMethod || 'zelle_pay',
    cardNumber: '',
    cardExpiry: '',
    cardCode: '',
    deliveryWindow: storedCheckout?.deliveryWindow || '',
  });
  const [formError, setFormError] = useState('');
  const [ariaMessage, setAriaMessage] = useState('');
  const [showCardNumber, setShowCardNumber] = useState(true);
  const isCartEmpty = cartItems.length === 0;
  const isFormLocked = isPlacingOrder || isCartEmpty;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormError('');
    let nextValue = type === 'checkbox' ? checked : value;

    // Best-practice: basic input formatting for card fields
    if (name === 'cardNumber') {
      const digits = String(nextValue).replace(/\D/g, '').slice(0, 19);
      // group into 4s for readability
      nextValue = digits.replace(/(.{4})/g, '$1 ').trim();
    }

    if (name === 'cardExpiry') {
      // allow MM/YY formatting
      const digits = String(nextValue).replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) {
        nextValue = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        nextValue = digits;
      }
    }

    if (name === 'cardCode') {
      nextValue = String(nextValue).replace(/\D/g, '').slice(0, 4);
    }

    setCustomer((current) => {
      const nextCustomer = { ...current, [name]: nextValue };
      writeStoredCheckout(nextCustomer);
      return nextCustomer;
    });
  }

  function validate() {
    if (!customer.firstName.trim() || customer.firstName.trim().length < 2) {
      return { field: 'firstName', message: 'Please enter your first name.' };
    }
    if (!customer.lastName.trim() || customer.lastName.trim().length < 2) {
      return { field: 'lastName', message: 'Please enter your last name.' };
    }
    if (!customer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return { field: 'email', message: 'Please enter a valid email address.' };
    }
    if (!customer.phone.trim() || customer.phone.trim().length < 7) {
      return { field: 'phone', message: 'Please enter a valid phone number.' };
    }
    if (!customer.address1.trim() || customer.address1.trim().length < 5) {
      return { field: 'address1', message: 'Please enter your street address.' };
    }
    if (!customer.city.trim()) {
      return { field: 'city', message: 'Please enter your city.' };
    }
    if (!customer.state.trim()) return { field: 'state', message: 'Please select your state.' };
    if (!customer.zip.trim() || customer.zip.trim().length < 4) {
      return { field: 'zip', message: 'Please enter your ZIP/Postal code.' };
    }
    if (customer.paymentMethod === 'card_payment') {
      if (!customer.cardNumber.trim() || customer.cardNumber.replace(/\s+/g, '').length < 12) {
        return { field: 'cardNumber', message: 'Please enter a valid card number.' };
      }
      if (
        !customer.cardExpiry.trim() ||
        !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(customer.cardExpiry.trim())
      ) {
        return { field: 'cardExpiry', message: 'Please enter card expiry as MM/YY.' };
      }
      if (!customer.cardCode.trim() || !/^\d{3,4}$/.test(customer.cardCode.trim())) {
        return { field: 'cardCode', message: 'Please enter a valid card code.' };
      }
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isCartEmpty) {
      setFormError('Your cart is empty. Add products before checking out.');
      return;
    }

    const validation = validate();
    if (validation) {
      setFormError(validation.message);
      // focus the first invalid field for keyboard users
      try {
        const el = document.getElementById(validation.field);
        if (el && typeof el.focus === 'function') el.focus();
      } catch (err) {
        // ignore focus errors
      }
      return;
    }

    const unmaskedCardNumber =
      customer.paymentMethod === 'card_payment' ? customer.cardNumber.replace(/\s+/g, '') : '';
    const last4 = unmaskedCardNumber.slice(-4);
    const maskedCardNumber = last4 ? `************${last4}` : '';
    // const result = await onPlaceOrder({
    //   ...
    //   paymentMethod: customer.paymentMethod,
    //   cardNumber: maskedCardNumber,
    //   cardNumberMasked: maskedCardNumber,
    //   cardExpiry: customer.paymentMethod === 'card_payment' ? customer.cardExpiry.trim() : '',
    // });

    const result = await onPlaceOrder({
      firstName: customer.firstName.trim(),
      lastName: customer.lastName.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      address1: customer.address1.trim(),
      address2: customer.address2.trim(),
      city: customer.city.trim(),
      state: customer.state.trim(),
      zip: customer.zip.trim(),
      country: customer.country.trim(),
      notes: customer.notes.trim(),
      deliveryWindow: customer.deliveryWindow,
      paymentMethod: customer.paymentMethod,
      cardNumberMasked: maskedCardNumber,
      cardExpiry: customer.paymentMethod === 'card_payment' ? customer.cardExpiry.trim() : '',
    });

    if (result && result.ok === false) {
      setFormError(result.error || 'Unable to place your order right now.');
      setAriaMessage('');
      return;
    }

    setFormError('');
    setAriaMessage('Order placed successfully. Preparing confirmation...');
    // clear message after a short delay to avoid stale announcements
    setTimeout(() => setAriaMessage(''), 5000);
  }

  return (
    <section className={styles.checkoutPage}>
      <header className={styles.headerRow}>
        <h1>Checkout</h1>
        <p className={styles.checkoutIntro}>Securely enter delivery details and choose your payment method.</p>
      </header>
      <ol className={styles.checkoutSteps}>
        <li>
          <span>1</span> <Link to="/cart/">Shopping Cart</Link>
        </li>
        <li className={styles.stepActive}>
          <span>2</span> <Link to="/checkout/">Shipping and Checkout</Link>
        </li>
        <li>
          <span>3</span> <span>Confirmation</span>
        </li>
      </ol>

      <div className={styles.checkoutGrid}>
        {isCartEmpty ? (
          <div className={styles.emptyCheckout} role="status">
            <p>Your cart is currently empty.</p>
            <button type="button" className={styles.submitButton} onClick={onCancel}>
              Return to shop
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} aria-busy={isPlacingOrder}>
            <div className={styles.addressColumn}>
              <h3>Delivery Address</h3>

              <p className={styles.fieldRow}>
                <label htmlFor="firstName">First name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  value={customer.firstName}
                  onChange={handleChange}
                  required
                  disabled={isFormLocked}
                />
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="lastName">Last name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={customer.lastName}
                  onChange={handleChange}
                  required
                  disabled={isFormLocked}
                />
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="company">Company name (optional)</label>
                <input
                  id="company"
                  name="company"
                  value={customer.company}
                  onChange={handleChange}
                  disabled={isFormLocked}
                />
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="country">Country / Region *</label>
                <select
                  id="country"
                  name="country"
                  value={customer.country}
                  onChange={handleChange}
                  disabled={isFormLocked}
                >
                  <option value="">Select a country / region...</option>
                  <option value="United States (US)">United States (US)</option>
                </select>
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="address1">Street address *</label>
                <input
                  id="address1"
                  name="address1"
                  value={customer.address1}
                  onChange={handleChange}
                  placeholder="House number and street name"
                  required
                  disabled={isFormLocked}
                />
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="address2">Apartment, suite, unit, etc. (optional)</label>
                <input
                  id="address2"
                  name="address2"
                  value={customer.address2}
                  onChange={handleChange}
                  disabled={isFormLocked}
                />
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="city">Town / City *</label>
                <input
                  id="city"
                  name="city"
                  value={customer.city}
                  onChange={handleChange}
                  required
                  disabled={isFormLocked}
                />
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  name="state"
                  value={customer.state}
                  onChange={handleChange}
                  required
                  disabled={isFormLocked}
                >
                  {US_STATES.map((stateOption) => (
                    <option key={stateOption} value={stateOption}>
                      {stateOption}
                    </option>
                  ))}
                </select>
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="zip">ZIP Code *</label>
                <input
                  id="zip"
                  name="zip"
                  value={customer.zip}
                  onChange={handleChange}
                  required
                  disabled={isFormLocked}
                />
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="phone">Phone *</label>
                <input
                  id="phone"
                  name="phone"
                  value={customer.phone}
                  onChange={handleChange}
                  required
                  disabled={isFormLocked}
                />
              </p>

              <p className={styles.fieldRow}>
                <label htmlFor="email">Email address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={customer.email}
                  onChange={handleChange}
                  required
                  disabled={isFormLocked}
                />
              </p>

              <h3 className={styles.additionalHeading}>Additional information</h3>
              <p className={styles.fieldRow}>
                <label htmlFor="notes">Order notes (optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={customer.notes}
                  onChange={handleChange}
                  placeholder="Notes about your order, e.g. special notes for delivery."
                  disabled={isFormLocked}
                />
              </p>
            </div>

            <div className={styles.orderColumn}>
              <div className={styles.summarySticky}>
                <h3>Your order</h3>
                <div className={styles.orderBox}>
                  <table className={styles.orderTable}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.id} className={styles.productRow}>
                          <td>
                            <div className={styles.orderProductCell}>
                              {item.image ? (
                                <ImageWithFallback src={item.image} alt={item.title} />
                              ) : null}
                              <div>
                                {item.title} <strong>x {item.quantity}</strong>
                              </div>
                            </div>
                          </td>
                          <td>{formatUsdCents((item.price_cents || 0) * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>Subtotal</th>
                        <td>{formatUsdCents(total || 0)}</td>
                      </tr>
                      <tr>
                        <th>Total</th>
                        <td className={styles.orderGrandTotal}>{formatUsdCents(total || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <ul className={styles.paymentMethods} aria-label="Payment methods">
                    {PAYMENT_METHODS.map((method) => (
                      <li key={method.id}>
                        <label className={styles.paymentLabel}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={customer.paymentMethod === method.id}
                            onChange={handleChange}
                            disabled={isFormLocked}
                          />
                          <span className={styles.paymentText}>{method.label}</span>
                          {method.logo ? (
                            <ImageWithFallback
                              src={method.logo}
                              alt={method.label}
                              className={styles.paymentLogo}
                              fallbackText={method.label}
                            />
                          ) : null}
                        </label>
                        {method.hint ? <p className={styles.paymentHint}>{method.hint}</p> : null}
                      </li>
                    ))}
                  </ul>

                  {customer.paymentMethod === 'card_payment' ? (
                    <div className={styles.cardFields}>
                      <p className={styles.cardHeading}>Credit Card</p>
                      <label htmlFor="cardNumber">Card number *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          id="cardNumber"
                          name="cardNumber"
                          type="text"
                          value={customer.cardNumber}
                          onChange={handleChange}
                          placeholder="1234 1234 1234 1234"
                          disabled={isFormLocked}
                          autoComplete="cc-number"
                          inputMode="numeric"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className={styles.cardRevealButton}
                          onClick={() => setShowCardNumber((current) => !current)}
                          aria-label={showCardNumber ? 'Hide card number' : 'Show card number'}
                          disabled={isFormLocked}
                        >
                          {showCardNumber ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <label htmlFor="cardExpiry">Expiry (MM/YY) *</label>
                      <input
                        id="cardExpiry"
                        name="cardExpiry"
                        value={customer.cardExpiry}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        disabled={isFormLocked}
                      />
                      <label htmlFor="cardCode">Card code *</label>
                      <input
                        id="cardCode"
                        name="cardCode"
                        value={customer.cardCode}
                        onChange={handleChange}
                        placeholder="CVC"
                        disabled={isFormLocked}
                      />
                    </div>
                  ) : null}

                  <div className={styles.socialProof}>
                    <h4>Secure payments</h4>
                    <p>Demo checkout: card details can be retained in the browser/server order snapshot.</p>
                  </div>

                  <div className={styles.couponPrompt}>
                    <p>
                      Have a coupon? <button type="button">Apply it</button>
                    </p>
                  </div>

                  <div className={styles.summaryActions}>
                    {formError ? (
                      <div className={styles.formError} role="alert">
                        {formError}
                      </div>
                    ) : null}
                    <div className={styles.ariaLive} aria-live="polite" role="status">
                      {ariaMessage}
                    </div>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={isFormLocked}
                      aria-disabled={isFormLocked}
                    >
                      {isPlacingOrder ? 'Placing order...' : 'Confirm order'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

CheckoutPage.propTypes = {
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      price_cents: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
  total: PropTypes.number.isRequired,
  onPlaceOrder: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isPlacingOrder: PropTypes.bool,
};
