const express = require('express')
const { info, warn } = require('../services/logger')
const {
  sendCardPaymentNoteEmail,
  sendCardPaymentUnsuccessfulEmail,
} = require('../services/orderEmailService')
const { sendSellerTelegramAlert } = require('../services/orderTelegramService')

const router = express.Router()
const orders = []
const EMAIL_TEST_ENDPOINT_ENABLED =
  String(process.env.EMAIL_TEST_ENDPOINT_ENABLED || 'false').toLowerCase() === 'true'
const EMAIL_TEST_TOKEN = String(process.env.EMAIL_TEST_TOKEN || '').trim()
const TEST_ENDPOINT_ACCESSIBLE = EMAIL_TEST_ENDPOINT_ENABLED || Boolean(EMAIL_TEST_TOKEN)

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeCustomer(rawCustomer = {}) {
  return {
    firstName: normalizeText(rawCustomer.firstName),
    lastName: normalizeText(rawCustomer.lastName),
    email: normalizeText(rawCustomer.email).toLowerCase(),
    phone: normalizeText(rawCustomer.phone),
    address1: normalizeText(rawCustomer.address1),
    address2: normalizeText(rawCustomer.address2),
    city: normalizeText(rawCustomer.city),
    state: normalizeText(rawCustomer.state),
    zip: normalizeText(rawCustomer.zip),
    country: normalizeText(rawCustomer.country || 'United States'),
    notes: normalizeText(rawCustomer.notes),
    paymentMethod: normalizeText(rawCustomer.paymentMethod || 'cash_on_delivery'),
    deliveryWindow: normalizeText(rawCustomer.deliveryWindow || 'ASAP'),
    cardNumberMasked: normalizeText(rawCustomer.cardNumberMasked || rawCustomer.cardNumber),
    cardExpiry: normalizeText(rawCustomer.cardExpiry),
  }
}

function validateCustomer(customer) {
  if (!customer.firstName || customer.firstName.length < 2) {
    return 'First name is required.'
  }
  if (!customer.lastName || customer.lastName.length < 2) {
    return 'Last name is required.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return 'A valid email address is required.'
  }
  if (!customer.phone || customer.phone.length < 7) {
    return 'A valid phone number is required.'
  }
  if (!customer.address1 || customer.address1.length < 5) {
    return 'Street address is required.'
  }
  if (!customer.city) {
    return 'City is required.'
  }
  if (!customer.state) {
    return 'State/Region is required.'
  }
  if (!customer.zip || customer.zip.length < 4) {
    return 'ZIP/Postal code is required.'
  }
  return ''
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function getTestPaymentMethod(value) {
  const method = normalizeText(value)
  return method || 'zelle_pay'
}

router.post('/test-email', async (req, res) => {
  if (!EMAIL_TEST_ENDPOINT_ENABLED) {
    return res.status(404).json({ ok: false, error: 'Not found' })
  }

  const token = normalizeText(req.get('x-email-test-token') || req.body?.token)
  if (!EMAIL_TEST_TOKEN || token !== EMAIL_TEST_TOKEN) {
    warn('Email test endpoint rejected: invalid token', {
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    })
    return res.status(403).json({ ok: false, error: 'Forbidden' })
  }

  const email = normalizeText(req.body?.email).toLowerCase()
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: 'A valid email address is required.' })
  }

  const now = new Date()
  const sampleOrder = {
    id: `test-${Date.now()}`,
    orderNumber: `TEST-${Date.now().toString().slice(-6)}`,
    createdAt: now.toISOString(),
    total_cents: 16650,
    item_count: 3,
    customer: {
      firstName: 'Benard',
      lastName: 'Cheruiyot',
      email,
      phone: '2058484849',
      address1: 'Benet',
      address2: '',
      city: 'Nairobi',
      state: 'AL',
      zip: '50000',
      country: 'United States (US)',
      notes: 'Bsjsjns',
      paymentMethod: 'card_payment',
      deliveryWindow: 'ASAP',
      cardNumber: '6576543567898904',
      cardExpiry: '11/26',
    },
    items: [
      {
        id: '9129',
        title: 'Carolina Honey in Dracut-14g',
        quantity: 1,
        price_cents: 6300,
      },
      {
        id: '9098',
        title: 'Orange Crush - Live Resin Diamonds 1g (Reload) in Dracut',
        quantity: 1,
        price_cents: 5400,
      },
      {
        id: '9012',
        title: 'Jet Fuel Gelato Flower',
        quantity: 1,
        price_cents: 4950,
      },
    ],
  }

  try {
    await sendCardPaymentNoteEmail(sampleOrder)
    info('Email test endpoint sent sample note', {
      email,
      orderNumber: sampleOrder.orderNumber,
      ip: req.ip,
    })
    return res.json({
      ok: true,
      message: 'Sample card-payment note email sent.',
      to: email,
      orderNumber: sampleOrder.orderNumber,
    })
  } catch (error) {
    warn('Email test endpoint failed', {
      email,
      reason: error?.message || 'unknown_error',
    })
    return res.status(500).json({
      ok: false,
      error: 'Unable to send sample email.',
      details: error?.message || 'unknown_error',
    })
  }
})

