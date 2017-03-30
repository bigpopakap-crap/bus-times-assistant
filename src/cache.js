/* global module */
const THIS_COMPONENT_NAME = 'cache';
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME).forRequest();
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME).forRequest();

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
}

Cache.prototype.prune = function() {
  logger.debug('pre_prune');
  const perfBeacon = perf.start('prune');

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

  logger.debug('post_prune', {
    numTotalBefore: numTotal,
    numDeleted
  });

  perfBeacon.logEnd(null, {
    numTotalBefore: numTotal,
    numDeleted
  });
};

Cache.prototype.set = function(key, data = {}, minutesOfLife = 30) {
  logger.debug('set', {
    key,
    data: JSON.stringify(data),
    minutesOfLife
  });

  this.prune();
  const expiryDate = new Date(new Date().getTime() + minutesOfLife * 60000);
  this.data[key] = new CacheItem(key, data, expiryDate);
};

Cache.prototype.clear = function(key) {
  logger.debug('clear', { key });
  this.prune();
  delete this.data[key];
};

Cache.prototype.get = function(key) {
  logger.debug('get', { key });
  this.prune();
  return this.data[key].getData();
};

Cache.prototype.has = function(key) {
  logger.debug('has', { key });
  this.prune();
  return Boolean(this.data[key]);
};

module.exports = Cache;
