/* BEGIN INTENT OBJECT ******************************* */
function Intent(name, intentParams = []) {
  this.name = name;
  this.intentParams = intentParams;
}

Intent.prototype.getName = function() { return this.name; };
Intent.prototype.getIntentParams = function() { return this.intentParams; };

Intent.prototype.getAlexaSlots = function() {
  const slots = {};

  this.intentParams.forEach(param => {
    slots[param.getName()] = param.getAlexaType();
  });

  return { slots };
}

/* BEGIN INTENT PARAMS OBJECT ************************* */
function IntentParam(name, alexaType) {
  this.name = name;
  this.alexaType = alexaType;
}

IntentParam.prototype.getName = function() { return this.name; }
IntentParam.prototype.getAlexaType = function() { return this.alexaType; }

/* BEGIN INTENT DEFS ********************************* */
const GET_MY_LOCATION = new Intent('get_my_location');

const UPDATE_MY_LOCATION = new Intent(
  'update_my_location', [
  new IntentParam('address', 'AMAZON.PostalAddress')
]);

const GET_NEAREST_BUS_BY_ROUTE = new Intent(
  'get_nearest_bus_times_by_route', [
  new IntentParam('busRoute', 'AMAZON.NUMBER'),
  new IntentParam('busDirection', 'BUSDIRECTION')
]);

const GET_NEAREST_BUS_BY_ROUTE_FALLBACK = new Intent(
  'get_nearest_bus_times_by_route_fallback',
  GET_NEAREST_BUS_BY_ROUTE.getIntentParams()
);

DEFAULT = new Intent('default_welcome');

module.exports = {
  GET_MY_LOCATION,
  UPDATE_MY_LOCATION,
  GET_NEAREST_BUS_BY_ROUTE,
  GET_NEAREST_BUS_BY_ROUTE_FALLBACK,
  DEFAULT
};
