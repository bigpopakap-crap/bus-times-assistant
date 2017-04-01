/* global process module */
'use strict';

// TODO add a conversation ID?
// TODO add the deployed SHA?
// TODO add the original query?
// TODO add startTime to get the call's duration?
// TODO add the ability to set isError?
// TODO add the intent name (if applicable)

const SCOPE = '$busTimesAssistant$';

const PARAMS = {
  REQUEST_ID: 'requestId',
  APP_SOURCE: 'appSource',
  USER_ID: 'userId',
  HEROKU_SLUG_COMMIT: 'heroku_slugCommit',
  HEROKU_SLUG_DESC: 'heroku_slugDescription',
  HEROKU_RELEASE_VERSION: 'heroku_releaseVersion',
  HEROKU_RELEASE_CREATED_AT: 'heroku_releaseCreatedAt'
};

function RequestContext(obj = {}) {
  // don't overwrite this if it's already been set!
  if (!obj[SCOPE]) {
    obj[SCOPE] = {};
  }

  this.set = function(key, value) {
    obj[SCOPE][key] = value;
  };

  this.get = function(key) {
    return key ? obj[SCOPE][key] : obj[SCOPE];
  };

  // default the parameters that we can
  this.setHerokuSlugCommit(process.env.HEROKU_SLUG_COMMIT);
  this.setHerokuSlugDesc(process.env.HEROKU_SLUG_DESCRIPTION);
  this.setHerokuReleaseVersion(process.env.HEROKU_RELEASE_VERSION);
  this.setHerokuReleaseCreatedAt(process.env.HEROKU_RELEASE_CREATED_AT);
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

RequestContext.prototype.setHerokuSlugCommit = function(herokSlugCommit) {
  this.set(PARAMS.HEROKU_SLUG_COMMIT, herokSlugCommit);
};

RequestContext.prototype.setHerokuSlugDesc = function(herokuSlugDesc) {
  this.set(PARAMS.HEROKU_SLUG_DESC, herokuSlugDesc);
};

RequestContext.prototype.setHerokuReleaseVersion = function(herokuReleaseVersion) {
  this.set(PARAMS.HEROKU_RELEASE_VERSION, herokuReleaseVersion);
};

RequestContext.prototype.setHerokuReleaseCreatedAt = function(herokuReleaseCreatedAt) {
  this.set(PARAMS.HEROKU_RELEASE_CREATED_AT, herokuReleaseCreatedAt);
};

RequestContext.prototype.toJSON = function() {
  return this.get();
};

RequestContext.prototype.copyTo = function(newObj) {
  const newRequestContext = new RequestContext(newObj);

  Object.keys(thisJSON).forEach(key => {
    newRequestContext.set(key, this.get(key));
  });
};

module.exports = RequestContext;
