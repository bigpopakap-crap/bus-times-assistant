var logfmt = require('logfmt');

const LEVEL = {
  // no value 0 because then it's falsy, and that makes edge cases
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

function getCurrentLogLevel() {
  return LEVEL[process.env.LOG_LEVEL] || LEVEL.INFO;
}

function createLogData(event, data) {
  var logData = {};

  logData['event'] = event;

  // prefix all the passed in properties with "data"
  for (var prop in data) {
    if (data.hasOwnProperty(prop)) {
      logData[`event.${prop}`] = data[prop];
    }
  }

  return logData;
}

function log(level, event, data) {
  try {
    if (level >= getCurrentLogLevel()) {
      logfmt.log(createLogData(event, data));
    }
  } catch (ex) {
    // just don't blow up the app if anything fails
    console.log('Error while logging!');
    console.log(ex);
  }
}

function debug(event, data) {
  log(LEVEL.DEBUG, event, data);
}

function info(event, data) {
  log(LEVEL.INFO, event, data);
}

function warn(event, data) {
  log(LEVEL.WARN, event, data);
}

function error(event, data) {
  log(LEVEL.ERROR, event, data);
}

const logger = {
  LEVEL,
  log,
  debug,
  info,
  warn,
  error
};

module.exports = logger;
