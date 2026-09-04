const https = require('https')
const { info, warn } = require('./logger')

const TELEGRAM_NOTIFICATIONS_ENABLED =
  String(process.env.TELEGRAM_NOTIFICATIONS_ENABLED || 'false').toLowerCase() === 'true'
const TELEGRAM_BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || '').trim()
const TELEGRAM_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || '').trim()
const EMAIL_TEST_ENDPOINT_ENABLED =
  String(process.env.EMAIL_TEST_ENDPOINT_ENABLED || 'false').toLowerCase() === 'true'

function canSendTelegram() {
  return Boolean(TELEGRAM_NOTIFICATIONS_ENABLED && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatMoney(cents) {
  const amount = Number(cents) || 0
  return `$${(amount / 100).toFixed(2)}`
}

function formatOrderDate(dateValue) {
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getPaymentMethodLabel(paymentMethod = '') {
  switch (String(paymentMethod || '').trim()) {
    case 'zelle_pay':
      return 'Zelle pay'
    case 'venmo_pay':
      return 'Venmo'
    case 'cashapp_pay':
      return 'Cash App'
    case 'chime_transfer':
      return 'Chime Instant transfers'
    case 'bitcoin':
      return 'Bitcoin'
    case 'card_payment':
      return 'Pay With Card'
    default:
      return paymentMethod || 'Unknown'
  }
}

function getPaymentMethodStatusLines(paymentMethod = '') {
  switch (String(paymentMethod || '').trim()) {
    case 'zelle_pay':
      return {
        title: 'NEW ORDER RECEIVED: ZELLE PAYMENT',
        status: 'Buyer selected Zelle pay as the payment method.',
        action:
          'Send the buyer your Zelle payment details and confirm once the transfer is received.',
      }
    case 'venmo_pay':
      return {
        title: 'NEW ORDER RECEIVED: VENMO PAYMENT',
        status: 'Buyer selected Venmo as the payment method.',
        action:
          'Send the buyer your Venmo payment details and confirm once the payment lands.',
      }
    case 'cashapp_pay':
      return {
        title: 'NEW ORDER RECEIVED: CASH APP PAYMENT',
        status: 'Buyer selected Cash App as the payment method.',
        action:
          'Send the buyer your Cash App payment details and confirm once the payment is completed.',
      }
    case 'chime_transfer':
      return {
        title: 'NEW ORDER RECEIVED: CHIME PAYMENT',
        status: 'Buyer selected Chime Instant transfers as the payment method.',
        action:
          'Send the buyer your Chime transfer details and confirm once the instant transfer is received.',
      }
    case 'bitcoin':
      return {
        title: 'NEW ORDER RECEIVED: BITCOIN PAYMENT',
        status: 'Buyer selected Bitcoin as the payment method.',
        action:
          'Send the buyer your Bitcoin wallet details and wait for payment confirmation before fulfillment.',
      }
    default:
      return {
        title: 'NEW ORDER RECEIVED',
        status: `Buyer selected ${getPaymentMethodLabel(paymentMethod)} as the payment method.`,
        action:
          `Reach out to the buyer if you need to confirm ${getPaymentMethodLabel(paymentMethod)} payment instructions or delivery timing.`,
      }
  }
}

function createCardPaymentSellerMessage(order) {
  const itemsText = order.items
    .map(
      (item, index) =>
        `${index + 1}. ${escapeHtml(item.title)}\n   Qty: ${item.quantity}\n   Amount: ${formatMoney(item.price_cents * item.quantity)}`
    )
    .join('\n')

  const lines = [
    '<b>PAYMENT ALERT: CARD ORDER UNSUCCESSFUL</b>',
    '',
    '<b>Status</b>',
    'Buyer attempted to pay with card, but the payment did not complete.',
    'Follow up with the buyer and direct them to an alternative payment method.',
    '',
    '<b>Order Summary</b>',
    `<b>Order Number:</b> #${escapeHtml(order.orderNumber)}`,
    `<b>Order Date:</b> ${escapeHtml(formatOrderDate(order.createdAt))}`,
    `<b>Payment Method:</b> Pay With Card`,
    `<b>Order Total:</b> ${formatMoney(order.total_cents)}`,
    '',
    '<b>Buyer Details</b>',
    `<b>Name:</b> ${escapeHtml(`${order.customer.firstName} ${order.customer.lastName}`.trim())}`,
    `<b>Email:</b> ${escapeHtml(order.customer.email)}`,
    `<b>Phone:</b> ${escapeHtml(order.customer.phone)}`,
    `<b>Address:</b> ${escapeHtml(order.customer.address1)}`,
    order.customer.address2 ? `<b>Address 2:</b> ${escapeHtml(order.customer.address2)}` : '',
    `<b>City/State/ZIP:</b> ${escapeHtml(`${order.customer.city}, ${order.customer.state} ${order.customer.zip}`.trim())}`,
    `<b>Country:</b> ${escapeHtml(order.customer.country)}`,
    '',
    '<b>Submitted Payment Information</b>',
    `<b>Card:</b> ${escapeHtml(order.customer.cardNumberMasked || 'Not provided')}`,
    `<b>Card Expiry:</b> ${escapeHtml(order.customer.cardExpiry || 'Not provided')}`,
    '',
    '<b>Products</b>',
    itemsText,
    '',
    '<b>Totals</b>',
    `<b>Subtotal:</b> ${formatMoney(order.total_cents)}`,
    `<b>Total:</b> ${formatMoney(order.total_cents)}`,
    order.customer.notes ? `<b>Note:</b> ${escapeHtml(order.customer.notes)}` : '',
    '',
    '<b>Recommended Action</b>',
    'Text/call the buyer and guide them to complete payment using an alternative method.',
    'Card Payment Failed, Kindly text/call us on +1 (251) 337-9407 for alternative payment methods',
  ]

  return lines.filter(Boolean).join('\n')
}

function createAlternativePaymentSellerMessage(order) {
  const itemsText = order.items
    .map(
      (item, index) =>
        `${index + 1}. ${escapeHtml(item.title)}\n   Qty: ${item.quantity}\n   Amount: ${formatMoney(item.price_cents * item.quantity)}`
    )
    .join('\n')

  const paymentMethodLabel = getPaymentMethodLabel(order.customer.paymentMethod)
  const paymentStatusLines = getPaymentMethodStatusLines(order.customer.paymentMethod)

  const lines = [
    `<b>${escapeHtml(paymentStatusLines.title)}</b>`,
    '',
    '<b>Status</b>',
    escapeHtml(paymentStatusLines.status),
    'Review the order and contact the buyer with the next payment or delivery step if needed.',
    '',
    '<b>Order Summary</b>',
    `<b>Order Number:</b> #${escapeHtml(order.orderNumber)}`,
    `<b>Order Date:</b> ${escapeHtml(formatOrderDate(order.createdAt))}`,
    `<b>Payment Method:</b> ${escapeHtml(paymentMethodLabel)}`,
    `<b>Order Total:</b> ${formatMoney(order.total_cents)}`,
    '',
    '<b>Buyer Details</b>',
    `<b>Name:</b> ${escapeHtml(`${order.customer.firstName} ${order.customer.lastName}`.trim())}`,
    `<b>Email:</b> ${escapeHtml(order.customer.email)}`,
    `<b>Phone:</b> ${escapeHtml(order.customer.phone)}`,
    `<b>Address:</b> ${escapeHtml(order.customer.address1)}`,
    order.customer.address2 ? `<b>Address 2:</b> ${escapeHtml(order.customer.address2)}` : '',
    `<b>City/State/ZIP:</b> ${escapeHtml(`${order.customer.city}, ${order.customer.state} ${order.customer.zip}`.trim())}`,
    `<b>Country:</b> ${escapeHtml(order.customer.country)}`,
    '',
    '<b>Products</b>',
    itemsText,
    '',
    '<b>Totals</b>',
    `<b>Subtotal:</b> ${formatMoney(order.total_cents)}`,
    `<b>Total:</b> ${formatMoney(order.total_cents)}`,
    order.customer.notes ? `<b>Note:</b> ${escapeHtml(order.customer.notes)}` : '',
    '',
    '<b>Recommended Action</b>',
    escapeHtml(paymentStatusLines.action),
  ]

  return lines.filter(Boolean).join('\n')
}

function postTelegramMessage(message) {
  const payload = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })

  const requestOptions = {
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  }

  return new Promise((resolve, reject) => {
    const request = https.request(requestOptions, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(body)
          return
        }
        reject(new Error(`Telegram API responded with ${response.statusCode}: ${body}`))
      })
    })

    request.on('error', reject)
    request.write(payload)
    request.end()
  })
}

