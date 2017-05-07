/* global require module */
'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const { RequestContext } = require('mrkapil/logging');
const { APP_SOURCE } = require('./ai-config-appSource.js');
const initLogger = require('./logger.js').forComponent('api-ai-app');

const googleApp = require('./google-app.js');
const facebookApp = require('./facebook-app.js');

const app = express();
app.use(bodyParser.json({ type: 'application/json' }));
require('run-middleware')(app);

app.use('/google', googleApp);
app.use('/facebook', facebookApp);

function pipeMiddleware(path, request, response) {
  app.runMiddleware(path, {
    method: 'post',
    headers: request.headers,
    query: request.query,
    cookies: request.cookies,
    body: request.body
  }, (code, data) => {
    response.status(code).send(data);
  });
}

// TODO log as we redirect to platform-specific apps
app.post('/', function(request, response) {
  const requestContext = new RequestContext(request);
  const logger = initLogger.forRequest(requestContext);

  let source;
  try {
    source = request.body.originalRequest.source;
  } catch (ex) {
    source = 'NONEXISTENT';
  }

  switch (request.body.originalRequest.source) {
    case APP_SOURCE.GOOGLE:
      logger.info('redirect', {
        success: true,
        to: APP_SOURCE.GOOGLE
      });

      pipeMiddleware('/google', request, response);
      break;

    case APP_SOURCE.FACEBOOK:
      logger.info('redirect', {
        success: true,
        to: APP_SOURCE.FACEBOOK
      });

      pipeMiddleware('/facebook', request, response);
      break;

    default:
      // error!
      logger.error('redirect', {
        success: false,
        unexpectedSource: source
      });
      response.send(404);
      break;
  }
});

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

// TODO add a log when the app starts

module.exports = app;
