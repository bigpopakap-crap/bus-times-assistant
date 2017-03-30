/* global require module */
const THIS_COMPONENT_NAME = 'cache';
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);

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
  this.perf = perf.forRequest(requestContext);
}

CacheAccessor.prototype.prune = function() {
  this.logger.debug('pre_prune');
  const perfBeacon = this.perf.start('prune');

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

  this.logger.debug('post_prune', {
    numTotalBefore: numTotal,
    numDeleted
  });

  perfBeacon.logEnd(null, {
    numTotalBefore: numTotal,
    numDeleted
  });
};

CacheAccessor.prototype.set = function(key, data = {}, minutesOfLife = 30) {
  this.logger.debug('set', {
    key,
    data: JSON.stringify(data),
    minutesOfLife
  });

  this.prune();
  const expiryDate = new Date(new Date().getTime() + minutesOfLife * 60000);
  this.data[key] = new CacheItem(key, data, expiryDate);
};

CacheAccessor.prototype.clear = function(key) {
  this.logger.debug('clear', { key });
  this.prune();
  delete this.data[key];
};

CacheAccessor.prototype.get = function(key) {
  this.logger.debug('get', { key });
  this.prune();
  return this.data[key].getData();
};

CacheAccessor.prototype.has = function(key) {
  this.logger.debug('has', { key });
  this.prune();
  return Boolean(this.data[key]);
};

module.exports = Cache;