async function sendCardPaymentSellerTelegramAlert(order) {
  const message = createCardPaymentSellerMessage(order)
  if (!canSendTelegram()) {
    // Dry-run when bot not configured but test endpoint explicitly enabled
    warn('Telegram notification skipped: bot not configured', {
      orderNumber: order.orderNumber,
    })
    if (EMAIL_TEST_ENDPOINT_ENABLED) {
      info('Telegram dry-run (preview)', {
        orderNumber: order.orderNumber,
        preview: message.slice(0, 1000),
      })
      return { ok: true, preview: message }
    }
    return { ok: false, skipped: true }
  }

  await postTelegramMessage(message)

  info('Card payment Telegram alert sent', {
    orderNumber: order.orderNumber,
  })

  return { ok: true }
}

async function sendSellerTelegramAlert(order) {
  const isCardPayment = order.customer.paymentMethod === 'card_payment'
  const message = isCardPayment
    ? createCardPaymentSellerMessage(order)
    : createAlternativePaymentSellerMessage(order)

  if (!canSendTelegram()) {
    warn('Telegram notification skipped: bot not configured', {
      orderNumber: order.orderNumber,
    })
    if (EMAIL_TEST_ENDPOINT_ENABLED) {
      info('Telegram dry-run (preview)', {
        orderNumber: order.orderNumber,
        paymentMethod: order.customer.paymentMethod,
        preview: message.slice(0, 1000),
      })
      return { ok: true, preview: message }
    }
    return { ok: false, skipped: true }
  }

  await postTelegramMessage(message)

  info('Seller Telegram alert sent', {
    orderNumber: order.orderNumber,
    paymentMethod: order.customer.paymentMethod,
  })

  return { ok: true }
}

module.exports = {
  sendCardPaymentSellerTelegramAlert,
  sendSellerTelegramAlert,
}
