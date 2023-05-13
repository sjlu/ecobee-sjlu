require('dotenv').config()

const { ecobeePinRequest } = require('./lib/ecobee_request')
const _ = require('lodash')

async function main () {
  console.log(await ecobeePinRequest())
}

main()
