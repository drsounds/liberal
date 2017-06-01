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

var service = {
    id: 'spotify',
    uri: 'bungalow:service:spotify',
    type: 'service',
    name: 'Spotify',
    description: 'Music service'
};

SpotifyBrowseAPI.prototype.request = function (method, url, payload, postData, req, cb) {
    var self = this;
    this.req = req;
    return new Promise(function (resolve, fail) {
        var activity = function () {
            if (!payload.offset) payload.offset = 0;
            if (!isNaN(payload.offset)) payload.offset = parseInt(payload.offset);
            if (!payload.type) payload.type = 'track';
            if (!isNaN(payload.limit)) payload.limit = parseInt(payload.limit);
            if (!payload.limit) payload.limit = 30;
            
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
                url = 'https://api.spotify.com/v1/search?q=' + payload.q + '&type=' + (payload.type || 'track') + '&limit=' + (payload.limit || 39) + '&offset=' + (payload.offset || 1);
                request({
                        url: url,
                        headers: headers
                    },
                    function (error, response, body) {
                    
                        var data = JSON.parse(body);
                        try {
                            resolve({'objects': data[payload.type + 's'].items.map((o, i) => {
                                o.position = i + payload.offset;
                                return o;
                            }), 'service': service});
                        } catch (e) {
                            fail(e);
                        }
                    }
                );
            }
            if (parts[0] == 'me') {
                if (parts[1] == 'track') {
                    request({
                        url: 'https://api.spotify.com/v1/me/tracks?limit=85&limit=' + (payload.limit || 99) + '&offset=' + (payload.offset || 0) + '&country=se',
                        headers: headers
                        
                    },
                        function (error, response, body) {
                            var data = JSON.parse(body);
                            try {
                                resolve({
                                    type: 'library',
                                    name: 'Library',
                                    'objects': data.items.map(function (t, i) {
                                        var track = t.track;
                                        track.service = service;
                                        track.position = i + payload.offset;
                                        return track;
                                    })
                                });
                            } catch (e) {
                                fail();
                            }
                        }
                    );
                } else if (parts[1] == 'playlist') {
                 request({
                        url: 'https://api.spotify.com/v1/me/playlists?limit=' + (payload.limit || 99) + '&offset=' + (payload.offset || 0) + '&country=se',
                        headers: headers
                        
                    },
                        function (error, response, body) {
                            var data = JSON.parse(body);
                            try {
                                resolve({
                                    type: 'collection',
                                    name: 'Playlists',
                                    'objects': data.items.map(function (s, i){
                                        s.service = service;
                                        s.position = i + payload.offset;
                                        return s;
                                    }),
                                    service: service
                                });
                            } catch (e) {
                                fail(500);
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
                                    fail(500);
                                    return;
                                }
                                request(
                                    'https://api.spotify.com/v1/me/player',
                                    {
                                        headers: headers    
                                    },
                                    function (error2, response2, body2) {
                                         try {
                                            var result = JSON.parse(body2);
                                            result.service = service;
                                            resolve(result);
                                        } catch (e) {
                                            fail(500);
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
                                     var result = JSON.parse(body2);
                                     result.service = service;
                                    resolve(result);
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
                                    url: 'https://api.spotify.com/v1/artists/' + parts[1] + '/top-tracks?limit=' + (payload.limit || 99) + '&offset=' + (payload.offset || 0) + '&country=se',
                                    headers: headers
                                },
                                    function (error, response, body) {
                                        var data = JSON.parse(body);
                                        try {
                                            resolve({
                                                type: 'toplist',
                                                name: 'Top Tracks',
                                                'objects': data.tracks.slice(0,parseInt(parts[3])).map(function (t, i) {
                                                    t.service = service;
                                                    t.position = i;
                                                    return t;
                                                }),
                                                service: service
                                            });
                                        } catch (e) {
                                            fail();
                                        }
                                    }
                                );
                            }
                        } else {
                                request({
                                url: 'https://api.spotify.com/v1/artists/' + parts[1] + '',
                                headers: headers
                            },
                            function (error, response, body) {
                                var obj = JSON.parse(body);
                                resolve({
                                    type: 'toplist',
                                    name: 'Top Tracks',
                                    service: service,
                                    description: 'The top ' + parts[3] + ' tracks by <sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link> that have played at most',
                                    for: obj,
                                    uri: obj.uri + ':top:' + parts[3],
                                    images: [{
                                        url: '/images/toplist.svg'
                                    }]
                                });
                            });
                        }
                    }
                    if (parts[2] == 'release') {
                        var limit = (payload.limit || 10);
                        request({
                                url: 'https://api.spotify.com/v1/artists/' + parts[1] + '/albums?limit=' + (payload.limit || 99) + '&offset=' + (payload.offset || 0),
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
                            try {
                                var data = JSON.parse(body);
                                console.log(data);
                                data.service = service;
                                resolve(data);
                            } catch (e) {
                                fail(500);
                            }
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
                            if (error) {
                                fail(500);
                            }
                            try {
                                body = body.replace('spotify:', 'bungalow:');
                            
                                var data = JSON.parse(body);
                            
                                resolve({
                                    'objects': data.items.map(function (t, i) {
                                        t.service = service;
                                        t.position = i;
                                        return t;
                                    }),
                                    service: service
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
                           try {
                                body = body.replace(/spotify\:/, 'bungalow:');
                            
                                var data = JSON.parse(body);
                                data.service = service;
                                resolve(data);
                            } catch (e) {
                                fail(500);
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
                        try {
                            var data = JSON.parse(body);
                            data.service = service;
                            resolve(data);
                        } catch (e) {
                            fail();
                        }
                    }
                );
            }
            if (parts[0] == 'country') {
                var code = parts[1];
                if (parts[2] === 'category') {
                    if (parts[4] === 'playlist') {
                        request({
                            url: 'https://api.spotify.com/v1/browse/categories/' + parts[3] + '/playlists?country=' + parts[1] + '&limit=' + payload.limit + '&offset=' + payload.offset,
                            headers: headers
                        }, function (err, response, body) {
                            try {
                                var result = JSON.parse(body);
                                resolve({
                                    objects: result.playlists.map(function (o) {
                                        o.service = service;
                                        return o;
                                    })
                                });
                            } catch (e) {
                                fail(500);
                            }
                        });
                        return;
                    }
                } else if (parts[2] === 'top') {
                    if (parts[4] === 'track') {
                        if (parts[1] == 'qi') {
                            var result = { 
                                name: 'Qiland',
                                id: 'qi',
                                service: service
                            };
                            url = 'https://api.spotify.com/v1/users/drsounds/playlists/2KVJSjXlaz1PFl6sbOC5AU';
                            request({
                                url: url,
                                headers: headers
                            }, function (err, response, body) {
                                try {
                                    request({
                                        url: url + '/tracks',
                                        headers: headers
                                    }, function (err2, response2, body2) {
                                        var result3 = JSON.parse(body2);
                                        resolve({
                                            objects: result3.items.map(function (track, i) {
                                                var track = assign(track, track.track);
                                                track.user = track.added_by;
                                                track.time = track.added_at;
                                                track.position = i;
                                                track.service = service;
                                                if (track.user)
                                                track.user.name = track.user.id;
                                                track.user.service = service;
                                                return track;
                                            })
                                        });
                                    });
                                } catch (e) {
                                    fail(500);
                                }
                            });
                            return;
                        }
                        request({
                            url: 'https://api.spotify.com/v1/browse/categories/toplists/playlists?country=' + parts[1] + '&limit=' + payload.limit + '&offset=' + payload.offset,
                            headers: headers
                        }, function (err, response, body) {
                            try {
                                var result = JSON.parse(body);
                                result = { objects: result.playlists.items };
                                request({
                                    url: result.objects[0].href + '/tracks',
                                    headers: headers
                                }, function (err2, response2, body2) {
                                    var result3= JSON.parse(body2);
                                    resolve({
                                        objects: result3.items.map(function (track, i) {
                                            var track = assign(track, track.track);
                                            track.user = track.added_by;
                                            track.album.service = service;
                                            track.position = i;
                                            track.artists = track.artists.map(function (a) {
                                                a.service = service;
                                                return a;
                                            })
                                            track.service = service;
                                            track.time = track.added_at;
                                            if (track.user)
                                            track.user.name = track.user.id;
                                            return track;
                                        })
                                    });
                                });
                            } catch (e) {
                                fail(500);
                            }
                        });
                        return;
                    } else {
                        if (code === 'qi') {
                            var result = {
                                id: parts[3],
                                uri: 'spotify:country:' + code + ':top:' + parts[3],
                                name: 'Top Tracks',
                                type: 'toplist',
                                service: service,
                                images: [{
                                    url: ''
                                }],
                                in: {
                                    id: 'qi',
                                    type: 'country',
                                    name: 'Qiland',
                                    uri: 'spotify:country:qi',
                                    service: service,
                                    images: [{
                                        url: ''
                                    }]
                                },
                                description: 'The most popular tracks in Qiland'
                            };
                            resolve(result);
                            return;
                        }
                        request({
                            url: 'https://restcountries.eu/rest/v2/alpha/' + code,
                            headers: headers
                        }, function (err2, response2, body2) {
                            
                            try {
                                var result = JSON.parse(body2);
                               
                                resolve({
                                    id: parts[3],
                                    uri: 'spotify:country:' + code + ':top:' + parts[3],
                                    name: 'Top Tracks',
                                    type: 'toplist',
                                    service: service,
                                    images: [{
                                        url: result.flag
                                    }],
                                    in: result,
                                    description: 'The most popular tracks in ' + result.name
                                })
                            } catch (e) {
                                fail(500);
                            }
                        });
                    }
                } else if (parts[2] === 'playlist') {
                    request({
                        url: 'https://api.spotify.com/v1/browse/categories/toplists/playlists?country=' + parts[1] + '&limit=' + payload.limit + '&offset=' + payload.offset,
                        headers: headers
                    }, function (err, response, body) {
                        try {
                            var result = JSON.parse(body);
                            resolve({
                                objects: result.playlists.map(function (p) {
                                    p.service = service;
                                    p.owner.service = service;
                                })
                            });
                        } catch (e) {
                            fail(500);
                        }
                        return;
                    })
                }  else {
                    if (code == 'qi') {
                        resolve({
                            type: 'country',
                            name: 'Qiland',
                            id: 'qi',
                            uri: 'spotify:country:qi',
                            service: service,
                            images: [
                                {
                                    url: ''
                                }    
                            ]
                        })
                    }
                    request({
                        url: 'https://restcountries.eu/rest/v2/alpha/' + code,
                    }, function (error, response, body) {
                        try {
                            var result = JSON.parse(body);
                            result.type = 'country';
                            result.uri = 'spotify:country:' + code;
                            result.service = service;
                            result.images = [{
                                url: result.flag
                            }]
                            resolve(result);
                        } catch (e) {
                            fail(500);
                        }
                    });
                    return;
                    
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
                            url = 'https://api.spotify.com/v1/users/' + userid + '/playlists?limit=' + (payload.limit || 99) + '&offset=' + (payload.offset || 0)
                            request({
                                url: url,
                                headers: headers
                            }, function (error, response, body) {
                                try {
                                    var result = JSON.parse(body);
                                     resolve({
                                        'objects': result.items.map((p) => {
                                            p.owner.name = p.owner.id;
                                            p.service = service;
                                            p.owner.service = service;
                                            return p;
                                        })
                                    });
                                } catch (e) {
                                    fail(503);
                                }
                               
                            });
                            return;
                        } else {
                            if (parts[4] == 'follower') {
                                var users = [];
                                for (var i = 0; i < 10; i++) {
                                    users.push({
                                        'id': 'follower' + i,
                                        'name': 'Track ' + i,
                                        'uri': 'spotify:user:' + parts[3] + ':follower:' + i,
                                        service: {
                                            id: 'mock',
                                            name: 'Mock',
                                            uri: 'bungalow:service:mock'
                                        }
                                    });
                                }
                                resolve({
                                    'objects': users,
                                    service: {
                                        id: 'mock',
                                        name: 'Mock',
                                        uri: 'bungalow:service:mock'
                                    }
                                });
                            } else if (parts[4] == 'track') {
                                url = 'https://api.spotify.com/v1/users/' + parts[1] + '/playlists/' + parts[3] + '/tracks?limit=' + (payload.limit || 50) + '&offset=' + (payload.offset || 1);
                                request({
                                    url: url,
                                    headers: headers
                                }, function (error, response, body) {
                                    try {
                                        var result = JSON.parse(body);
                                        resolve({
                                            'objects': result.items.map(function (track, i) {
                                                var track = assign(track, track.track);
                                                if (track.added_by)
                                                    track.added_by.service = service;
                                                track.user = track.added_by;
                                                track.time = track.added_at;
                                                track.position = parseInt(payload.offset) + i;
                                                track.service = service;
                                                track.album.service = service;
                                                track.artists = track.artists.map(function (a) {
                                                    a.service = service;
                                                    return a;
                                                })
                                                if (track.user) {
                                                    track.user.name = track.user.id;
                                                    track.user.service = service;
                                                }
                                                return track;
                                            })
                                        })
                                    } catch (e) {
                                        fail(500);
                                    }
                                });
                            } else {
                                request({
                                    url: 'https://api.spotify.com/v1/users/' + parts[1] + '/playlists/' + parts[3] + '',
                                    headers: headers
                                }, function (error, response, body) {
                                    try {
                                        var result = JSON.parse(body);
                                        result.owner.name = result.owner.id;
                                        result.service = service;
                                        result.owner.service = service;
                                        resolve(result);
                                    } catch (e) {
                                        fail(500);
                                    }
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
                                fail(500);
                            }
                            try {
                                var user = JSON.parse(body);
                                if (user) {
                                    user.name = user.display_name;
                                    user.service = service;
                                }
                                resolve(user);
                            } catch (e) {
                                fail(500);
                            }
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
                                try {
                                    var result = JSON.parse(body);
                                
                                    
                                    resolve({
                                        'objects': result.playlists.items.map(function (pls, i) {
                                            pls.service = service;
                                            pls.position = i + payload.offset;
                                        }),
                                        service: service
                                    });
                                } catch (e) {
                                    fail(500);
                                }
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
                                user.service = service;
                                resolve(user);
                            } catch (e) {
                                fail(500);
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
        }, 99);
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
                    track.duration = track.duration_ms / 990;
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
