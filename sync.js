require('dotenv').config()

const {
  getEcobeeThermostats,
  getEcobeeRuntimeReport
} = require('./lib/ecobee_request')
const _ = require('lodash')
const moment = require('moment')
const { RuntimeRecord } = require('./models')
const Promise = require('bluebird')

async function main () {
  await RuntimeRecord.ensureIndexes()

  const thermostats = await getEcobeeThermostats()

  console.log(thermostats)

  const thermostatIds = _.map(thermostats, 'identifier')
  const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD')
  const endDate = moment().format('YYYY-MM-DD')
  const report = await getEcobeeRuntimeReport(thermostatIds, startDate, endDate)

  console.log(report.length)

  await Promise.resolve(report).map((data) => {
    return RuntimeRecord.findOneAndUpdate(
      {
        thermostat_id: data.thermostatId,
        timestamp: moment(`${data.date} ${data.time}`, 'YYYY-MM-DD hh:mm:ss').toISOString()
      },
      {
        cooling_duration_seconds: data.compCool1,
        heating_duration_seconds: data.compHeat1,
        fan_duration_seconds: data.fan
      },
      {
        new: true,
        upsert: true
      }
    )
  }, {
    concurrency: 100
  })

  process.exit(0)
}

main()
