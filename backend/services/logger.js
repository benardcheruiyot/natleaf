const fs = require('fs')
const path = require('path')

const logsDir = path.join(__dirname, '../logs')
const eventsLogPath = path.join(logsDir, 'events.log')

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
}

function serializeMeta(meta) {
  if (!meta || typeof meta !== 'object') return ''
  try {
    return ` ${JSON.stringify(meta)}`
  } catch {
    return ''
  }
}

function writeLog(level, message, meta) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${serializeMeta(meta)}\n`

  try {
    ensureLogsDir()
    fs.appendFileSync(eventsLogPath, line, 'utf8')
  } catch {
    // Avoid breaking API flow if file logging fails.
  }

  if (level === 'error') {
    console.error(line.trim())
  } else if (level === 'warn') {
    console.warn(line.trim())
  } else {
    console.log(line.trim())
  }
}

function info(message, meta) {
  writeLog('info', message, meta)
}

function warn(message, meta) {
  writeLog('warn', message, meta)
}

function error(message, meta) {
  writeLog('error', message, meta)
}

module.exports = {
  info,
  warn,
  error,
  eventsLogPath,
}
