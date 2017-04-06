/* global require module */
const CommonAssistant = require('./common-assistant.js');

class GoogleAssistant extends CommonAssistant {
  constructor(assistant, requestContext) {
    super(requestContext);
    this.assistant = assistant;
  }

  tell(str) {
    this.assistant.tell(str);
  }

  ask(str) {
    this.assistant.ask(str);
  }
}

module.exports = GoogleAssistant;
