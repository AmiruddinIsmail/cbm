const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const routes = require('../api/routes/ekyc-app');
const { logs } = require('./vars');
// const strategies = require('./passport');
const error = require('../api/middlewares/error');
const connection = require('../api/middlewares/db.js')
const path = require('path')

/**
* Express instance
* @public
*/
const app = express();




// request logging. dev: console | production: file
app.use(morgan(logs));

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/ekyc-app", express.static(path.join(__dirname, 'public')));


//app.use(express.static(__dirname + '/'));
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'hbs');
// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    })
  );

// enable CORS - Cross Origin Resource Sharing
app.use(cors());
app.options('*', cors());



// enable authentication
app.use(passport.initialize());
// passport.use('jwt', strategies.jwt);
// passport.use('facebook', strategies.facebook);
// passport.use('google', strategies.google);

/*connection.connect(function(err) {
    if(err) console.log("Error to connect DB")
    console.log("Connected to DB")
}) */

// upload()

// mount api routes
app.use('/ekyc-app', routes);

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);

module.exports = app;