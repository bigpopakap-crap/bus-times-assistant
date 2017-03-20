var logfmt_base = require('logfmt');

// use JSON.stringify so it goes recursively
var logfmt = new logfmt_base;
logfmt.stringify = JSON.stringify;

const LEVEL = {
  // no value 0 because then it's falsy, and that makes edge cases
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

const LOG_LEVEL = LEVEL[process.env.LOG_LEVEL] || LEVEL.INFO;

function log(level, data) {
  if (level >= LOG_LEVEL) {
    logfmt.log({
      data
    });
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
