require('dotenv').config()

const { RuntimeRecord } = require('./models')
const _ = require('lodash')
const moment = require('moment')
const { HVAC_DATA } = require('./hvac_data')
const { zapierPush } = require('./lib/zapier')

const VOLTAGE = process.env.VOLTAGE || 240
const PRICE_PER_KWH = process.env.PRICE_PER_KWH || 0.14

const HOUR_IN_SECONDS = 3600

function convertResultsToPowerResults ({ cooling, heating, fan }, k) {
  const hvacType = process.env[`ECOBEE_THERMOSTAT_${k}`]
  const { compressorAmps, fanAmps } = HVAC_DATA[hvacType]
  const compressorKwh = ((cooling + heating) / HOUR_IN_SECONDS) * (compressorAmps * VOLTAGE / 1000)
  const fanKwh = (fan / HOUR_IN_SECONDS) * (fanAmps * VOLTAGE / 1000)

  return {
    kwhConsumption: compressorKwh + fanKwh
  }
}

function total (results, key) {
  return {
    [key]: _.chain(results).map(key).sum().valueOf()
  }
}

async function main () {
  const agg = await RuntimeRecord
    .aggregate()
    .project({
      thermostat_id: 1,
      date: {
        $dateToString: {
          format: '%Y%m%d',
          date: '$timestamp',
          timezone: 'America/New_York'
        }
      },
      cooling_duration_seconds: 1,
      heating_duration_seconds: 1,
      fan_duration_seconds: 1
    })
    .group({
      _id: {
        thermostat_id: '$thermostat_id',
        date: '$date'
      },
      cooling: {
        $sum: '$cooling_duration_seconds'
      },
      heating: {
        $sum: '$heating_duration_seconds'
      },
      fan: {
        $sum: '$fan_duration_seconds'
      }
    })
    .exec()

  const results = _.chain(agg)
    .map((result) => {
      result = {
        ...result._id,
        ...result,
      }
      delete result._id

      return result
    })
    .groupBy('date')
    .mapValues((dateResults) => {
      dateResults = _.chain(dateResults)
        .keyBy('thermostat_id')
        .mapValues((obj) => {
          return _.pick(obj, [
            'cooling',
            'heating',
            'fan'
          ])
        })
        .valueOf()

      const powerResults = _.mapValues(dateResults, convertResultsToPowerResults)

      const powerUsage = _.chain(powerResults).map('kwhConsumption').sum().valueOf()
      const powerCost = powerUsage * PRICE_PER_KWH

      return powerCost
    })
    .valueOf()

  const yesterday = moment().subtract(1, 'day').format('YYYYMMDD')
  const yesterdayResults = results[yesterday]

  const monthlyResults = _.chain(results)
    .map((v, k) => {
      return { k, v }
    })
    .groupBy((obj) => {
      return moment(obj.k, 'YYYYMMDD').format('YYYY-MM')
    })
    .mapValues(objs => _.map(objs, 'v'))
    .mapValues(v => _.sum(v))
    .map((v, k) => {
      return {
        month: k,
        cost: Math.round(v * 100) / 100
      }
    })
    .orderBy('month', 'desc')
    .map(obj => {
      obj.month = moment(obj.month, 'YYYY-MM').format('MMM YYYY')
      return obj
    })
    .valueOf()

  monthlyResults.unshift({
    month: moment(yesterday, 'YYYYMMDD').format('MMM D YYYY'),
    cost: Math.round(yesterdayResults * 100) / 100
  })

  await zapierPush(monthlyResults)

  console.log(monthlyResults)

  process.exit(0)
}

main()
