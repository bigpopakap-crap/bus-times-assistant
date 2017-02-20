'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

let Assistant = require('actions-on-google');
let express = require('express');
let bodyParser = require('body-parser');

const app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

const GENERATE_ANSWER_ACTION = 'generate_answer';
const CHECK_GUESS_ACTION = 'check_guess';

app.post('/', function (request, response) {
  console.log('headers: ' + JSON.stringify(request.headers));
  console.log('body: ' + JSON.stringify(request.body));

  const assistant = new Assistant({request: request, response: response});
  response.sendStatus(200); // OK
});

// Start the server
var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});