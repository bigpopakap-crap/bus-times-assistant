/* global require module */
'use strict';

const { RequestContext } = require('mrkapil/logging');

const logger = require('./logger.js').forComponent('logger-perf');
const beaconLogger = require('./logger.js').forComponent('logger-perf-beacon');
const metricsBase = require('./logger-metrics.js'); // not "for component" yet

const { prefixObject, extendObject } = require('mrkapil/utils');

function forComponent(componentName) {
  return {
    forRequest(requestContext = new RequestContext()) {
      return new LatencyLogger(componentName, requestContext);
    }
  };
}

function LatencyLogger(componentName, requestContext = new RequestContext()) {
  this.componentName = componentName;
  this.requestContext = requestContext;
  this.logger = logger.forRequest(requestContext);
}

LatencyLogger.prototype.start = function(event, extraParams = {}) {
  this.logger.trace('pre_latency', {
    event,
    startParams: JSON.stringify(extraParams)
  });

  return new LatencyBeacon(this.componentName, this.requestContext,
                          event, extraParams);
};

function LatencyBeacon(componentName, requestContext, event, extraParams = {}) {
  this.componentName = componentName;
  this.requestContext = requestContext;
  this.event = event;
  this.startParams = extraParams;

  this.logger = beaconLogger.forRequest(requestContext);
  this.metrics = metricsBase.forComponent(componentName).forRequest(requestContext);

  this.startDate = new Date();
  this.hasLogged = false;

  this.logger.trace('create_beacon', {
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

  this.logger.trace('post_latency', {
    event: this.event,
    startParams: JSON.stringify(this.startParams),
    error: JSON.stringify(error),
    endParams: JSON.stringify(extraParams)
  });

  const params = extendObject(
    {
      measuredEvent: this.event,
      fullyQualifiedMeasuredEvent: `${this.componentName}:${this.event}`
    },
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

  this.metrics.logPerf(params);
};

module.exports = {
  forComponent
};
