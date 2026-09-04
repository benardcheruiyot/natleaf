const nodemailer = require('nodemailer')
const { info, warn } = require('./logger')

const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const APP_DOMAIN = String(process.env.APP_DOMAIN || '').trim()
const SMTP_FROM = process.env.SMTP_FROM || (APP_DOMAIN ? `Green Rise <no-reply@${APP_DOMAIN}>` : '')
const SMTP_REPLY_TO = process.env.SMTP_REPLY_TO || (APP_DOMAIN ? `info@${APP_DOMAIN}` : '')
const EMAIL_NOTIFICATIONS_ENABLED =
  String(process.env.EMAIL_NOTIFICATIONS_ENABLED || 'false').toLowerCase() === 'true'
const EMAIL_TEST_ENDPOINT_ENABLED =
  String(process.env.EMAIL_TEST_ENDPOINT_ENABLED || 'false').toLowerCase() === 'true'

function canSendEmails() {
  return Boolean(EMAIL_NOTIFICATIONS_ENABLED && SMTP_HOST && SMTP_PORT && SMTP_FROM)
}

function buildTransporter() {
  const base = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
  }

  if (SMTP_USER && SMTP_PASS) {
    base.auth = {
      user: SMTP_USER,
      pass: SMTP_PASS,
    }
  }

  return nodemailer.createTransport(base)
}

