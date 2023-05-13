const _ = require('lodash')
const mongoose = require('../lib/mongoose')

const RuntimeRecord = mongoose.Schema({
  thermostat_id: {
    type: String
  },
  timestamp: {
    type: Date
  },
  cooling_duration_seconds: {
    type: Number,
    default: 0
  },
  heating_duration_seconds: {
    type: Number,
    default: 0
  },
  fan_duration_seconds: {
    type: Number,
    default: 0
  }
})

RuntimeRecord.index({
  thermostat_id: 1,
  timestamp: 1
}, {
  unique: true
})

const toOpts = {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret, options) {
    return _.omit(ret, [])
  }
}

RuntimeRecord.set('toObject', toOpts)
RuntimeRecord.set('toJSON', toOpts)

module.exports = mongoose.model('RuntimeRecord', RuntimeRecord)
