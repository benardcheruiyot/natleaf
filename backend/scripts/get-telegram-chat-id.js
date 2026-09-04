require('dotenv').config()
const https = require('https')

const botToken = String(process.env.TELEGRAM_BOT_TOKEN || '').trim()

if (!botToken) {
  console.error('TELEGRAM_BOT_TOKEN is missing in backend/.env')
  process.exit(1)
}

https
  .get(`https://api.telegram.org/bot${botToken}/getUpdates`, (response) => {
    let body = ''
    response.setEncoding('utf8')
    response.on('data', (chunk) => {
      body += chunk
    })
    response.on('end', () => {
      try {
        const payload = JSON.parse(body)
        const updates = Array.isArray(payload.result) ? payload.result : []

        if (!updates.length) {
          console.log('No updates found. Send /start to the bot or add it to a group, then rerun this command.')
          return
        }

        const chats = new Map()
        for (const update of updates) {
          const chat = update.message?.chat || update.channel_post?.chat || update.my_chat_member?.chat
          if (!chat?.id) continue
          chats.set(String(chat.id), {
            id: chat.id,
            type: chat.type || 'unknown',
            title: chat.title || '',
            username: chat.username || '',
            first_name: chat.first_name || '',
            last_name: chat.last_name || '',
          })
        }

        if (!chats.size) {
          console.log('Updates exist, but no chat ID was found. Try sending a direct message to the bot and rerun.')
          return
        }

        console.log('Telegram chats found:')
        for (const entry of chats.values()) {
          console.log(JSON.stringify(entry))
        }
      } catch (error) {
        console.error('Failed to parse Telegram response:', error.message)
        process.exit(1)
      }
    })
  })
  .on('error', (error) => {
    console.error('Telegram request failed:', error.message)
    process.exit(1)
  })
