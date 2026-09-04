const path = require('path')
const envFilePath = path.resolve(__dirname, '.env')
require('dotenv').config({ path: envFilePath })
const app = require('./app')
const { port } = require('./config')

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${port}`)
})
