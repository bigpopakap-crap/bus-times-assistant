/* global module */
'use strict';

/* BEGIN INTENT OBJECT ******************************* */
function Intent(name, alexaName, humanName, intentParams = []) {
  this.name = name;
  this.alexaName = alexaName;
  this.humanName = humanName;
  this.intentParams = intentParams;
}

Intent.prototype.getName = function() { return this.name; };
Intent.prototype.getAlexaName = function() { return this.alexaName; };
Intent.prototype.getHumanName = function() { return this.humanName; };
Intent.prototype.getIntentParams = function() { return this.intentParams; };

Intent.prototype.getAlexaSlots = function() {
  const slots = {};

  this.intentParams.forEach(param => {
    slots[param.getAlexaName()] = param.getAlexaType();
  });

  return { slots };
};

/*
 * THIS SHOULD BE PRIVATE
 */
Intent.prototype.getAlexaAliases = function() {
  const params = {};

  this.intentParams.forEach(param => {
    const paramName = param.getName();

    if (!params[paramName]) {
      params[paramName] = [];
    }

    params[paramName].push(param.getAlexaName());
  });

  return params;
};

Intent.prototype.getAlexaValue = function(paramName, request) {
  const aliases = this.getAlexaAliases()[paramName];

  let value = null;
  aliases.forEach(alias => {
    value = value || request.slot(alias);
  });

  return value;
};

/* BEGIN INTENT PARAMS OBJECT ************************* */
function IntentParam(name, alexaName, alexaType) {
  this.name = name;
  this.alexaName = alexaName;
  this.alexaType = alexaType;
}

IntentParam.prototype.getName = function() { return this.name; };
IntentParam.prototype.getAlexaName = function() { return this.alexaName; };
IntentParam.prototype.getAlexaType = function() { return this.alexaType; };

/* BEGIN INTENT DEFS ********************************* */
const GET_MY_LOCATION = new Intent(
  'get_my_location',
  'get_my_location',
  'Get my location'
);

const UPDATE_MY_LOCATION = new Intent(
  'update_my_location',
  'update_my_location',
  'Update my location', [
  new IntentParam('address', 'address', 'AMAZON.PostalAddress')
]);

const GET_NEAREST_BUS_BY_ROUTE = new Intent(
  'get_nearest_bus_times_by_route',
  'get_nearest_bus_times_by_route',
  'Get nearest bus times by route', [
  new IntentParam('busRoute', 'busNumber', 'AMAZON.NUMBER'),
  new IntentParam('busRoute', 'busLetter', 'LETTERS'),
  new IntentParam('busDirection', 'busDirectionPost', 'BUSDIRECTION_POST'),
  new IntentParam('busDirection', 'busDirectionPre', 'BUSDIRECTION_PRE')
]);

const GET_NEAREST_BUS_BY_ROUTE_FALLBACK = new Intent(
  'get_nearest_bus_times_by_route_fallback',
  null,
  GET_NEAREST_BUS_BY_ROUTE.getHumanName(),
  GET_NEAREST_BUS_BY_ROUTE.getIntentParams()
);

const WELCOME = new Intent('default_welcome', 'default_welcome', 'Hello');
const HELP = new Intent('help_me', 'AMAZON.HelpIntent', 'Help');
const THANK_YOU = new Intent('thank_you', 'thank_you', 'Cancel');
const CANCEL = new Intent('cancel', 'AMAZON.StopIntent', 'Cancel');

module.exports = {
  GET_MY_LOCATION,
  UPDATE_MY_LOCATION,
  GET_NEAREST_BUS_BY_ROUTE,
  GET_NEAREST_BUS_BY_ROUTE_FALLBACK,
  WELCOME,
  HELP,
  THANK_YOU,
  CANCEL
};
