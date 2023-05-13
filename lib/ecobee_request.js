const Promise = require('bluebird')
const request = Promise.promisify(require('request'))
const _ = require('lodash')

const BASE_URL = 'https://api.ecobee.com'

async function ecobeeRequest (req) {
  req = _.defaultsDeep(req, {
    baseUrl: BASE_URL,
    json: true
  })

  return await request(req)
}

async function ecobeePinRequest () {
  const req = {
    method: 'GET',
    url: '/authorize',
    qs: {
      response_type: 'ecobeePin',
      client_id: process.env.ECOBEE_CLIENT_ID,
      scope: 'smartRead'
    }
  }

  const resp = await ecobeeRequest(req)
  return resp.body
}

async function ecobeeTokenRequest (code) {
  const req = {
    method: 'POST',
    url: '/token',
    qs: {
      grant_type: 'ecobeePin',
      code,
      client_id: process.env.ECOBEE_CLIENT_ID,
      ecobee_type: 'jwt'
    }
  }

  const resp = await ecobeeRequest(req)
  return resp.body
}

async function ecobeeAccessTokenRequest (refreshToken) {
  const req = {
    method: 'POST',
    url: '/token',
    qs: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.ECOBEE_CLIENT_ID,
      ecobee_type: 'jwt'
    }
  }

  const resp = await ecobeeRequest(req)
  return resp.body
}

let currentToken = null
async function ecobeeApiRequest (req) {
  if (currentToken == null) {
    const token = await ecobeeAccessTokenRequest(process.env.ECOBEE_REFRESH_TOKEN)
    currentToken = token
  }

  req = _.defaultsDeep(req, {
    headers: {
      authorization: `${currentToken.token_type} ${currentToken.access_token}`
    }
  })

  const resp = await ecobeeRequest(req)
  return resp
}

async function getEcobeeThermostats () {
  const req = {
    method: 'GET',
    url: '/1/thermostat',
    qs: {
      json: JSON.stringify({
        selection: {
          selectionType: 'registered',
          selectionMatch: ''
        }
      })
    }
  }

  const resp = await ecobeeApiRequest(req)
  return resp.body.thermostatList
}

function formatReport (body) {
  let columns = body.columns.split(',')
  columns.unshift('time')
  columns.unshift('date')

  return _.flatMap(body.reportList, (thermostatReport) => {
    const thermostatId = thermostatReport.thermostatIdentifier
    return _.map(thermostatReport.rowList, (row) => {
      return {
        thermostatId,
        ..._.zipObject(columns, row.split(','))
      }
    })
  })
}

async function getEcobeeRuntimeReport (thermostatIds, startDate, endDate) {
  const req = {
    method: 'GET',
    url: '/1/runtimeReport',
    qs: {
      format: 'json',
      body: JSON.stringify({
        startDate,
        endDate,
        columns: [
          'hvacMode',
          'compCool1',
          'compCool2',
          'compHeat1',
          'compHeat2',
          'fan'
        ].join(','),
        selection: {
          selectionType: 'thermostats',
          selectionMatch: thermostatIds.join(',')
        }
      })
    }
  }

  const resp = await ecobeeApiRequest(req)
  return formatReport(resp.body)
}

module.exports = {
  ecobeeRequest,
  ecobeePinRequest,
  ecobeeTokenRequest,
  getEcobeeThermostats,
  getEcobeeRuntimeReport
}
