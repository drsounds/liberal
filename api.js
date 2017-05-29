var path = require('path');
var fs = require('fs');
var async = require('async');
var MusicService = require('./services/spotify/spotify.js');
var SocialService = require('./services/mock/mock.js');
var social = new SocialService();
var less = require('less');
var request = require('request');
var url = require('url');
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
var utils = require('./utils.js');
var express =require('express');
var app = express();
var music = new MusicService();

app.get('/music/login', function (req, res) {
    res.redirect(music.getLoginUrl());
});
app.use(cookieParser());
app.use(cookieSession({
    secret:'32425235235235',
    name: 'session',
    keys: ['key1', 'key2'],
    cookie: {secure: false}
}));

app.get('/settings.json', function (req, res) {

    if (fs.existsSync(path)) {
        var settings = JSON.parse(fs.readFileSync('./settings.json'));
        res.json(settings);
    } else {
        var settings = {
            'bungalows': {},
            'apps': [],
            'theme': 'spotify09',
            'light': true,
            'primaryColor': '#FB8521'
        };
        fs.writeFileSync('./settings.json', settings);
        return settings;
    }
});

app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}));

app.get('/apps', function (req, res) {
   res.json({
       'objects': [
            {
                "BundleIdentifier": "testapp",
                "BundleUrl": "https://testapp-drsounds.c9users.io",
                "BundleName": {
                    "en": "TestApp"
                },
                "UserInstallable": true,
                "uri": "^(bungalow:testapp)$"
            }   
        ]
   }) 
});

app.get('/music/authenticate', function (req, res) {
    console.log("Got authenticate request");
    console.log(req);
    music.authenticate(req).then(function (success) {
        console.log("success");
        res.statusCode = 200;
        res.json(success);
        res.end();
    }, function (error) {
        console.log(error);
        res.statusCode = 500;
        res.end(error);
    });

}); 
app.put('/settings.json', function (req, res) {
    var settings = JSON.stringify(req.json);
    fs.writeFileSync('settings.json', settings);

    var lightTheme = fs.readFileSync(process.env.PWD + '/themes/' + settings.theme + '/css/light.less', {'encoding': 'utf-8'});
    console.log(process.env.PWD + '/themes/' + settings.theme + '/css/style.less');
    lightTheme = lightTheme.replace(/\@primary-color/, settings.primaryColor);
    lightTheme = lightTheme.replace(/\@secondary-color/, settings.secondaryColor);
    lightTheme = lightTheme.replace("@islight", true ? '@light' : '@dark');
    lightTheme = lightTheme.replace("@isdark", !true ? '@light' : '@dark');

    var darkTheme = fs.readFileSync(process.env.PWD + '/themes/' + settings.theme + '/css/dark.less', {'encoding': 'utf-8'});
    console.log(process.env.PWD + '/themes/' + settings.theme + '/css/style.less');
    darkTheme = darkTheme.replace(/\@primary-color/, settings.primaryColor);
    darkTheme = darkTheme.replace(/\@secondary-color/, settings.secondaryColor);
    darkTheme = darkTheme.replace("@islight", true ? '@light' : '@dark');
    darkTheme = darkTheme.replace("@isdark", !true ? '@light' : '@dark');

    //alert(theme);
    less.render(lightTheme, {}, function (error, output) {
        console.log(error, output);
        //alert(output);
        fs.writeFileSync(process.env.PWD + '/themes/' + settings.theme + '/css/light.css', output.css);
    });

    less.render(darkTheme, {}, function (error, output) {
        console.log(error, output);
        //alert(output);
        fs.writeFileSync(process.env.PWD + '/themes/' + settings.theme + '/css/main.scss', output.css);
    });
    fs.writeFileSync(process.env.PWD + '/themes/' + settings.theme + '/css/main.scss', '@import url("' + (settings.light ? 'light' : 'dark') + '.css")');


    var mainCSS = '@import url("' + settings.theme + '/css/style.css")';
    fs.writeFileSync(process.env.PWD + '/themes/main.scss', mainCSS);

    fs.writeFileSync(process.env.PWD + '/themes/main.scss', '@import url("http://127.0.0.1:9261/themes/' + settings.theme + '/css/main.scss")');
    fs.writeFileSync(process.env.PWD + '/themes/light.css', '@import url("http://127.0.0.1:9261/themes/' + settings.theme + '/css/light.css")');
    fs.writeFileSync(process.env.PWD + '/themes/main.scss', '@import url("http://127.0.0.1:9261/themes/' + settings.theme + '/css/main.scss")');

})
/*
app.post('/api/login', function (req, res) {

});

app.get('/api/albums/:id', function (req, res) {
    var id = req.params.id;
    music.getAlbumById(id).then(function (artist) {
        var data = JSON.stringify(artist);
        res.json(artist);
    });
});


app.get('/api/albums/:id/tracks', function (req, res) {
    var id = req.params.id;
    music.getAlbumTracks(id).then(function (artist) {
        var data = JSON.stringify(artist);
        res.json(artist);
    });
});

app.get('/api/playlists/:id/tracks', function (req, res) {
    var id = req.params.id;
    music.getPlaylistTracks(id).then(function (artist) {
        var data = JSON.stringify(artist);
        res.json(artist);
    });
});

app.get('/api/search', function (req, res) {
    var q = req.query.q;
    var type = req.query.type;
    var offset = req.query.offset;
    var limit = req.query.limit;

    music.search(q, type, limit, offset).then(function (data) {

        res.json(data);
    });
});

app.get('/api/artists/:id', function (req, res) {
    var id = req.params.id;
    music.getArtistById(id).then(function (artist) {
       var data = JSON.stringify(artist);
        res.json(artist);
    });
});

app.get('/api/albums/:id', function (req, res) {
    var id = req.params.id;
    music.getAlbumById(id).then(function (artist) {
        var data = JSON.stringify(artist);
        res.json(data);
    });
});

app.get('/api/users/:username/playlists/:id', function (req, res) {
    var username = req.params.username;
    var id = req.params.id;
    music.getPlaylistById(username, id).then(function (playlist) {

        res.json(playlist);
    });
});

app.get('/api/users/:username/playlists', function (req, res) {
    var username = req.params.username;
    var id = req.params.id;
    music.getPlaylistsForUser(username).then(function (data) {
        res.json(data);
    });
});
*/

