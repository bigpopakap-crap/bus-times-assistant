/* global module */
// Alexa doesn't like ampersands in SSML
function cleanSSMLResponse(str) {
  return str.replace(/&/g, 'and');
}

function convertToNonSSML(str) {
  return str.replace(/<(?:.|\n)*?>/gm, '');
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

function getMissingParams(str) {
  const { missingParams } = replaceParams(str, {});
  return missingParams;
}

class Response {
  constructor(str, isSSML) {
    this.key = 'KEY_IS_UNSET';
    this.str = str;
    this.isSSML = isSSML;
  }

  // THIS IS pretty janky, but it's here mostly for logging
  setKey(key) { this.key = key; return this; }
  getKey() { return this.key; }

  getPlainStr() {
    return convertToNonSSML(this.str);
  }

  getSSML() {
    if (this.isSSML) {
      return cleanSSMLResponse(`<speak>${this.str}</speak>`);
    } else {
      return this.getPlainStr();
    }
  }

  hasMissingParams() {
    const missingParams = this.getMissingParams();
    return missingParams && missingParams.length > 0;
  }

  getMissingParams() {
    return getMissingParams(this.str);
  }

  replaceParams(params) {
    const { result } = replaceParams(this.str, params);
    return new Response(result, this.isSSML).setKey(this.getKey());
  }
}

module.exports = Response;