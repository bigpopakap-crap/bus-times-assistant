/* global require module */
const CommonAssistant = require('./common-assistant.js');

class AlexaAssistant extends CommonAssistant {
  constructor(response, requestContext) {
    super(requestContext);
    this.response = response;
  }

  tell(str) {
    this.response.say(str);
  }

  ask(str) {
    this.response.reprompt(str);
  }
}

module.exports = AlexaAssistant;
