const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const envPath = path.join(__dirname, '../.env')

function parseArgs(argv) {
  const args = {}
  for (const item of argv) {
    if (!item.startsWith('--')) continue
    const [key, value] = item.slice(2).split('=')
    args[key] = value || 'true'
  }
  return args
}

function parseEnv(content) {
  const map = new Map()
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1)
    map.set(key, value)
  }
  return map
}

function toEnvLine(key, value) {
  return `${key}=${value}`
}

function maybeQuoted(value) {
  if (/[\s<>]/.test(value)) {
    return `"${value}"`
  }
  return value
}

function makeDefaults(domain) {
  const safeDomain = domain || 'yourdomain.com'
  const token = crypto.randomBytes(24).toString('hex')

  return {
    PORT: '4100',
    CORS_ORIGIN: 'http://localhost:5173',
    EMAIL_NOTIFICATIONS_ENABLED: 'true',
    SMTP_HOST: 'smtp-relay.brevo.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: '',
    SMTP_PASS: '',
    APP_DOMAIN: safeDomain,
    SMTP_FROM: maybeQuoted(`Green Rise <no-reply@${safeDomain}>`),
    SMTP_REPLY_TO: `info@${safeDomain}`,
    EMAIL_TEST_ENDPOINT_ENABLED: 'true',
    EMAIL_TEST_TOKEN: token,
  }
}

function run() {
  const args = parseArgs(process.argv.slice(2))
  const domain = String(args.domain || '').trim().toLowerCase()
  const defaults = makeDefaults(domain)

  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
  const current = parseEnv(existing)

  const merged = { ...defaults }
  for (const [key, value] of current.entries()) {
    merged[key] = value
  }

  if (domain) {
    merged.APP_DOMAIN = domain
    if (!current.get('SMTP_FROM') || String(current.get('SMTP_FROM')).includes('yourdomain.com')) {
      merged.SMTP_FROM = maybeQuoted(`Green Rise <no-reply@${domain}>`)
    }
    if (!current.get('SMTP_REPLY_TO') || String(current.get('SMTP_REPLY_TO')).includes('greenleavestore.shop')) {
      merged.SMTP_REPLY_TO = `info@${domain}`
    }
  }

  const output = [
    '# Core',
    toEnvLine('PORT', merged.PORT),
    toEnvLine('CORS_ORIGIN', merged.CORS_ORIGIN),
    '',
    '# Email notifications',
    toEnvLine('EMAIL_NOTIFICATIONS_ENABLED', merged.EMAIL_NOTIFICATIONS_ENABLED),
    toEnvLine('SMTP_HOST', merged.SMTP_HOST),
    toEnvLine('SMTP_PORT', merged.SMTP_PORT),
    toEnvLine('SMTP_SECURE', merged.SMTP_SECURE),
    toEnvLine('SMTP_USER', merged.SMTP_USER),
    toEnvLine('SMTP_PASS', merged.SMTP_PASS),
    toEnvLine('APP_DOMAIN', merged.APP_DOMAIN),
    toEnvLine('SMTP_FROM', merged.SMTP_FROM),
    toEnvLine('SMTP_REPLY_TO', merged.SMTP_REPLY_TO),
    '',
    '# Protected email test endpoint',
    toEnvLine('EMAIL_TEST_ENDPOINT_ENABLED', merged.EMAIL_TEST_ENDPOINT_ENABLED),
    toEnvLine('EMAIL_TEST_TOKEN', merged.EMAIL_TEST_TOKEN),
    '',
  ].join('\n')

  fs.writeFileSync(envPath, output, 'utf8')

  console.log('Email environment scaffolded at backend/.env')
  console.log('Next: set SMTP_USER and SMTP_PASS, then restart backend.')
}

run()
