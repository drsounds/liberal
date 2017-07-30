define(function () {
    /**
     * Spotify music service
     **/
    return class SpotifyMusicService {

        async playPause() {
            this.state.player = await this.getCurrentTrack();
            let result = null;
            if (this.state.player.is_playing) {
                this.pause();
            } else {
                this.resume();
            }
            this.state.player = await this.getCurrentTrack();
            this.emit('change');
        }
        async playTrack(track, context) {
            await this._request('PUT', 'spotify:me:player:play', {}, {
                context_uri: context.uri,
                position: {
                    uri: track.uri
                }
            });
        }
        async playTrackAtPosition(position, context) {
            await this._request('PUT', 'spotify:me:player:play', {}, {
                context_uri: context.uri,
                position: {
                    offset: position
                }
            });
        }
        async lookupTrack(name, version, artist, album) {
        }
        async getCurrentTrack() {
            let result = await this._request('GET', 'spotify:me:player:currently-playing', null, null, false);

            return result;
        }
        async resume() {
            return await this._request('PUT', 'spotify:me:player:play');

        }
        async pause() {
            return await this._request('PUT', 'spotify:me:player:pause');
        }
        async _request(method, uri, payload, cache=true) {
            try {
                if (uri == null) return;
                var url = uri;
                if (uri.indexOf('bungalow:') == 0 || uri.indexOf('spotify:') == 0) {
                    if (uri.indexOf('spotify:') == 0) {
                        uri = 'bungalow:' + uri.substr('spotify:'.length);
                    }
                    url = uri.substr('bungalow:'.length).split(':').join('/');

                    url = '/api' + url;
                    if (uri in this.state && method == "GET" && cache)
                        return this.state[uri];
                    let result
                    if (method === 'GET') {
                        result = await fetch(url, {
                            credentials: 'include',
                            mode: 'cors',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            method: 'GET',
                        }).then((e) => e.json());
                    } else {
                        result = await fetch(url, {
                            credentials: 'include',
                            mode: 'cors',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            method: method,
                            body: JSON.stringify(payload)
                        }).then((e) => e.json());
                    }
                    this.setState(uri, result);
                    return result;

                }
                if (uri in this.state)
                    return this.state[uri];

                let result = await fetch(url, {credentials: 'include', mode: 'cors'}).then((e) => e.json());
                this.setState(uri, result);

                return result;
            } catch (e) {
                alert("An error occured");
            }
        }
    }
})