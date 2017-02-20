'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-json');

const app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

const nbClient = request.createClient('http://restbus.info/');

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const GET_12_CESAR_CHAVEZ_TIMES = 'get_12_cesar_chavez_times';

function generatePredictionResponse(p) {
  const pTypeLabel = p.isScheduleBased ? 'is scheduled to arrive' : 'will arrive';
  const minuteLabel = p.minutes == 1 ? 'minute' : 'minutes';
  return `${pTypeLabel} in ${p.minutes} ${minuteLabel}`;
}

function handle12CesarChavezTimes(assistant) {
  nbClient.get('/api/agencies/sf-muni/routes/12/stops/7552/predictions', function(err, res, body) {
    if (err) {
      assistant.tell('There was an error connecting to NextBus.');
    } else {
      const allPredictions = body[0].values;
      const inboundPredictions = allPredictions.filter(p => p.direction.id === '12___I_F00');
      const sortedInboundPredictions = inboundPredictions.sort((a, b) => a.epochTime - b.epochTime);

      if (sortedInboundPredictions.length <= 0) {
        assistant.tell('No predictions found.');
      } else {
        const p1 = sortedInboundPredictions[0];
        const p1Response = generatePredictionResponse(p1);

        let response = `Next 12 from Cesar Chavez and Folsom to downtown ${p1Response}.`;

        if (sortedInboundPredictions.length > 1) {
          const p2 = sortedInboundPredictions[1];
          const p2Response = generatePredictionResponse(p2);
          response = `${response} After that, the next bus ${p2Response}.`
        }

        assistant.tell(response);
      }
    }
  });
}

app.get('/', function(request, response) {
  response.sendStatus(200);
});

app.post('/', function (request, response) {
  const assistant = new ApiAiAssistant({request: request, response: response});

  const actionMap = new Map();
  actionMap.set(GET_12_CESAR_CHAVEZ_TIMES, handle12CesarChavezTimes);

  assistant.handleRequest(actionMap);
});

// Start the server
var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});