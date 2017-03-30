/* global require module */
const responses = require('./responses.js');
const logger = require('./logger.js').forComponent('respond');

function replaceParams(str, params) {
  const missingParams = [];

  const result = str.replace(/{{([a-z]+)}}/gi, (match, v) => {
    const replacement = params[v];

    if (replacement) {
      return replacement;
    } else {
      missingParams.push(v);
      return v;
    }
  });

  return {
    result,
    missingParams
  };
}

function forRequest(requestContext) {
  return new Respond(requestContext);
}

function Respond(requestContext) {
  this.requestContext = requestContext;
  this.logger = logger.forRequest(requestContext);
}

Respond.prototype.saying = function(responseKey, params = {}) {
  let response = responses[responseKey];
  if (typeof response === 'function') {
    response = response(params);
  }

  if (!response) {
    this.logger.error('missing_responseKey', {
      responseKey,
      responseParams: JSON.stringify(params)
    });
    return responses['keyMissing'];
  }

  const { result, missingParams } = replaceParams(response, params);

  if (missingParams && missingParams.length > 0) {
    this.logger.warn('missing_responseParams', {
      responseKey,
      responseParams: JSON.stringify(params),
      result,
      missingParams
    });
  }

  return result;
};

module.exports = {
  forRequest
};
