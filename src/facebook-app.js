/* global require module process */
'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const MessengerPlatform = require('facebook-bot-messenger');

const { APP_SOURCE } = require('./ai-config-appSource.js');
const { RequestContext } = require('mrkapil/logging');
const INTENTS = require('./ai-config-intents.js');

const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).google;

const app = express();
app.use(bodyParser.json({ type: 'application/json' }));

const fbAssistant = MessengerPlatform.create({
  pageID: process.env.FB_MESSENGER_PAGE_ID,
  appID: process.env.FB_MESSENGER_APP_ID,
  appSecret: process.env.FB_MESSENGER_APP_SECRET,
  validationToken: process.env.FB_MESSENGER_API_AI_VERIFY_TOKEN,
  pageToken: process.env.FB_MESSENGER_PAGE_ACCESS_TOKEN
}, require('http').Server(app));

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

app.use(fbAssistant.webhook('/'));

fbAssistant.on(MessengerPlatform.Events.MESSAGE, (userId, message) => {
  // TODO add userId to request context

  // TODO log to dashbot

  // TODO actually handle the request
  console.log(userId);
  console.log(message);
});

// TODO add a log when the app starts

module.exports = app;