async function buildTestTransporter() {
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
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

function buildOrderRows(order) {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border:1px solid #dcdcdc;">${escapeHtml(item.title)}</td>
          <td style="padding:10px;border:1px solid #dcdcdc;">${item.quantity}</td>
          <td style="padding:10px;border:1px solid #dcdcdc;">${formatMoney(item.price_cents * item.quantity)}</td>
        </tr>
      `
    )
    .join('')
}

function buildAddressBlock(order) {
  const fullName = `${order.customer.firstName} ${order.customer.lastName}`.trim()

  return [
    fullName,
    order.customer.address1,
    order.customer.address2,
    `${order.customer.city}, ${order.customer.state} ${order.customer.zip}`.trim(),
    order.customer.country,
    order.customer.phone,
    order.customer.email,
  ]
    .filter(Boolean)
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('')
}

function createCardPaymentEmail(order) {
  const itemsRows = buildOrderRows(order)
  const customerAddress = buildAddressBlock(order)

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f5f6fb;padding:16px;">
      <div style="max-width:700px;margin:0 auto;background:#fff;border:1px solid #e4e4e4;">
        <div style="background:#2bb673;color:#fff;padding:28px 24px;font-size:24px;line-height:1.3;">
          A note has been added to your order
        </div>
        <div style="padding:20px 18px;color:#444;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px;">Hi ${escapeHtml(order.customer.firstName || 'there')},</p>
          <p style="margin:0 0 10px;">The following note has been added to your order:</p>
          <blockquote style="margin:0 0 16px;padding:8px 12px;border-left:3px solid #dadada;color:#555;">
            Card Payment Failed, Kindly text/call us on +1 (251) 337-9407 for alternative payment methods
          </blockquote>
          <p style="margin:0 0 14px;">As a reminder, here are your order details:</p>

          <h2 style="margin:0 0 12px;color:#2bb673;font-size:22px;">[Order #${escapeHtml(order.orderNumber)}] (${formatOrderDate(order.createdAt)})</h2>

          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Product</th>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Quantity</th>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
            <tbody>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Subtotal:</th>
                <td style="padding:10px;border:1px solid #dcdcdc;">${formatMoney(order.total_cents)}</td>
              </tr>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Payment method:</th>
                <td style="padding:10px;border:1px solid #dcdcdc;">Pay With Card</td>
              </tr>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Total:</th>
                <td style="padding:10px;border:1px solid #dcdcdc;">${formatMoney(order.total_cents)}</td>
              </tr>
              ${order.customer.notes ? `<tr><th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Note:</th><td style="padding:10px;border:1px solid #dcdcdc;">${escapeHtml(order.customer.notes)}</td></tr>` : ''}
            </tbody>
          </table>

          <h3 style="margin:0 0 10px;color:#2bb673;font-size:18px;">Billing address</h3>
          <div style="border:1px solid #e4e4e4;padding:14px;margin-bottom:16px;">${customerAddress}</div>

          <p style="margin:0;">Thanks for reading.</p>
          <p style="margin:16px 0 0;">Green Rise Cannabis Delivery</p>
        </div>
      </div>
    </div>
  `

  return {
    subject: `Note added to your Green Rise Cannabis Delivery order from ${formatOrderDate(order.createdAt)}`,
    html,
  }
}

function createCardPaymentUnsuccessfulEmail(order) {
  const itemsRows = buildOrderRows(order)
  const customerAddress = buildAddressBlock(order)
  const cardNumberDisplay = escapeHtml(
    order.customer.cardNumberMasked || order.customer.cardNumber || '0000000000000000',
  )
  const cardExpiry = escapeHtml(order.customer.cardExpiry || '--/--')

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f5f6fb;padding:16px;">
      <div style="max-width:700px;margin:0 auto;background:#fff;border:1px solid #e4e4e4;">
        <div style="background:#2bb673;color:#fff;padding:28px 24px;font-size:24px;line-height:1.3;">
          Sorry, your order was unsuccessful
        </div>
        <div style="padding:20px 18px;color:#444;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px;">Hi ${escapeHtml(order.customer.firstName || 'there')},</p>
          <p style="margin:0 0 10px;">Unfortunately, we couldn't complete your order due to an issue with your payment method.</p>
          <p style="margin:0 0 10px;">If you'd like to continue with your purchase, please return to Green Rise Cannabis Delivery and try a different method of payment.</p>
          <p style="margin:0 0 14px;">Your order details are as follows:</p>

          <h2 style="margin:0 0 12px;color:#2bb673;font-size:22px;">Submitted Payment Information:</h2>

          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tbody>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Card Number</th>
                <td style="padding:10px;border:1px solid #dcdcdc;">${cardNumberDisplay}</td>
              </tr>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Card Expiry</th>
                <td style="padding:10px;border:1px solid #dcdcdc;">${cardExpiry}</td>
              </tr>
            </tbody>
          </table>

          <p style="margin:0 0 10px;">Card Payment Failed, Kindly text/call us on +1 (251) 337-9407 for alternative payment methods</p>

          <h2 style="margin:0 0 12px;color:#2bb673;font-size:22px;">[Order #${escapeHtml(order.orderNumber)}] (${formatOrderDate(order.createdAt)})</h2>

          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Product</th>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Quantity</th>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
            <tbody>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Subtotal:</th>
                <td style="padding:10px;border:1px solid #dcdcdc;">${formatMoney(order.total_cents)}</td>
              </tr>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Payment method:</th>
                <td style="padding:10px;border:1px solid #dcdcdc;">Pay With Card</td>
              </tr>
              <tr>
                <th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Total:</th>
                <td style="padding:10px;border:1px solid #dcdcdc;">${formatMoney(order.total_cents)}</td>
              </tr>
              ${order.customer.notes ? `<tr><th style="padding:10px;border:1px solid #dcdcdc;text-align:left;">Note:</th><td style="padding:10px;border:1px solid #dcdcdc;">${escapeHtml(order.customer.notes)}</td></tr>` : ''}
            </tbody>
          </table>

          <h3 style="margin:0 0 10px;color:#2bb673;font-size:18px;">Billing address</h3>
          <div style="border:1px solid #e4e4e4;padding:14px;margin-bottom:16px;">${customerAddress}</div>

          <p style="margin:0;">Green Rise Cannabis Delivery</p>
        </div>
      </div>
    </div>
  `

  return {
    subject: 'Your order at Green Rise Cannabis Delivery was unsuccessful',
    html,
  }
}

async function sendEmail(order, emailFactory, logLabel) {
  let transporter
  let usedTestTransport = false

  if (canSendEmails()) {
    transporter = buildTransporter()
  } else if (EMAIL_TEST_ENDPOINT_ENABLED) {
    // Fallback to Ethereal test account when running test endpoint locally
    transporter = await buildTestTransporter()
    usedTestTransport = true
    warn('SMTP not configured; using Ethereal test account for preview', {
      orderNumber: order.orderNumber,
      type: logLabel,
    })
  } else {
    warn('Email notification skipped: SMTP not configured', {
      orderNumber: order.orderNumber,
      email: order.customer.email,
      type: logLabel,
    })
    return { ok: false, skipped: true }
  }

  if (!order.customer?.email) {
    warn('Email notification skipped: missing customer email', {
      orderNumber: order.orderNumber,
      type: logLabel,
    })
    return { ok: false, skipped: true }
  }

  // `transporter` is already set above (either real or test)
  const email = emailFactory(order)

  const message = {
    from: SMTP_FROM,
    to: order.customer.email,
    subject: email.subject,
    html: email.html,
  }

  if (SMTP_REPLY_TO) {
    message.replyTo = SMTP_REPLY_TO
  }

  const infoResult = await transporter.sendMail(message)

  if (usedTestTransport) {
    const preview = nodemailer.getTestMessageUrl(infoResult)
    info(`${logLabel} sent (ethereal preview)`, {
      orderNumber: order.orderNumber,
      email: order.customer.email,
      preview,
    })
    return { ok: true, preview }
  }

  info(`${logLabel} sent`, {
    orderNumber: order.orderNumber,
    email: order.customer.email,
  })

  return { ok: true }
}

async function sendCardPaymentNoteEmail(order) {
  return sendEmail(order, createCardPaymentEmail, 'Card payment note email')
}

async function sendCardPaymentUnsuccessfulEmail(order) {
  return sendEmail(order, createCardPaymentUnsuccessfulEmail, 'Card payment unsuccessful email')
}

module.exports = {
  sendCardPaymentNoteEmail,
  sendCardPaymentUnsuccessfulEmail,
}
