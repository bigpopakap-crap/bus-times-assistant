/* global process require */
'use strict';

// default the config vars
process.env.DEBUG = process.env.DEBUG || 'actions-on-google:*';
process.env.PORT = process.env.PORT || 8080;

const express = require('express');
const googleApp = require('./google-app.js');
const alexaApp = require('./alexa-app.js');
const RequestContext = require('./request-context.js');
const initLogger = require('./logger.js').forComponent('main-app').forRequest();

if (initLogger.isDebugging()) {
  require('promise/lib/rejection-tracking').enable(
    { allRejections: true }
  );
}

const app = express();
app.set('port', process.env.PORT);

app.use(function(request, response, next) {
  const requestId = request.headers['x-request-id'];
  new RequestContext(request).setRequestId(requestId);
  next();
});

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

app.use('/google', googleApp);
app.use('/alexa', alexaApp);

// Start the server
var server = app.listen(app.get('port'), function () {
  initLogger.debug('app_start', {
    port: server.address().port,
    message: 'Press Ctrl+C to quit.'
  });
});
