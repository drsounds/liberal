var request = require('request');
var fs = require('fs'); 
var Social = function () {

}

Social.prototype.request = function (method, url, params) {
    console.log(url);
    var promise = new Promise(function (resolve, fail) {

        var parts = url.split(/\//g);
        console.log(parts);
        if (parts[0] == 'hashtag') {
            console.log("F");
            var hastag = parts[1];

            var objects = [];
          
            objects.push({
                uri:'bungalow:post:2AdFgV',
                user: {
                    id: 'drsounds',
                    name: 'Alecca Krikelin'
                },
                message: '#NowPlaying Music for Yoga',
                resource: {
                    uri: 'bungalow:user:drsounds:playlist:6BkqlkVfg1kqoYREmN7yeD',
                    type: 'playlist'
                }
            });

            objects.push({
                uri:'bungalow:post:2AdFgV',
                user: {
                    id: 'drsounds',
                    name: 'Alecca Krikelin'
                },
                message: '#NowPlaying music for Yoga',
                resource: {
                    uri: 'spotify:album:7i3AkrIAqqHlEdiB2dai7z',
                    type: 'album'
                }
            });
            objects = objects.slice(params.offset);
            
            console.log("A");
            resolve({  
                objects: objects
            });
        }
        
    });
    return promise;
}

module.exports = Social;