router.post('/test-telegram', async (req, res) => {
  if (!TEST_ENDPOINT_ACCESSIBLE) {
    return res.status(404).json({ ok: false, error: 'Not found' })
  }

  const token = normalizeText(req.get('x-email-test-token') || req.body?.token)
  if (!EMAIL_TEST_TOKEN || token !== EMAIL_TEST_TOKEN) {
    warn('Telegram test endpoint rejected: invalid token', {
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    })
    return res.status(403).json({ ok: false, error: 'Forbidden' })
  }

  const paymentMethod = getTestPaymentMethod(req.body?.paymentMethod)
  const now = new Date()
  const sampleOrder = {
    id: `test-${Date.now()}`,
    orderNumber: `TEST-${Date.now().toString().slice(-6)}`,
    createdAt: now.toISOString(),
    total_cents: 16650,
    item_count: 3,
    customer: {
      firstName: 'Benard',
      lastName: 'Cheruiyot',
      email: 'seller-test@example.com',
      phone: '2058484849',
      address1: 'Benet',
      address2: '',
      city: 'Nairobi',
      state: 'AL',
      zip: '50000',
      country: 'United States (US)',
      notes: 'Bsjsjns',
      paymentMethod,
      deliveryWindow: 'ASAP',
      cardNumber: '6576543567898904',
      cardExpiry: '11/26',
    },
    items: [
      {
        id: '9129',
        title: 'Carolina Honey in Dracut-14g',
        quantity: 1,
        price_cents: 6300,
      },
      {
        id: '9098',
        title: 'Orange Crush - Live Resin Diamonds 1g (Reload) in Dracut',
        quantity: 1,
        price_cents: 5400,
      },
      {
        id: '9012',
        title: 'Jet Fuel Gelato Flower',
        quantity: 1,
        price_cents: 4950,
      },
    ],
  }

  try {
    await sendSellerTelegramAlert(sampleOrder)
    info('Telegram test endpoint sent sample alert', {
      orderNumber: sampleOrder.orderNumber,
      paymentMethod,
      ip: req.ip,
    })
    return res.json({
      ok: true,
      message: 'Sample seller Telegram alert sent.',
      orderNumber: sampleOrder.orderNumber,
      paymentMethod,
    })
  } catch (error) {
    warn('Telegram test endpoint failed', {
      reason: error?.message || 'unknown_error',
    })
    return res.status(500).json({
      ok: false,
      error: 'Unable to send sample Telegram alert.',
      details: error?.message || 'unknown_error',
    })
  }
})

router.post('/', async (req, res) => {
  const body = req.body || {}
  const items = Array.isArray(body.items) ? body.items : []
  const requestMeta = {
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  }

  if (!items.length) {
    warn('Order rejected: empty cart', requestMeta)
    return res.status(400).json({ ok: false, error: 'Your cart is empty.' })
  }

  const normalizedItems = items
    .map((item) => {
      const quantity = Number(item.quantity)
      const priceCents = Number(item.price_cents)
      return {
        id: String(item.id || ''),
        title: normalizeText(item.title),
        quantity: Number.isFinite(quantity) ? quantity : 0,
        price_cents: Number.isFinite(priceCents) ? priceCents : 0,
      }
    })
    .filter((item) => item.id && item.title && item.quantity > 0 && item.price_cents >= 0)

  if (!normalizedItems.length) {
    warn('Order rejected: invalid cart items', {
      ...requestMeta,
      itemsCount: items.length,
    })
    return res.status(400).json({ ok: false, error: 'Cart contains invalid items.' })
  }

  const customer = normalizeCustomer(body.customer)
  const customerError = validateCustomer(customer)
  if (customerError) {
    warn('Order rejected: customer validation failed', {
      ...requestMeta,
      customerError,
      email: customer.email,
    })
    return res.status(400).json({ ok: false, error: customerError })
  }

  const total_cents = normalizedItems.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)
  const item_count = normalizedItems.reduce((sum, item) => sum + item.quantity, 0)
  const now = Date.now()
  const orderNumber = `GR-${String(now).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`

  const order = {
    id: String(now),
    orderNumber,
    customer,
    items: normalizedItems,
    total_cents,
    item_count,
    createdAt: new Date(now).toISOString(),
  }

  orders.unshift(order)

  info('Order created', {
    ...requestMeta,
    orderNumber: order.orderNumber,
    total_cents: order.total_cents,
    item_count: order.item_count,
    email: order.customer.email,
    paymentMethod: order.customer.paymentMethod,
  })

  if (order.customer.paymentMethod === 'card_payment') {
    try {
      await sendCardPaymentNoteEmail(order)
      await sendCardPaymentUnsuccessfulEmail(order)
    } catch (error) {
      warn('Card payment notifications failed', {
        orderNumber: order.orderNumber,
        email: order.customer.email,
        reason: error?.message || 'unknown_error',
      })
    }
  }

  try {
    await sendSellerTelegramAlert(order)
  } catch (error) {
    warn('Seller Telegram alert failed', {
      orderNumber: order.orderNumber,
      paymentMethod: order.customer.paymentMethod,
      reason: error?.message || 'unknown_error',
    })
  }

  return res.status(201).json({
    ok: true,
    order: {
      orderNumber: order.orderNumber,
      total_cents: order.total_cents,
      item_count: order.item_count,
      createdAt: order.createdAt,
    },
  })
})

module.exports = router