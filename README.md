## ecobee-sjlu

Scripts to help determine electricity usage and cost from ecobee runtime reports.

### Install

1. `docker-compose up` to run MongoDB assuming you have Docker installed.

2. `npm i` assuming you have Node.js installed.

3. Register for a developer account with ecobee - https://www.ecobee.com/en-us/developers/

4. Create an app using pin authentication method. You will get an API Key. Create a `.env` file with this as `ECOBEE_CLIENT_ID=<Api Key>`

5. `node pin.js` to start the authentication process. Keep note of the `ecobeePin` and `code`.

6. Take the `ecobeePin` and add it to your ecobee portal / My Apps.

7. `node token.js <code>` will then return you a `refresh_token`. Add that as `ECOBEE_REFRESH_TOKEN` in your `.env` file.

8. `node sync.js` to obtain data from ecobee. Keep in mind the thermostat identifiers. You'll need to add `ECOBEE_THERMOSTAT_<THERMOSTAT_ID>=` to your `.env` file with value being something in [hvac_data.js](hvac_data.js).

9. `node report.js` to aggregate data into a usage report.

### .env

Your `.env` file should look like this:

```
ECOBEE_CLIENT_ID=
ECOBEE_REFRESH_TOKEN=
ECOBEE_THERMOSTAT_X=VSHP-030
VOLTAGE=208
PRICE_PER_KWH=0.22
```
