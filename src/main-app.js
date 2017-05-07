/* global process require */
'use strict';

// default the config vars
process.env.DEBUG = process.env.DEBUG || 'actions-on-google:*';
process.env.PORT = process.env.PORT || 8080;

const express = require('express');

const googleApp = require('./google-app.js');
const facebookApp = require('./facebook-app.js');
const alexaApp = require('./alexa-app.js');

const { RequestContext } = require('mrkapil/logging');

const initLogger = require('./logger.js').forComponent('main-app').forRequest();
const logger = require('./logger.js').forComponent('main-app');

if (initLogger.isDebugging()) {
  require('promise/lib/rejection-tracking').enable(
    { allRejections: true }
  );
}

const app = express();
app.set('port', process.env.PORT);

app.use(function(request, response, next) {
  const requestContext = new RequestContext(request);
  requestContext.setRequestId(request.headers['x-request-id']);

  logger.forRequest(requestContext).trace('request_received', {
    headers: JSON.stringify(request.headers)
    // Unfortunately we can't use bodyParser, because it breaks supapps for some reason
  });

  next();
});

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

app.use('/google', googleApp);
app.use('/facebook', facebookApp);
app.use('/alexa', alexaApp);

// Start the server
var server = app.listen(app.get('port'), function () {
  initLogger.debug('app_start', {
    port: server.address().port,
    message: 'Press Ctrl+C to quit.'
  });
});
