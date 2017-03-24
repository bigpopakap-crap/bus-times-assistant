const logger = require('./logger.js').forComponent('logger-perf');
const beaconLogger = require('./logger.js').forComponent('logger-perf-beacon');

const metricsBase = require('./logger-metrics.js'); // not "for component" yet
const { EVENT_TYPE } = metricsBase;

const { prefixObject, extendObject } = require('./utils.js');

function forComponent(componentName) {
  return {
    forRequest(appSource, userId, requestContext = {}) {
      return new LatencyLogger(componentName, appSource, userId, requestContext);
    }
  };
}

function LatencyLogger(componentName, appSource, userId, requestContext = {}) {
  this.componentName = componentName;
  this.appSource = appSource;
  this.userId = userId;
  this.requestContext = requestContext;
  this.logger = logger.forRequest(appSource, userId, requestContext);
}

LatencyLogger.prototype.start = function(event, extraParams = {}) {
  this.logger.debug('pre_latency', {
    event,
    startParams: JSON.stringify(extraParams)
  });

  return new LatencyBeacon(this.componentName, this.appSource, this.userId, this.requestContext,
                          event, extraParams);
}

function LatencyBeacon(componentName, appSource, userId, requestContext,
                       event, extraParams = {}) {
  this.componentName = componentName;
  this.appSource = appSource;
  this.userId = userId;
  this.requestContext = requestContext;
  this.event = event;
  this.startParams = extraParams;

  this.logger = beaconLogger.forRequest(appSource, userId, requestContext);
  this.metrics = metricsBase.forComponent(componentName).forRequest(appSource, userId, requestContext);

  this.startDate = new Date();
  this.hasLogged = false;

  this.logger.debug('create_beacon', {
    event,
    startParams: JSON.stringify(this.startParams)
  });
}

LatencyBeacon.prototype.logEnd = function(error, extraParams = {}) {
  const endDate = new Date();
  const durationMillis = endDate.getTime() - this.startDate.getTime();

  if (this.hasLogged) {
    this.logger.warn('post_latency', {
      event: this.event,
      message: 'beacon already logged'
    });
    return;
  }

  this.logger.debug('post_latency', {
    event: this.event,
    startParams: JSON.stringify(this.startParams),
    error: JSON.stringify(error),
    endParams: JSON.stringify(extraParams)
  });

  const params = extendObject(
    prefixObject('start.', { date: this.startDate.toISOString() }),
    prefixObject('start.params.', this.startParams),
    prefixObject('end.', { date: endDate.toISOString() }),
    prefixObject('end.params.', extraParams),
    prefixObject('stats.', {
      durationMillis,
      isError: Boolean(error),
      error: JSON.stringify(error)
    })
  );

  this.metrics.logEvent(EVENT_TYPE.PERF,
          `${this.componentName} ${this.event}`, params);
}

module.exports = {
  forComponent
};
