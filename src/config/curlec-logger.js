const winston = require('winston')

const curlecLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.simple()
    ),
    transports: [
        new winston.transports.File({ filename: "curlec.log"})
    ]
})

curlecLogger.stream = {
    write: (message) => {
        curlecLogger.info(message.trim())
    }
}

module.exports = curlecLogger