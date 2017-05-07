/* global require module process */
'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const { APP_SOURCE } = require('./ai-config-appSource.js');
const { RequestContext } = require('mrkapil/logging');
const INTENTS = require('./ai-config-intents.js');

const initLogger = require('./logger.js').forComponent('facebook-app').forRequest();

const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).google;

const app = express();
app.use(bodyParser.json({ type: 'application/json' }));

const {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleWelcome,
  handleHelp,
  handleThankYou,
  handleCancel
} = require('./facebook-handlers.js');

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

app.use(function(request, response, next) {
  // set appSource
  const requestContext = new RequestContext(request);
  requestContext.setAppSource(APP_SOURCE.FACEBOOK);
  next();
});

app.post('/', function(request, response) {
  console.log(request.body);
  console.log(request.body.originalRequest.data);
});

// TODO add a log when the app starts

module.exports = app;
