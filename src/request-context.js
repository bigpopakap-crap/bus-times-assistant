// TODO add a conversation ID?
// TODO add the deployed SHA?
// TODO add the original query?
// TODO add startTime to get the call's duration?
// TODO add the ability to set isError?

const SCOPE = '$busTimesAssistant$';

const PARAMS = {
  REQUEST_ID: 'requestId',
  APP_SOURCE: 'appSource',
  USER_ID: 'userId'
};

function RequestContext(rawRequest) {
  // don't overwrite this if it's already been set!
  if (!rawRequest[SCOPE]) {
    rawRequest[SCOPE] = {};
  }

  this.set = function(key, value) {
    rawRequest[SCOPE][key] = value;
  }

  this.get = function(key) {
    return key ? rawRequest[SCOPE][key] : rawRequest[SCOPE];
  }
}

RequestContext.prototype.setRequestId = function(requestId) {
  this.set(PARAMS.REQUEST_ID, requestId);
};

RequestContext.prototype.getRequestId = function() {
  return this.get(PARAMS.REQUEST_ID);
};

RequestContext.prototype.setAppSource = function(appSource) {
  this.set(PARAMS.APP_SOURCE, appSource);
};

RequestContext.prototype.getAppSource = function() {
  return this.get(PARAMS.APP_SOURCE);
};

RequestContext.prototype.setUserId = function(userId) {
  this.set(PARAMS.USER_ID, userId);
};

RequestContext.prototype.getUserId = function() {
  return this.get(PARAMS.USER_ID);
};

RequestContext.prototype.toJSON = function() {
  return this.get();
};

RequestContext.prototype.copyTo = function(newObject) {
  const thisJSON = this.toJSON();
  const newRequestContext = new RequestContext(newObject);

  Object.keys(thisJSON).forEach(key => {
    newRequestContext.set(key, thisJSON[key]);
  });
};

module.exports = RequestContext;