/*
app.get('/api/users/:username', function (req, res) {
    var username = req.params.username;
    var id = req.params.id;
    music.getUserById(username).then(function (data) {
        res.json(data);
    });
});


app.get('/api/users/:username/playlists/:id/tracks', function (req, res) {
    var username = req.params.username;
    var id = req.params.id;
    music.getPlaylistTracks(username, id).then(function (playlist) {
        var data = JSON.stringify(playlist);
        res.json(data);
    });
});

app.get('/chrome/*', function (req, res) {
    var app_path = req.params[0].split('/');
    var file = fs.readFileSync('./' + app_path.join('/'));
    res.write(file);
    res.end();
});*/


app.get('/social/*', function (req, res) {
    music.session = req.session;
    console.log("A");
    console.log(social);
    social.request("GET", req.params[0], req.query).then( function (result) {

        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});

app.get('/music/*', function (req, res) {
    console.log('music');
    music.session = req.session;
    var body = {};
    if (request.body) {
        body = (request.body);
    }
    music.request("GET", req.params[0], req.query, body, req).then(function (result) {

        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});

app.put('/music/*', function (req, res) {
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.request("PUT", req.params[0], req.query, body, req).then( function (result) {

        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});

app.post('/music/*', function (req, res) {
    music.session = req.session;

    music.request("POST", req.params[0], req.query, req.body, req).then( function (result) {

        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});

app.get('/player/play', function (req, res) {
    var id = req.params.id;
    music.getAlbumTracks(id).then(function (artist) {
        var data = JSON.stringify(artist);
        res.json(artist);
    });
});


module.exports = {
    server: app
};