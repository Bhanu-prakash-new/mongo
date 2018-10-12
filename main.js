var argv = require('yargs');
const http = require('http');
var dotenv = require('dotenv')
var express = require('express');
global.bodyParser = require('body-parser');
var cors = require('cors')
global.mongoose = require('mongoose');
global.app = express();
global.helper = require('./helpers/_helpers');
global._mongoose = require('./helpers/_mongoose');

var isSSLEnable = false;
var port = process.env.PORT || 3000;



global.Schema = mongoose.Schema;
global.db = require('./Models/index');

/**
 * For validation using middleware
 */

app.use(bodyParser.json());
app.options(cors({origin: '*'}));
app.use(cors({origin: '*'}));
app.use(function (req, res, next) {
//    console.log(req,'reqk')
//    res.header("Access-Control-Expose-Headers", "x-access-token");
    next();
});
require('./route/webRoutes');


argv.command('environment', function (yargs) {
    yargs.options({location: {demand: true, alias: 'e', type: 'string'}});
}).help('help').argv;

dotenv.config({path: ".env." + argv.e});




http.createServer(app).listen(port, function () {
    console.log('listening on +:  ' + port + " and SSL is " + isSSLEnable);
});




module.exports = app;