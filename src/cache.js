/* global module */
// TODO add logging to the cache, including latency for pruning and stuff

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
  const now = new Date().getTime();

  Object.keys(this.data).forEach(key => {
    const cacheItem = this.data[key];

    if (now > cacheItem.getExpiryDate().getTime()) {
      delete this.data[key];
    }
  });
};

Cache.prototype.set = function(key, data = {}, minutesOfLife = 30) {
  this.prune();
  const expiryDate = new Date(new Date().getTime() + minutesOfLife * 60000);
  this.data[key] = new CacheItem(key, data, expiryDate);
};

Cache.prototype.clear = function(key) {
  this.prune();
  delete this.data[key];
};

Cache.prototype.get = function(key) {
  this.prune();
  return this.data[key].getData();
};

Cache.prototype.has = function(key) {
  this.prune();
  return Boolean(this.data[key]);
};

module.exports = Cache;
