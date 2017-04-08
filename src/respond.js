/* global require module */
const responses = require('./responses.js');
const logger = require('./logger.js').forComponent('respond');

// This cache is global across all respond objects, so we initialize it here
const cache = require('./cache.js').init();

// Alexa doesn't like ampersands in SSML
function cleanSSMLResponse(response) {
  return response.replace(/&/g, 'and');
}

function convertToNonSSML(response) {
  return response.replace(/<(?:.|\n)*?>/gm, '');
}

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

function Respond(requestContext, useSSML = false) {
  this.requestContext = requestContext;
  this.cache = cache.forRequest(requestContext);
  this.logger = logger.forRequest(requestContext);
  this.useSSML = useSSML;
}

/* THIS SHOULD BE PRIVATE */
Respond.prototype.rotateResponse = function(responseKey, responses) {
  this.logger.debug('pre_rotate_response', {
    responseKey
  });

  if (!responses || !responses.length) {
    this.logger.debug('post_rotate_response', {
      responseKey,
      success: false,
      error: 'array is empty or undefined'
    });
    return null;
  }

  const userId = this.requestContext.getUserId();
  const cacheKey = `${userId}.${responseKey}.nextIndex`;

  if (!this.cache.has(cacheKey)) {
    this.cache.set(cacheKey, 0);
  }

  const index = this.cache.get(cacheKey);
  const modIndex = index % responses.length;

  this.cache.set(cacheKey, modIndex + 1);

  this.logger.debug('post_rotate_response', {
    responseKey,
    success: true,
    index,
    modIndex
  });

  return responses[index % responses.length];
};

Respond.prototype.s = function(responseKey, params = {}) {
  let response = responses[responseKey];
  if (typeof response === 'function') {
    response = response(params);
  }

  if (Array.isArray(response)) {
    response = this.rotateResponse(responseKey, response);
  }

  if (!response) {
    this.logger.error('missing_responseKey', {
      responseKey,
      responseParams: JSON.stringify(params)
    });
    return responses.keyMissing;
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

  if (this.useSSML) {
    return cleanSSMLResponse(result);
  } else {
    return convertToNonSSML(result);
  }
};

module.exports = {
  forRequest
};
