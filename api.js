var path = require('path');
var fs = require('fs');
var async = require('async');
var MusicService = require('./services/spotify/spotify.js');
var SocialService = require('./services/mock/mock.js');
var WikiService = require('./services/wikipedia/wikipedia.js');
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
var wiki = new WikiService();

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

app.get('/authenticate', function (req, res) {
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


app.get('/user/:username/playlist', function (req, res) {
    
    music.req = req;
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getPlaylistsByUser(req.params.username, req.query.offset, req.query.limit).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/user/:username', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getUser(req.params.username).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/me/playlist', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getMyPlaylists(req.query.offset, req.query.limit).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/me/release', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }   
    music.getMyReleases(req.query.offset, req.query.limit).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});



app.get('/internal/library', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    res.json({
        id: 'library',
        name: 'Library',
        uri: 'bungalow:internal:library',
        description: 'My Library',
        type: 'library'
    });
});



app.put('/me/player/play', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.playTrack(body).then(function (result) {
        music.getCurrentTrack().then(function (result) {
            res.json(result);
            
        });
    }, function (reject) {
        res.statusCode = reject;
        res.json(reject);
    });
});


app.get('/me/player/currently-playing', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getCurrentTrack(body).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});



app.get('/internal/library/track', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getMyTracks(req.query.offset, req.query.limit).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.statusCode = reject;
        res.json(reject);
    });
});

app.get('/category', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getCategories(req.query.offset, req.query.limit).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.statusCode = reject;
        res.json(reject);
    });
});


app.get('/category/:identifier', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getCategory(req.params.identifier, req.query.offset, req.query.limit).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/label/:identifier', function (req, res) {
    wiki.req = req;
    var name = decodeURIComponent(req.params.identifier);
    wiki.describe(name).then(function (description) {
        res.json({
            name: name,
            description: description || ''
        });
    });
});



app.get('/label/:identifier/release', function (req, res) {
       music.req = req;
    var name = decodeURIComponent(req.params.identifier);
    music.search('label:"' + req.params.identifier + '"', req.params.limit, req.params.offset, 'album').then(function (result) {
        res.json(result);
    }, function (err) {
        res.statusCode = err;
        res.json(err);
    });
});


app.get('/category/:identifier/playlist', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getPlaylistInCategory(req.params.identifier, req.query.offset, req.query.limit).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/search', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.search(req.query.q, req.query.limit, req.query.offset, req.query.type).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/user/:username/playlist/:identifier', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getPlaylist(req.params.username, req.params.identifier).then(function (result) {
        
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/user/:username/playlist/:identifier/track', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getTracksInPlaylist(req.params.username, req.params.identifier, req.query.offset, req.query.limit).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.post('/user/:username/playlist/:identifier/track', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.addTracksInPlaylist(req.params.username, req.params.identifier, body.tracks, body.position).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.put('/user/:username/playlist/:identifier/track', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.reorderTracksInPlaylist(req.params.username, req.params.identifier, body.start_index, body.range_start, body.range_length, body.range_end).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/artist/:identifier', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getArtist(req.params.identifier).then(function (result) {
       res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/artist/:identifier/about', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    
    music.getArtist(req.params.identifier).then(function (result) {
        var data = {
            monthlyListners: 0,
            weeklyListeners: 0,
            dailyListeners: 0,
            discoveredOn: {
                objects: []
            },
            rank: 1000000,
            biography: null
        };
        wiki.describe(result.name).then(function (description) {
            if (description == null) {
                wiki.describe(result.name + ' (Music artist)').then(function (description) {
                    if (result.description != null) {   
                        data.biography = {
                            service: {
                                id: 'wikipedia',
                                name: 'Wikipedia',
                                uri: 'bungalow:service:wikipedia',
                                type: 'service',
                                images: [{
                                    url: ''
                                }]
                            },
                            body: description
                        };
                    }
                    res.json(data);
                }, function (err) {
                    res.json(data);
                });
                return;
            }
            data.biography = {
                service: {
                    id: 'wikipedia',
                    name: 'Wikipedia',
                    uri: 'bungalow:service:wikipedia',
                    type: 'service',
                    images: [{
                        url: ''
                    }]
                },
                body: description
            };
            res.json(data);
        }, function (err) {
            res.json(data);
        });
    }, function (reject) {
        res.json(reject);
    });
});

app.get('/artist/:identifier/top/:count', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getArtist(req.params.identifier).then(function (result) {
        music.getTopTracksForArtist(result.id, 'se').then(function (toplist) {
            toplist.objects = toplist.  objects.slice(0, req.params.count);
            res.json({
                name: 'Top Tracks',
                type: 'toplist',
                images: [{
                    url: '/images/toplist.svg'
                }],
                id: 'toplist',
                uri: result.uri + ':top:' + req.params.count,
                description: 'Top ' + req.params.count + ' tracks for <sp-link uri="' + result.uri + '">' + result.name + '</sp-link>',
                tracks: toplist
            });
        }, function (err) {
            res.statusCode = 500;
            res.json(err);
        });
    }, function (reject) {
        res.json(reject);
    }, function (err) {
        res.statusCode = 500;
        res.json(err);
    });
});


app.get('/artist/:identifier/top/:count/track', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    music.getArtistTopTracks(req.params.identifier, req.params.offset, req.params.limit).then(function (result) {
       result.objects = result.objects.slice(0, req.params.count);
       res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});

app.get('/artist/:identifier/release', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    
    music.getReleasesByArtist(req.params.identifier, 'album', req.query.offset, req.query.limit).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/artist/:identifier/album', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    
    music.getReleasesByArtist(req.params.identifier, 'album', req.query.offset, req.query.limit).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});



app.get('/artist/:identifier/single', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    
    music.getReleasesByArtist(req.params.identifier, 'single', req.query.offset, req.query.limit).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/artist/:identifier/appears_on', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    
    music.getReleasesByArtist(req.params.identifier, 'appears_on', req.query.offset, req.query.limit).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/artist/:identifier/compilation', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    
    music.getReleasesByArtist(req.params.identifier, 'compilation', req.query.offset, req.query.limit).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/album/:identifier', function (req, res) {
    music.req = req;
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    
    music.getAlbum(req.params.identifier).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});

app.get('/album/:identifier/track', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }
    
    music.getTracksInAlbum(req.params.identifier, req.query.offset, req.query.limit).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});


app.get('/featured/playlist', function (req, res) {
    music.req = req;
    
    music.session = req.session;
    var body = {};
    if (req.body) {
        body = (req.body);
    }   
    music.getFeaturedPlaylists(req.query.offset, req.query.limit).then(function (result) {
    
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
});

app.get('/track/:identifier', function (req, res) {
    music.req = req;
    music.getTrack(req.params.identifier).then(function (result) {
        res.json(result);
    }, function (reject) {
        res.json(reject);
    });
})


module.exports = {
    server: app
};