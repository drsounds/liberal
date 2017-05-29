var fs = require('fs');
var os = require('os');
var request = require('request');
var assign = require('object-assign');
var Promise = require("es6-promise").Promise;
var SpotifyBrowseAPI = function (session) {
    var self = this;
    this.cache = {};
    this.isPlaying = false;
    
    this.resources = {};
    this.callbacks = {};
    this.apikeys = JSON.parse(fs.readFileSync(os.homedir() + '/.bungalow/spotify.key.json'));
    this.accessToken = null;
    this.session = session;

    this.me = null;

};


SpotifyBrowseAPI.prototype.getLoginUrl = function () {
    return 'https://accounts.spotify.com/authorize?client_id=' + this.apikeys.client_id + '&scope=user-read-private user-read-currently-playing user-read-playback-state user-library-read user-library-modify user-modify-playback-state&response_type=code&redirect_uri=' + encodeURI(this.apikeys.redirect_uri);
}

SpotifyBrowseAPI.prototype.authenticate = function (req) {
    var self = this;
    this.req = req;
    console.log(req);
    return new Promise(function (resolve, fail) {
        console.log("Ta");
        request({
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            form: {
                grant_type: 'authorization_code',
                code: req.query.code,
                redirect_uri: self.apikeys.redirect_uri 
            },
            headers: {
                'Authorization': 'Basic ' + new Buffer(self.apikeys.client_id + ':' + self.apikeys.client_secret).toString('base64') 
            }
        }, function (error, response, body) {
            console.log(error);
            var body = JSON.parse(body);
            if (error || !body.access_token) {
                fail(error);
                return;
            }
            self.setAccessToken(req, body);
            resolve(body);
        });
    });
    
}

SpotifyBrowseAPI.prototype.getAccessToken = function () {
    try {
        return this.req.session.spotifyAccessToken; //JSON.parse(fs.readFileSync(os.homedir() + '/.bungalow/spotify_access_token.json'));
    } catch (e) {
        return null;
    }
}

SpotifyBrowseAPI.prototype.setAccessToken = function (req, accessToken) {

    accessToken.time = new Date().getTime();
    console.log(accessToken);
    //fs.writeFileSync(os.homedir() + '/.bungalow/spotify_access_token.json', JSON.stringify(accessToken));
    req.session.spotifyAccessToken = accessToken;
}

SpotifyBrowseAPI.prototype.isAccessTokenValid = function () {
    var access_token = this.getAccessToken();
    if (!access_token) return false;
    return new Date() < new Date(access_token.time) + access_token.expires_in;
}

SpotifyBrowseAPI.prototype.refreshAccessToken = function () {
    var self = this;
    return new Promise(function (resolve, fail) {
        var accessToken = self.getAccessToken();
        var refresh_token = accessToken.refresh_token;
        request({
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token,
                redirect_uri: self.apikeys.redirect_uri
            },
            headers: {
                'Authorization': 'Basic ' + new Buffer(self.apikeys.client_id + ':' + self.apikeys.client_secret).toString('base64')
            }
        }, function (error, response, body) {
            if (error || 'error' in body) {
                fail();
                return;
            }
            console.log(self.apikeys);
            var accessToken = JSON.parse(body);
            accessToken.refresh_token = refresh_token 
            self.setAccessToken(accessToken);
             console.log("Refresh", body);
            resolve(JSON.parse(body));
        });
    });
}
SpotifyBrowseAPI.prototype.getMe = function () {
    return JSON.parse(localStorage.getItem("me"));
}

