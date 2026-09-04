export const STANDARD_PAYMENT_SUPPORT_PHONE = '+1 (251) 337-9407';
export const CARD_DECLINED_SUPPORT_PHONE = '+1 (251) 337-9407';

export const PAYMENT_METHODS = [
  {
    id: 'zelle_pay',
    label: 'Zelle pay',
    logo: '/images/payments/zelle.svg',
    hint: `Kindly text/call us on ${STANDARD_PAYMENT_SUPPORT_PHONE} for payment instructions`,
  },
  {
    id: 'venmo_pay',
    label: 'Venmo',
    logo: '/images/payments/venmo.svg',
    hint: `Kindly text/call us on ${STANDARD_PAYMENT_SUPPORT_PHONE} for payment instructions`,
  },
  {
    id: 'cashapp_pay',
    label: 'Cash App',
    logo: '/images/payments/cashapp.svg',
    hint: `Kindly text/call us on ${STANDARD_PAYMENT_SUPPORT_PHONE} for payment instructions`,
  },
  {
    id: 'chime_transfer',
    label: 'Chime Instant transfers',
    logo: '/images/payments/chime.svg',
    hint: `Kindly text/call us on ${STANDARD_PAYMENT_SUPPORT_PHONE} for payment instructions`,
  },
  {
    id: 'card_payment',
    label: 'Pay With Card',
    logo: '/images/payments/card.svg',
    hint: `Kindly text/call us on ${CARD_DECLINED_SUPPORT_PHONE} for card payment instructions`,
  },
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    logo: '/images/payments/bitcoin.svg',
    hint: 'Pay using Bitcoin.',
  },
];

export const CARD_PAYMENT_ALTERNATIVE_METHODS = [
  {
    label: 'Zelle Pay',
    logo: '/images/payments/zelle.svg',
  },
  {
    label: 'Chime',
    logo: '/images/payments/chime.svg',
  },
  { label: 'Venmo', logo: '/images/payments/venmo.svg' },
  {
    label: 'Cash App',
    logo: '/images/payments/cashapp.svg',
  },
  { label: 'Bitcoins', logo: '/images/payments/bitcoin.svg' },
  {
    label: 'Ethereum',
    logo: '/images/payments/ethereum.svg',
  },
  { label: 'PayPal', logo: '/images/payments/paypal.svg' },
  {
    label: 'Google Pay',
    logo: '/images/payments/gpay.svg',
  },
];

export function getPaymentMethodLabel(paymentMethodId = '') {
  const method = PAYMENT_METHODS.find((item) => item.id === paymentMethodId);
  return method?.label || paymentMethodId || 'Zelle pay';
}

export function getPaymentMethodHint(paymentMethodId = '') {
  if (paymentMethodId === 'card_payment') {
    return `Kindly text/call us on ${CARD_DECLINED_SUPPORT_PHONE} for card payment instructions`;
  }

  return `Kindly text/call us on ${STANDARD_PAYMENT_SUPPORT_PHONE} for payment instructions`;
}
