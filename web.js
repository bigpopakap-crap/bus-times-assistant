'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

const GET_12_CESAR_CHAVEZ_TIMES = 'get_12_cesar_chaves_times';

app.get('/', function(request, response) {
  response.sendStatus(200);
});

app.post('/', function (request, response) {
  console.log(`
    Handling request\n
    headers: ${JSON.stringify(request.headers)}\n
    body: ${JSON.stringify(request.body)}
  `);

  const assistant = new ApiAiAssistant({request: request, response: response});

  const actionMap = new Map();
  actionMap.set(GET_12_CESAR_CHAVEZ_TIMES, function(assistant) {
    assistant.tell('Hey, I am in development. What do you expect of me?');
  });

  assistant.handleRequest(actionMap);
});

// Start the server
var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});