SpotifyBrowseAPI.prototype.request = function (method, url, payload, postData, req, cb) {
    var self = this;
    this.req = req;
    console.log("A");
    return new Promise(function (resolve, fail) {
        var activity = function () {
    
            var token = self.getAccessToken();
            var headers = {};
            headers["Authorization"] = "Bearer " + token.access_token;
            if (payload instanceof Object) {
                headers["Content-type"] = "application/json";
    
            } else {
                headers["Content-type"] = ("application/x-www-form-urlencoded");
    
    
            }   

    
            var parts = url.split(/\//g);
            console.log(parts);
            if (parts[0] == 'search') {
                request({
                        url: 'https://api.spotify.com/v1/search?q=' + payload.q + '&type=' + (payload.type || 'track') + '&limit=' + (payload.limit || 120) + '&offset=' + (payload.offset || 1),
                        headers: headers
                    },
                    function (error, response, body) {
                    
                        var data = JSON.parse(body);
                        try {
                            resolve({'objects': data[payload.type + 's'].items});
                        } catch (e) {
                            fail(e);
                        }
                    }
                );
            }
            if (parts[0] == 'me') {
                if (parts[1] == 'track') {
                    request({
                        url: 'https://api.spotify.com/v1/me/tracks?limit=85&offset=' + (payload.offset || 0) + '&country=se',
                        headers: headers
                        
                    },
                        function (error, response, body) {
                            var data = JSON.parse(body);
                            try {
                                resolve({
                                    type: 'library',
                                    name: 'Library',
                                    'objects': data.items.map((t) => t.track)
                                });
                            } catch (e) {
                                fail();
                            }
                        }
                    );
                } else if (parts[1] == 'playlist') {
                 request({
                        url: 'https://api.spotify.com/v1/me/playlists?limit=25&offset=' + (payload.offset || 0) + '&country=se',
                        headers: headers
                        
                    },
                        function (error, response, body) {
                            var data = JSON.parse(body);
                            try {
                                resolve({
                                    type: 'collection',
                                    name: 'Playlists',
                                    'objects': data.items
                                });
                            } catch (e) {
                                fail();
                            }
                        }
                    );
                    
                } else if (parts[1] == 'player') {
                    if (parts[2] == 'play') {
                       
                        var uri = 'https://api.spotify.com/v1/me/player/play';
                        var d = {
                            url: uri,
                            headers: headers,
                            method: method,
                            contentType: 'application/json',
                            body: JSON.stringify(postData)
                        };
                        request(d,
                            function (error, response, body) {
                                if (error) {
                                    fail();
                                    return;
                                }
                                request(
                                    'https://api.spotify.com/v1/me/player',
                                    {
                                        headers: headers    
                                    },
                                    function (error2, response2, body2) {
                                         try {
                                            resolve(JSON.parse(body2));
                                        } catch (e) {
                                            fail();
                                        }
                                    return;
                                });
                            }
                        );
                    } else if(parts[2] === 'pause') {
                        var uri = 'https://api.spotify.com/v1/me/player/pause';
                        var d = {
                            url: uri,
                            headers: headers,
                            method: method,
                            contentType: 'application/json',
                            body: JSON.stringify(postData)
                        };
                        request(d,
                            function (error, response, body) {
                                 try {
                                    resolve(JSON.parse(body));
                                } catch (e) {
                                    fail();
                                }
                            return;
                            }
                        )
                    } else if (parts[2] == 'currently-playing') {
                        request(
                            'https://api.spotify.com/v1/me/player/currently-playing',
                            {
                                headers: headers    
                            },
                            function (error2, response2, body2) {
                                 try {
                                    resolve(JSON.parse(body2));
                                } catch (e) {
                                    fail();
                                }
                            return;
                        });
                    }
                } else {
                    resolve({
                        name: 'Library',
                        uri: 'spotify:me',
                        type: 'library'
                    });
                    return;
                }
            }
            if (parts[0] == 'artist') {
                if (parts.length > 2) {
                    if (parts[2] == 'top') {
                        if (parts.length > 4) {
                            if (parts[4] == 'track') {
                                request({
                                    url: 'https://api.spotify.com/v1/artists/' + parts[1] + '/top-tracks?limit=5&offset=' + payload.offset + '&country=se',
                                    headers: headers
                                },
                                    function (error, response, body) {
                                        var data = JSON.parse(body);
                                        try {
                                            resolve({
                                                type: 'toplist',
                                                name: 'Top Tracks',
                                                'objects': data.tracks.slice(0,parseInt(parts[3]))
                                            });
                                        } catch (e) {
                                            fail();
                                        }
                                    }
                                );
                            }
                        } else {
                            resolve({
                                type: 'toplist',
                                name: 'Top Tracks',
                                description: 'Top Tracks'
                            });
                        }
                    }
                    if (parts[2] == 'release') {
                        var limit = (payload.limit || 10);
                        request({
                                url: 'https://api.spotify.com/v1/artists/' + parts[1] + '/albums?limit=' + limit + '&offset=' + (limit * (payload.p || 0)),
                                headers: headers
                            },
                            function (error, response, body) {
                                var data = JSON.parse(body);
                                try {
                                    resolve({'objects': data.items});
                                } catch (e) {
                                    fail();
                                }
                            }
                        );
                        return;
                    }
                } else {
                    request({
                            url: 'https://api.spotify.com/v1/artists/' + parts[1],
                                headers: headers
                        },
                        function (error, response, body) {
                            var data = JSON.parse(body);
                            console.log(data);
                            resolve(data);
                        }
                    );
                    return;
                }
            }
    
            if (parts[0] == 'album') {
                if (parts.length > 2) {
                    request({
                            url: 'https://api.spotify.com/v1/albums/' + parts[1] + '/tracks',
                                headers: headers
                        },
                        function (error, response, body) {
                            body = body.replace('spotify:', 'bungalow:');
                            var data = JSON.parse(body);
                            try {
                                resolve({
                                    'objects': data.items
                                });
                            } catch (e) {
                                resolve({
                                    'objects': []
                                })
                            }
                        }
                    );
                } else {
                    request({
                            url: 'https://api.spotify.com/v1/albums/' + parts[1] + '',
                                headers: headers
                        },
                        function (error, response, body) {
                            body = body.replace(/spotify\:/, 'bungalow:');
                            var data = JSON.parse(body);
                            try {
                                resolve(data);
                            } catch (e) {
                                fail();
                            }
                        }
                    );
                }
            }
            if (parts[0] == 'track') {
                request({
                        url: 'https://api.spotify.com/v1/tracks/' + parts[1] + ''
                    },
                    function (error, response, body) {
                        var data = JSON.parse(body);
                        try {
                            resolve(data);
                        } catch (e) {
                            fail();
                        }
                    }
                );
            }
            if (parts[0] == 'label') {
                if (parts.length > 2) {
                    if (parts[2] == 'artists') {
                        request({
                            url: 'https://api.spotify.com/v1/search/?q=label:"' + encodeURI(parts[1]) + '"&type=artist&limit=' + payload.limit + '&offset=' + payload.offset,
                            headers: headers
                        },  function (error, response, body) {
                            resolve(body);
                        });
                        resolve({objects: labels});
                    }
                }
            }
            if (parts[0] == 'country') {
                if (parts.length > 1) {
                    var code = parts[1];
                    if (parts.length > 2) {
    
                        if (parts[2] == 'chart') {
                            var chart = parts[3];
                            var type = parts[4];
                            if (type === 'tracks') {
                                resolve({'objects': []});
                            }
                        }
                        if (parts[2] == 'label') {
                            var labels = [
                                {
                                    'id': 'substream',
                                    'name': 'Substream Music Group',
                                    'href': '/label/substream',
                                    'uri': 'spotify:label:substream'
                                }
                            ];
                            resolve({objects: labels});
                        }
                        
                    } else {
    
                        resolve({
                            'id': code,
                            'name': code,
                            'followers': {
                                'count': 5000000,
                                'href': '/country/' + code + '/follower'
                            }
                        })
                    }
                }
            }
            if (parts[0] == 'user') {
                var userid = parts[1];
                if (parts.length > 2) {
                    if (parts[2] == 'playlist') {
                        if (parts.length < 4) {
                            payload = {
                                limit: 10,
                                offset: 0
                            };
                            request({
                                url: 'https://api.spotify.com/v1/users/' + userid + '/playlists?limit=' + payload.limit + '&offset=' + payload.offset,
                                headers: headers
                            }, function (error, response, body) {
                                var result = JSON.parse(body);
                                resolve({
                                    'objects': result.items
                                });
                            });
                            return;
                        } else {
                            if (parts[4] == 'follower') {
                                var users = [];
                                for (var i = 0; i < 10; i++) {
                                    uesrs.push({
                                        'id': 'follower' + i,
                                        'name': 'Track ' + i,
                                        'uri': 'SpotifyBrowse:user:follower' + i
                                    });
                                }
                                resolve({
                                    'objects': users
                                });
                            } else if (parts[4] == 'track') {
                                request({
                                    url: 'https://api.spotify.com/v1/users/' + parts[1] + '/playlists/' + parts[3] + '/tracks',
                                    headers: headers
                                }, function (error, response, body) {
                                    var result = JSON.parse(body);
                                    resolve({
                                        'objects': result.items.map(function (track) {
                                            var track = assign(track, track.track);
                                            track.user = track.added_by;
                                            track.time = track.added_at;
                                            if (track.user)
                                            track.user.name = track.user.id;
                                            return track;
                                        })
                                    })
                                });
                            } else {
                                request({
                                    url: 'https://api.spotify.com/v1/users/' + parts[1] + '/playlists/' + parts[3] + '',
                                    headers: headers
                                }, function (error, response, body) {
                                    var result = JSON.parse(body);
                                    resolve(result);
                                });
                            }
                        }
                    }
    
                } else {
                    console.log("Getting users");
                    request({
                        url: 'https://api.spotify.com/v1/users/' + parts[1] + '',
                        headers: headers
                    },
                        function (error, response, body) {
                            if (error) {
                                fail({'error': ''});
                            }
                            var user = JSON.parse(body);
                            if (user) {
                            user.name = user.id;
                            }
                            resolve(user);
                        }
                    );
    
                }
            }
            if (parts[0] == 'genre') {
                var userid = parts[1];
                if (parts.length > 2) {
                    if (parts[2] == 'playlist') {
                        if (parts.length < 4) {
                            payload = {
                                limit: 10,
                                offset: 0
                            };
                            request({
                                url: 'https://api.spotify.com/v1/browse/categories/' + userid + '/playlists?limit=' + payload.limit + '&offset=' + payload.offset,
                                headers: headers
                            }, function (error, response, body) {
                                var result = JSON.parse(body);
                                
                                
                                resolve({
                                    'objects': result.playlists.items
                                });
                            });
                            return;
                        }
                    }
                } else {
                    console.log("Getting users");
                    request({
                        url: 'https://api.spotify.com/v1/browse/categories/' + parts[1] + '',
                        headers: headers
                    },
                        function (error, response, body) {
                            if (error) {
                                fail({'error': ''});
                            }
                            try {
                                var user = JSON.parse(body);
                                user.images = user.icons;
                                resolve(user);
                            } catch (e) {
                                fail();
                            }
                        }
                    );
    
                }
            }
        };
     activity();
    });
}


SpotifyBrowseAPI.prototype.requestAccessToken = function (code) {
    var self = this;
    var promise = new Promise(function (resolve, fail) {
        var headers = {};
        headers["Authorization"] = "Basic " + new Buffer(self.apikeys.client_id).toString() + ':' + new Buffer(self.apikeys.client_secret);

        headers["Content-type"] = ("application/x-www-form-urlencoded");


        request({
                url: 'https://accounts.spotify.com/api/token',
                headers: headers, form: "grant_type=authorization_code&code=" + code + "&redirect_uri=" + encodeURI(self.apikeys.redirect_uri)},
            function (error, response, body) {
                var data = JSON.parse(body);
                if (!('accessToken' in data)) {
                    fail({'error': 'Request problem'});
                    return;
                }
                self.nodeSpotifyBrowseAPI.setAccessToken(data);
                self.nodeSpotifyBrowseAPI.getMe().then(function (data) {
                    localStorage.setItem("me", JSON.stringify(data.body));


                    resolve(data);
                });

            }
        );
    });
    return promise;
}


SpotifyBrowseAPI.prototype.addToCache = function (resource) {
}

SpotifyBrowseAPI.prototype.events = {};

SpotifyBrowseAPI.prototype.notify = function (event) {
    var type = event.type;
    if (type in this.events) {
        this.events[type].call(this, event);
    }
}

SpotifyBrowseAPI.prototype.addEventListener = function (event, callback) {
    this.events[event] = callback;
}

SpotifyBrowseAPI.prototype.ready = function () {

}

SpotifyBrowseAPI.prototype.getPosition = function () {
    return this.SpotifyBrowse.player.currentSecond;
}

SpotifyBrowseAPI.prototype.logout = function () {
    this.SpotifyBrowse.logout();
}

SpotifyBrowseAPI.prototype.playTrack = function (uri) {
    return track;
}

SpotifyBrowseAPI.prototype.stop = function () {
}

SpotifyBrowseAPI.prototype.getImageForTrack = function (id, callback) {
    this.request('GET', 'https://api.spotify.com/v1/tracks/' + id).then(function (track) {
        callback(track.album.images[0].url);
    });
}

SpotifyBrowseAPI.prototype.seek = function (position) {
}

SpotifyBrowseAPI.prototype.login = function () {
    console.log("Log in");
    var self = this;
    var promise = new Promise(function (resolve, fail) {
        alert("AFFF");
        var win = gui.Window.get(window.open('https://accounts.spotify.com/authorize/?client_id=' + this.apikeys.client_id + '&response_type=code&redirect_uri=' + encodeURI(this.apiKeys.redirect_uri) + '&scope=user-read-private%20user-read-email&state=34fFs29kd09', {
            "position": "center",
            "focus": true,
            "toolbar": false,
            "frame": true
        }));
        console.log(win);
        alert(win);
        var i = setInterval(function () {
            if (!win) {
                clearInterval(i);
                var code = localStorage.getItem("code", null);
                if (code) {
                    self.requestAccessToken(code, function () {
                        resolve();
                    }, function () {
                        fail();
                    })
                }
            }
        }, 100);
    });
    return promise;
}

SpotifyBrowseAPI.followPlaylist = function (playlist) {
    
}

var Uri = function (uri) {
    this.parts = uri.split(/\:/g);
    this.user = parts[2];
    this.playlist = parts[4];
    this.id = parts[3];
}

/**
 * Adds songs to a playlist
 **/
SpotifyBrowseAPI.prototype.addTracksToPlaylist = function (user, playlist_id, uris, position) {
    var self = this;
    var promise = new Promise(function (resolve, fail) {
        self.request("POST", "/users/" + user + "/playlists/" + playlist_id + "/tracks", {
                "uris": uris, position: position
        }).then(function () {
            resolve();
        });

    });
    return promise;

}

SpotifyBrowseAPI.prototype.getAlbumTracks = function (id, callback) {

    var self = this;
    var promise = new Promies(function (resolve, fail) {
        self.request("GET", "/albums/" + id + "/tracks").then(function (data) {
            resolve(data);
        })
    });
    return promise;
    
};


SpotifyBrowseAPI.prototype.search = function (query, limit, offset, type, callback) {
    var self = this;
    var promise = new Promise(function (resolve, fail) {
        self.request('GET', 'https://api.spotify.com/v1/search?q=' + encodeURI(query) + '&type=' + type + '&limit=' + limit + '&offset=' + offset).then(function (data) {
            if ('tracks' in data) {
                var tracks = data.tracks.items.map(function (track) {
                    track.duration = track.duration_ms / 1000;
                    return track;
                });
                resolve(data.tracks.items);
            } else {
                resolve(data[type + 's'].items);
            }
        });
    });
    return promise;
};
SpotifyBrowseAPI.prototype.loadPlaylist = function (user, id, callback) {
    var self = this;
    var promise = new Promies(function (resolve, fail) {
        self.request("GET", "/users/" + user + "/playlists/" + id + "/tracks").then(function (tracklist) {
            self.request("GET", "/users/" + uri.user + "/playlists/" + uri).then(function (playlist) {
                playlist.tracks = tracklist.tracks.items;
                resolve(playlist);
            });
        });
    });
    return promise;
}

SpotifyBrowseAPI.prototype.createPlaylist = function (title) {
    var self = this;

    var promise = new Promise(function (resolve, fail) {
        var me = self.getMe();
        self.request("POST", "/users/" + me.id + "/playlists", {name: title}).then(function (object) {
            resolve(object);
        });
    });
    return promise;
};

SpotifyBrowseAPI.prototype.getTopList = function (uri, callback) {

}

SpotifyBrowseAPI.prototype.getUserPlaylists = function () {
    var self = this;
    var promise = new Promise(function (resolve, fail) {
        var user = self.getMe();
        self.request("GET", "/users/" + user.id + '/playlists').then(function (data) {
            resolve({
                'objects': data.items
            });
        });
    });
    return promise;
}


SpotifyBrowseAPI.prototype.getPlaylistsForUser = function (id) {
    var self = this;
    var promise = new Promise(function (resolve, fail) {

        self.request("GET", "/users/" + id + '/playlists').then(function (data) {
            resolve({
                'objects': data.items
            });
        });
    });
    return promise;
}

SpotifyBrowseAPI.prototype.getArtistById = function (id, callback) {
    var self = this;

    var promise = new Promies(function (resolve, fail) {
        self.request("GET", "/artists/" + id).then(function (data) {
            resolve(data);
        });
    });
    return promise;
}

SpotifyBrowseAPI.prototype.getAlbum = function (id) {
    var self = this;
    var promise = new Promise(function (resolve, fail) {
        self.request('https://api.spotify.com/v1/albums/' + id).then(function (album) {
            album.image = album.images[0].url;
            album.tracks = [];
            this.request('GET', '/albums/' + uri.id + '/tracks').then(function (data) {
                album.tracks = data.tracks.items;
                resolve(album);

            });
        });
    });
    return promise;
}

SpotifyBrowseAPI.prototype.resolveTracks = function (uris, callback) {

}

SpotifyBrowseAPI.prototype.getPlaylistTracks = function (user, playlist_id, page, callback) {
    var self = this;
    var promise = new Promise(function (resolve, fail) {
         self.request('GET', '/users/' + user + '/playlists/' + playlist_id).then(function (data) {
             resolve({
                 'objects': data.tracks.items
             });
         });
    });
    return promise;
}

SpotifyBrowseAPI.prototype.playPause = function () {
    if (this.isPlaying) {
        this.pause();
    } else {
        this.resume();
    }
}
SpotifyBrowseAPI.prototype.pause = function () {
    this.isPlaying = false;
}
SpotifyBrowseAPI.prototype.resume = function () {
    this.isPlaying = true;
}
SpotifyBrowseAPI.prototype.reorderTracks = function (playlistUri, indices, newPosition) {
    console.log("SpotifyBrowse is now reordering tracks");
    console.log("Done successfully");
}

SpotifyBrowseAPI.prototype.removeTracks = function (playlist, indices) {
    playlist.reorderTracks(indices, newPosition);
}

SpotifyBrowseAPI.prototype.addTracks = function (playlist, tracks, position) {
    playlist.addTracks(tracks, position);
}

module.exports = SpotifyBrowseAPI;
