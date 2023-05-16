const Promise = require('bluebird')
const request = Promise.promisify(require('request'))

async function zapierPush (body) {
  await request({
    method: 'POST',
    url: process.env.ZAPIER_WEBHOOK_URL,
    body,
    json: true
  })
}

module.exports = {
  zapierPush
}
