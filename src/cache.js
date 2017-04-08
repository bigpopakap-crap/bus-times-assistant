/* global require module */
const THIS_COMPONENT_NAME = 'cache';
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);

// if pruning the caches takes more than half a second,
// then we have a problem
const CACHE_PRUNE_TIME_LIMIT_MILLIS = 500;

function CacheItem(key, data, expiryDate) {
  this.key = key;
  this.data = data;
  this.expiryDate = expiryDate;
}

CacheItem.prototype.getKey = function() { return this.key; };
CacheItem.prototype.getData = function() { return this.data; };
CacheItem.prototype.getExpiryDate = function() { return this.expiryDate; };

function Cache() {
  this.data = {};
}

Cache.init = function() {
  return new Cache();
};

Cache.prototype.forRequest = function(requestContext) {
  return new CacheAccessor(this.data, requestContext);
};

function CacheAccessor(data, requestContext) {
  this.data = data;
  this.requestContext = requestContext;

  this.logger = logger.forRequest(requestContext);
}

CacheAccessor.prototype.prune = function() {
  const startDate = new Date();
  this.logger.trace('pre_prune');

  let numTotal = 0;
  let numDeleted = 0;
  const now = new Date().getTime();

  Object.keys(this.data).forEach(key => {
    const cacheItem = this.data[key];
    numTotal++;

    if (now > cacheItem.getExpiryDate().getTime()) {
      delete this.data[key];
      numDeleted++;
    }
  });

  const endDate = new Date();
  let logLevel = this.logger.LEVEL.TRACE;
  if (endDate.getTime() - startDate.getTime() > CACHE_PRUNE_TIME_LIMIT_MILLIS) {
    logLevel = this.logger.LEVEL.WARN;
  }

  this.logger.log(logLevel, 'post_prune', {
    numTotalBefore: numTotal,
    numDeleted
  });
};

CacheAccessor.prototype.set = function(key, data = {}, minutesOfLife = 30) {
  this.logger.trace('set', {
    key,
    data: JSON.stringify(data),
    minutesOfLife
  });

  this.prune();
  const expiryDate = new Date(new Date().getTime() + minutesOfLife * 60000);
  this.data[key] = new CacheItem(key, data, expiryDate);
};

CacheAccessor.prototype.clear = function(key) {
  this.logger.trace('clear', { key });
  this.prune();
  delete this.data[key];
};

CacheAccessor.prototype.get = function(key) {
  this.logger.trace('get', { key });
  this.prune();
  return this.data[key].getData();
};

CacheAccessor.prototype.has = function(key) {
  this.logger.trace('has', { key });
  this.prune();
  return Boolean(this.data[key]);
};

module.exports = Cache;
