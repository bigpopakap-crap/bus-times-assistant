'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let Assistant = require('actions-on-google');
let express = require('express');
let bodyParser = require('body-parser');

const app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

const GET_12_CESAR_CHAVEZ_TIMES = 'get_12_cesar_chaves_times';

const actionMap = new Map();
actionMap.set(GET_12_CESAR_CHAVEZ_TIMES, function(assistant) {
  assistant.tell('Hey, I am in development. What do you expect of me?');
});

app.post('/', function (request, response) {
  const assistant = new Assistant({request: request, response: response});
  assistant.handleRequest(actionMap);
  response.sendStatus(200);
});

// Start the server
var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});