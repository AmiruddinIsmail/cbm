const { port, env } = require('./config/vars');
const logger = require('./config/logger');
const app = require('./config/express');
const fs = require('fs')
const http = require('http')
const path = require('path')

var certificate = path.resolve('./DigiCertCa.crt')
var credentials = {cert: certificate}
// const mongoose = require('./config/mongoose');

// // open mongoose connection
// mongoose.connect();

var httpServer = http.createServer(credentials, app)

httpServer.listen(port, () => console.log(`server started on port ${port} (${env})`))

// listen to requests
// app.listen(port, () => logger.info(`server started on port ${port} (${env})`));

/**
* Exports express
* @public
*/
module.exports = app;
