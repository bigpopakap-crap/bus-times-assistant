/* global require module */
const GoogleAssistant = require('./google-assistant.js');
const AlexaAssistant = require('./alexa-assistant.js');
const { APP_SOURCE } = require('./ai-config-appSource.js');

function forRequest(requestContext) {
  switch (requestContext.getAppSource()) {
    case APP_SOURCE.GOOGLE:
      return new GoogleAssistant(requestContext);
    case APP_SOURCE.ALEXA:
      return new AlexaAssistant(requestContext);
  }
}

module.exports = {
  forRequest
};
