var express = require('express');
var execPath = process.env.PWD;
var fs = require('fs');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var api = require('./api.js');
var app = express();
var bodyParser = require('body-parser');
  app.use(bodyParser());

app.use(cookieParser());
app.use(cookieSession({
    secret:'32425235235235',
    name: 'session',
    keys: ['key1', 'key2'],
    cookie: {secure: false}
}));


app.use('/api', api.server);

app.use('/js', express.static(__dirname + '/client/js', {

}));


app.use('/themes', express.static(__dirname + '/client/themes', {

}));
app.use('/css', express.static(__dirname + '/client/css', {

}));
app.use('/images', express.static(__dirname + '/client/images', {

}));
app.use('/templates', express.static(__dirname + '/client/templates', {

}));
app.get('/callback.html', function (req, res) {
    var index = fs.readFileSync(__dirname + '/client/callback.html');
    res.write(index);
    res.end();
});
app.get('*', function (req, res) {
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
module.exports = app;
if (typeof require != 'undefined' && require.main==module) {
    app.listen(process.env.PORT || 9261);
}


