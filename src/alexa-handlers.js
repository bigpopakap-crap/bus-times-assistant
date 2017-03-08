"use strict";

const { busDirectionFromInput } = require('./ai-config-busDirection.js');

function handleNearestBusTimesByRoute(request, response) {
  const busRoute = request.slot("busRoute");
  const busDirection = busDirectionFromInput(
    request.slot("busDirection")
  );

  response.say(`You asked for ${busDirection} ${busRoute}`);
}

module.exports = {
  handleNearestBusTimesByRoute
};
