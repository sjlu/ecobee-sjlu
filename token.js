require('dotenv').config()

const { ecobeeTokenRequest } = require('./lib/ecobee_request')
const _ = require('lodash')

async function main () {
  console.log(process.argv)
  console.log(await ecobeeTokenRequest(process.argv[2]))
}

main()
