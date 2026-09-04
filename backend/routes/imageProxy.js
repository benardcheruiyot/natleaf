const express = require('express')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const { info, warn } = require('../services/logger')

const router = express.Router()
const placeholderPath = path.join(__dirname, '../public/images/placeholder.svg')

const ALLOWED_HOSTS = new Set(['greenstoneretail.shop', 'www.greenstoneretail.shop'])

function sendPlaceholder(res, reason, meta = {}) {
  warn('Image proxy fallback to placeholder', { reason, ...meta })
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=21600')
  fs.createReadStream(placeholderPath).pipe(res)
}

function streamRemoteImage(url, res, requestMeta) {
  const client = url.protocol === 'https:' ? https : http
  const request = client.get(url, (remoteRes) => {
    if (remoteRes.statusCode && remoteRes.statusCode >= 400) {
      remoteRes.resume()
      return sendPlaceholder(res, 'remote-status-error', {
        ...requestMeta,
        statusCode: remoteRes.statusCode,
      })
    }

    const contentType = remoteRes.headers['content-type']
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }
    res.setHeader('Cache-Control', 'public, max-age=21600')
    info('Image proxy success', {
      ...requestMeta,
      contentType: contentType || 'unknown',
    })
    remoteRes.pipe(res)
  })

  request.on('error', (error) =>
    sendPlaceholder(res, 'request-error', {
      ...requestMeta,
      message: error.message,
    })
  )
}

router.get('/', (req, res, next) => {
  const target = req.query.url
  const requestMeta = {
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
    target: typeof target === 'string' ? target : '',
  }
  if (!target || typeof target !== 'string') {
    warn('Image proxy rejected: missing url query param', requestMeta)
    return res.status(400).json({ error: 'Missing url query param' })
  }

  let parsed
  try {
    parsed = new URL(target)
  } catch {
    warn('Image proxy rejected: invalid URL', requestMeta)
    return res.status(400).json({ error: 'Invalid image URL' })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    warn('Image proxy rejected: unsupported protocol', {
      ...requestMeta,
      protocol: parsed.protocol,
    })
    return res.status(400).json({ error: 'Unsupported URL protocol' })
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    warn('Image proxy rejected: host not allowed', {
      ...requestMeta,
      hostname: parsed.hostname,
    })
    return res.status(403).json({ error: 'Image host not allowed' })
  }

  streamRemoteImage(parsed, res, { ...requestMeta, hostname: parsed.hostname })
})

module.exports = router