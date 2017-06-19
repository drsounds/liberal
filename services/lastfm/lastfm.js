var assign = require('object-assign');
var fs = require('fs');
var os = require('os');
var request = require('request');
function LastFMService () {
    this.apikeys = JSON.parse(fs.readFileSync(os.homedir() + '/.bungalow/lastfm.key.json'));
}
LastFMService.prototype._request = function (method, method2, qs) {
    return new Promise(function (resolve, reject) {
        request({
            method: method,
            url: 'http://ws.audioscrobbler.com/2.0/',
            query: assign({
                api_key: this.apikeys.api_key,
                format: 'json',
                method: method2
            }, qs)
        }, function (err, response, body) {
            if (err) {
                reject(err);
                return;
            }
            try {
                var result = JSON.parse(body);
                resolve(result);
            } catch (e) {
                reject(500);
            }
        })
    });
}

LastFMService.prototype.getArtistInfo = function (id) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self._request('GET', 'getArtistInfo', { artist: id}).then(function (result) {
           var artist = result.artist;
           artist.uri = 'lastfm:artist:' + id;
           artist.images = artist.image.map(function (image) {
               return {
                   url: image['#text']
               };
           });
           if (artist.bio) {
               artist.description = artist.bio.summary;
               artist.biography = artist.bio.content;
           }
           artist.service = {
               id: 'lastfm',
               name: 'Last.FM',
               uri: 'bungalow:service:lastfm'
           }
        });
    });
}

module.exports = LastFMService;