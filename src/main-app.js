'use strict';

// default the config vars
process.env.DEBUG = process.env.DEBUG || 'actions-on-google:*';
process.env.PORT = process.env.PORT || 8080;

const express = require('express');
const bodyParser = require('body-parser');
const googleApp = require('./google-app.js');

const app = express();
app.set('port', process.env.PORT);

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

app.use('/google', googleApp);

// Start the server
var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
