const winston = require("winston");
require("winston-daily-rotate-file");

const transports = new winston.transports.DailyRotateFile({
  filename: "log/cbmLog/%DATE%.log",
  datePattern: "YYYY-MM-DD",
});

const cbmLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.simple()),
  transports,
});

cbmLogger.stream = {
  write: (message) => {
    cbmLogger.info(message.trim());
  },
};

module.exports = cbmLogger;
