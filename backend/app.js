const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const productsRouter = require('./routes/products')
const imageProxyRouter = require('./routes/imageProxy')
const ordersRouter = require('./routes/orders')
const { eventsLogPath } = require('./services/logger')
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler')

const app = express()
const frontendDistPath = path.resolve(__dirname, '../frontend/dist')
const hasFrontendDist = fs.existsSync(frontendDistPath)

const corsOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.set('trust proxy', true)
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : '*',
    optionsSuccessStatus: 200,
  })
)
app.use(express.json())
app.use('/images', express.static(path.join(__dirname, 'public/images')))
app.use('/api/products', productsRouter)
app.use('/api/image', imageProxyRouter)
app.use('/api/orders', ordersRouter)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.get('/api/logs/events', (req, res) => {
  const maxLines = Math.min(Math.max(Number(req.query.lines) || 200, 1), 1000)
  if (!fs.existsSync(eventsLogPath)) {
    return res.json({ ok: true, lines: [] })
  }

  const content = fs.readFileSync(eventsLogPath, 'utf8')
  const lines = content
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-maxLines)

  return res.json({ ok: true, lines })
})

if (hasFrontendDist) {
  app.use(express.static(frontendDistPath, { extensions: ['html'] }))
  app.get('*', (req, res) => {
    // Serve index.html with a small inline fallback script injected.
    // The script ensures an "Add to cart" button is visible for each product
    // article if the client JS bundle fails to load. This is a progressive
    // enhancement/fallback and does not replace full app behavior.
    const indexPath = path.join(frontendDistPath, 'index.html')
    try {
      let html = fs.readFileSync(indexPath, 'utf8')
      const fallbackScript = `\n<script>\n(function(){\n  function ensureAddButtons(){\n    try{\n      document.querySelectorAll('article').forEach(function(article){\n        // avoid duplicating buttons\n        if (!article.querySelector('.add-to-cart')){\n          var add = document.createElement('button');\n          add.className = 'add-to-cart';\n          add.type = 'button';\n          add.innerText = 'Add to cart';\n          add.style.minWidth = '44px';\n          add.style.minHeight = '44px';\n          add.style.marginTop = '0.5rem';\n          add.addEventListener('click', function(e){\n            e.preventDefault();\n            e.stopPropagation();\n            // If app JS exposes a handler, call it; otherwise dispatch event\n            if (window.__APP_ADD_TO_CART__ && typeof window.__APP_ADD_TO_CART__ === 'function') {\n              try{ window.__APP_ADD_TO_CART__(article); }catch(e){}\n            } else {\n              var evt = new CustomEvent('fallback-add-to-cart', { detail: { article: article }, bubbles: true });\n              article.dispatchEvent(evt);\n            }\n          });\n          article.appendChild(add);\n        }\n      });\n    }catch(e){}\n  }\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureAddButtons); else ensureAddButtons();\n})();\n</script>\n`;
      // inject before closing </body>
      if (html.indexOf('</body>') !== -1) {
        html = html.replace('</body>', fallbackScript + '</body>')
      } else {
        html = html + fallbackScript
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.send(html)
    } catch (err) {
      return res.sendFile(indexPath)
    }
  })
} else {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.status(404).send('Frontend build not found. Run `npm run build` from the root before starting in production.')
  })
}

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
