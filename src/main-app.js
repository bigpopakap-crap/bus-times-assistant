'use strict';

// default the config vars
process.env.DEBUG = process.env.DEBUG || 'actions-on-google:*';
process.env.PORT = process.env.PORT || 8080;

const express = require('express');
const bodyParser = require('body-parser');
const googleApp = require('./google-app.js');
const alexaApp = require('./alexa-app.js');
const logger = require('./logger.js');

const app = express();
app.set('port', process.env.PORT);

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

app.use('/google', googleApp);
app.use('/alexa', alexaApp);

// Start the server
var server = app.listen(app.get('port'), function () {
  logger.debug({
    event: 'app_listening',
    port: server.address().port,
    message: 'Press Ctrl+C to quit.'
  });
});
