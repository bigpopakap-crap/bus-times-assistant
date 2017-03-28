/* global module */
'use strict';

const METRICS_EVENT_TYPE = {
  INTENT: 'User action',
  INTENT_RESPONSE: 'User action response',
  PERF: 'Telemetry',
  LOCATION_PERMISSION: 'Location permission'
};

const LOCATION_PERMISSION_PHASE = {
  REQUESTED: 'requested',
  RESPONDED: 'responded'
};

module.exports = {
  METRICS_EVENT_TYPE,
  LOCATION_PERMISSION_PHASE
};
