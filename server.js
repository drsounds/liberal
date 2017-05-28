var express = require('express');
var execPath = process.env.PWD;
var fs = require('fs');
var cookieSession = require('cookie-session');
var api = require('./api.js');
var app = express();
var bodyParser = require('body-parser');
  app.use(bodyParser());



app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}));

app.use('/api', api.server);
app.get('/callback.html', function (req, res) {
    var index = fs.readFileSync(__dirname + '/client/callback.html');
    res.write(index);
    res.end();
});
app.get('/*', function (req, res) {
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


