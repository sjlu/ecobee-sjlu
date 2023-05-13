const mongoose = require('mongoose')

// set connection options
const opts = {
  maxPoolSize: 100,
  autoIndex: false
}

// connect
function connect () {
  console.info({ status: 'connecting' }, 'MONGOOSE')
  const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/ecobee-sjlu'
  mongoose.connect(MONGODB_URL, opts)
}

// try reconnecting on failures
function reconnect () {
  if (mongoose.connection.readyState === 1) {
    return
  }

  connect()
}

// catch all errors
mongoose.connection.on('error', function (err) {
  console.error(err, 'MONGOOSE_CONNECTION_ERROR')
  mongoose.disconnect()
})

// reconnect if disconnected
mongoose.connection.on('disconnected', function () {
  console.warn({ status: 'disconnected' }, 'MONGOOSE')
  setTimeout(reconnect, 2000)
})

mongoose.connection.on('connected', function () {
  console.info({ status: 'connected' }, 'MONGOOSE')
})

// init
try {
  connect()
} catch (e) {
  console.error(e, 'MONGOOSE_CONNECTION_ERROR')
}

module.exports = mongoose
