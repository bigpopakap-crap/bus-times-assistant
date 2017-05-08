/* global module */
'use strict';

const BUS_DIRECTION = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound'
};

const BUS_DIRECTION_INPUT_MAP = {
  'inbound': BUS_DIRECTION.INBOUND,
  'to downtown': BUS_DIRECTION.INBOUND,
  'toward downtown': BUS_DIRECTION.INBOUND,
  'going downtown': BUS_DIRECTION.INBOUND,
  'towards downtown': BUS_DIRECTION.INBOUND,
  'heading downtown': BUS_DIRECTION.INBOUND,
  'going to downtown': BUS_DIRECTION.INBOUND,
  'heading to downtown': BUS_DIRECTION.INBOUND,
  'heading toward downtown': BUS_DIRECTION.INBOUND,
  'heading towards downtown': BUS_DIRECTION.INBOUND,

  'outbound': BUS_DIRECTION.OUTBOUND,
  'leaving downtown': BUS_DIRECTION.OUTBOUND,
  'out of downtown': BUS_DIRECTION.OUTBOUND,
  'heading out of downtown': BUS_DIRECTION.OUTBOUND,
  'going out of downtown': BUS_DIRECTION.OUTBOUND
};

const BUS_DIRECTION_INPUTS = Object.keys(BUS_DIRECTION_INPUT_MAP);

function busDirectionFromInput(input) {
  // TODO log that we made this conversion
  return typeof input === 'string'
          ? BUS_DIRECTION_INPUT_MAP[input.toLowerCase()]
          : null;
}

module.exports = {
  BUS_DIRECTION_INPUTS,
  busDirectionFromInput
};
