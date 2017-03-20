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

function createLogData(data) {
  var logData = {};

  // prefix all the passed in properties with "data"
  for (var prop in data) {
    if (data.hasOwnProperty(prop)) {
      logData[`data:${prop}`] = data[prop];
    }
  }

  return logData;
}

function log(level, data) {
  try {
    if (level >= getCurrentLogLevel()) {
      logfmt.log(createLogData(data));
    }
  } catch (ex) {
    // just don't blow up the app if anything fails
    console.log('Error while logging!');
    console.log(ex);
  }
}

function debug(data) {
  log(LEVEL.DEBUG, data);
}

function info(data) {
  log(LEVEL.INFO, data);
}

function warn(data) {
  log(LEVEL.WARN, data);
}

function error(data) {
  log(LEVEL.ERROR, data);
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
