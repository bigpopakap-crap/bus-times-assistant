const BUS_DIRECTION = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound'
}

// TODO make sure this is still in sync with API.ai
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

function busDirectionFromInput(input) {
  return typeof input === 'string'
          ? BUS_DIRECTION_INPUT_MAP[input.toLowerCase()]
          : null;
}

module.exports = {
  busDirectionFromInput
};
