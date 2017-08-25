var express = require('express');
var execPath = process.env.PWD;
var fs = require('fs');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var api = require('./api.js');
var app = express();
var bodyParser = require('body-parser');
  app.use(bodyParser());
var busy = require('busy');
app.timeout = 1000;
app.use(cookieParser());
app.use(cookieSession({
    secret:'32425235235235',
    name: 'session',
    keys: ['key1', 'key2'],
    cookie: {secure: false}
}));
// middleware which blocks requests when we're too busy
app.use(function(req, res, next) {
    if (busyCheck.blocked) {
        res.send(503, "I'm busy right now, sorry.");
    } else {
        next();
    }
});
app.use('/api', api.server);

var busyCheck = busy(function(amount) {
    console.log('Loop was busy for', amount, 'ms');
});

app.use(express.static(__dirname + '/client/'));
app.get('/*', function (req, res) {
    var protocol = req.connection.encrypted ? 'https' : 'http';
    if (req.host.indexOf('liberal-drsounds.c9users.io') != -1) {
        protocol = 'https';
    }
    var index = fs.readFileSync(__dirname + '/client/index.html', 'utf8');

    //index = index.replace('https://liberal-drsounds.c9users.io',  protocol + '://' + req.host + ':' + (process.env.PORT || 9261) + '');
    //console.log(index);
    res.write(index);
    res.end();
});
app.get('/callback.html', function (req, res) {
    var index = fs.readFileSync(__dirname + '/client/callback.html');
    res.write(index);
    res.end();
});
app.get('/', function (req, res) {
    var protocol = req.connection.encrypted ? 'https' : 'http';
    if (req.host.indexOf('liberal-drsounds.c9users.io') != -1) {
        protocol = 'https';
    }
    var index = fs.readFileSync(__dirname + '/client/index.html', 'utf8');

    index = index.replace('https://liberal-drsounds.c9users.io',  protocol + '://' + req.host + ':' + (process.env.PORT || 9261) + '');
    console.log(index);
    res.write(index);
    res.end();
});
app.use(express.static(__dirname + '/client/'));
module.exports = app;
if (typeof require != 'undefined' && require.main==module) {
    app.listen(process.env.PORT || 9261);
}


