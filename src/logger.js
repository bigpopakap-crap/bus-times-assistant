const LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const LOG_LEVEL = LEVEL[process.env.LOG_LEVEL] || LEVEL.INFO;

function log(level, data) {
  if (level >= LOG_LEVEL) {
    console.log(str);
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
