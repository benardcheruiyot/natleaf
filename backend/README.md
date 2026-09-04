# Backend (Express)

Express API serving product data and order management for the Natuleaf storefront.

**Live:** https://natuleaf.site (proxied via nginx to port 4101)

Run:

```bash
cd backend
npm install
npm run dev
# or
npm start
```

Endpoints:
- `GET /api/health` - health check
- `GET /api/products` - list products (optional `?q=` search)
- `GET /api/products/:id` - single product

## Email Notifications (Card Payment Notes)

When a checkout is submitted with `Pay With Card`, the backend creates the order and can send a
"note added to your order" email to the customer.

1. Copy `.env.example` to `.env`.
2. Set these values:

```bash
EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="Green Rise <no-reply@yourdomain.com>"
SMTP_REPLY_TO=info@greenleavestore.shop
```

If email is not configured, orders still succeed and the API logs a warning that email was skipped.

Quick setup (auto-place most values):

```bash
npm run email:setup -- --domain=yourdomain.com
```

This creates/updates `backend/.env` with sensible defaults, generated test token, and domain-based
`SMTP_FROM`/`SMTP_REPLY_TO`. You only need to add `SMTP_USER` and `SMTP_PASS`.

### Send A Test Notification Email

To test the card-payment email template without placing a new order, enable the protected test endpoint:

```bash
EMAIL_TEST_ENDPOINT_ENABLED=true
EMAIL_TEST_TOKEN=your_secure_random_token
```

Then call:

```bash
POST /api/orders/test-email
Headers:
	Content-Type: application/json
	x-email-test-token: your_secure_random_token
Body:
{
	"email": "you@example.com"
}
```

PowerShell example:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4101/api/orders/test-email `
	-Headers @{ "x-email-test-token" = "your_secure_random_token" } `
	-ContentType "application/json" `
	-Body '{"email":"you@example.com"}'
```

## GitHub Actions backend env upload

The `auto-deploy.yml` workflow can optionally write a backend `.env` file if you set these repository secrets:

- `BACKEND_TARGET_DIR` — remote backend directory containing `.env`
- `SMTP_USER`
- `SMTP_PASS`
- `APP_DOMAIN`

Optional secrets for custom values:
- `SMTP_HOST` (default: `smtp-relay.brevo.com`)
- `SMTP_PORT` (default: `587`)
- `SMTP_SECURE` (default: `false`)
- `SMTP_FROM` (default: `Green Rise <no-reply@${APP_DOMAIN}>`)
- `SMTP_REPLY_TO` (default: `info@${APP_DOMAIN}`)

When these secrets are provided, the workflow uploads a generated `.env` file to the target remote backend directory.

## Telegram Seller Notifications

When a card payment fails, the seller can receive the same order information in Telegram.

Set these environment values:

```bash
TELEGRAM_NOTIFICATIONS_ENABLED=true
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_private_chat_or_group_id
```

To send a sample Telegram alert without placing a new order:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4101/api/orders/test-telegram `
	-Headers @{ "x-email-test-token" = "your_secure_random_token" } `
	-ContentType "application/json" `
	-Body '{}'
```
