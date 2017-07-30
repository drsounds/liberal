define(['events', 'services/spotify/spotify'], function (EventEmitter, SpotifyMusicService) {
    /**
     * Data store for application
     **/
    class Store extends EventEmitter {
        constructor() {
            super();
            this.services = {
                'spotify': new SpotifyMusicService()
            };
            this.state = {};
            /*
             this.heart = setInterval(async () => {
             this.state.player = await this.getCurrentTrack();
             this.emit('change');

             }, 1000);*/
            this.hue = this.hue;
            this.saturation = this.saturation;
            this.flavor = this.flavor;
            this.stylesheet = this.stylesheet;
            this.discoveredTracks = JSON.parse(localStorage.getItem('discoveredTracks')) || {
                    objects: []
                };
        }

        getDiscoveredTracks(track, playlist=null) {
            let results = this.discoveredTracks.objects.filter((t) => t.uri == track.uri);
            if (playlist != null)
                results = results.filter((t) => {
                    return t.playlists.filter((o) => o.uri == playlist.uri).length > 0
                });
            return results;

        }
        hasDiscoveredTrack(track, playlist=null) {
            return this.getDiscoveredTracks(track, playlist).length > 0;
        }
        discoverTrack(track, playlist=null, position=-1, played=false) {
            track.playlists = [];
            track.played = played;
            if (playlist != null) {
                if(!playlist.positions) {
                    playlist.positions = [];
                }
                playlist.positions.push({
                    position: position,
                    time: new Date()
                });
                track.playlists.push(playlist);
            }
            this.discoveredTracks.objects.push(track);
            //    localStorage.setItem('discoveredTracks', JSON.stringify(this.discoveredTracks));
        }
        get stylesheet() {
            let stylesheet = localStorage.getItem('stylesheet');
            if (!stylesheet) {
                stylesheet = 'chromify';
            }
            return stylesheet;
        }
        set stylesheet(value) {
            applyTheme(value, this.flavor);
            localStorage.setItem('stylesheet', value);
        }
        get flavor() {
            let flavor = localStorage.getItem('flavor');
            if (!flavor) {
                flavor = 'light';
            }
            return flavor;
        }
        set flavor(value) {
            applyTheme(this.stylesheet, value);
            localStorage.setItem('flavor', value);
        }
        get hue() {
            let hue = localStorage.getItem('hue');
            if (!hue) return 0;
            return hue;
        }


        /**
         * Sets app global hue
         **/
        set saturation(value) {
            document.documentElement.style.setProperty('--primary-saturation', value + '%');
            localStorage.setItem('saturation', value);
        }

        get saturation() {
            let saturation = localStorage.getItem('saturation');
            if (!saturation) return 0;
            return saturation;
        }


        /**
         * Sets app global hue
         **/
        set hue(value) {
            document.documentElement.style.setProperty('--primary-hue', value + 'deg');
            localStorage.setItem('hue', value);
        }

        /**
         * Save state
         **/
        saveState() {
            //   localStorage.setItem('store', JSON.stringify(this.state));
        }

        /**
         * Load state
         **/
        loadState() {
            if (!localStorage.getItem('store'))
                return {};

            return JSON.parse(localStorage.getItem('store'));
        }

        async playPause() {
            this.state.player = await this.getCurrentTrack();
            let result = null;
            if (this.state.player.is_playing) {
                result = await this.request('PUT', 'spotify:me:player:pause');
            } else {
                result = await this.request('PUT', 'spotify:me:player:play');
            }
            this.state.player = await this.getCurrentTrack();
            this.emit('change');
        }

        /**
         * Set state for resource
         **/
        setState(uri, state) {
            this.state[uri] = state;
            this.emit('change');
            this.saveState();
        }
        async play(context) {


            let result = await this.request('PUT', 'spotify:me:player:play', {}, context, false);
            this.state.player = await this.getCurrentTrack();
            this.emit('change');

        }
        async playTrack(track, context) {
            await this.request('PUT', 'spotify:me:player:play', {}, {
                context_uri: context.uri,
                position: {
                    uri: track.uri
                }
            });
        }
        async playTrackAtPosition(position, context) {
            await this.request('PUT', 'spotify:me:player:play', {}, {
                context_uri: context.uri,
                position: {
                    offset: position
                }
            });
        }
        async getCurrentTrack() {
            let result = await this.request('GET', 'spotify:me:player:currently-playing', null, null, false);

            return result;
        }
        async request(method, uri, params, payload, cache=true) {
            if (uri in this.state && method == "GET" && cache)
                return this.state[uri];
            try {
                let esc = encodeURIComponent
                let query = params ?  Object.keys(params)
                        .map(k => esc(k) + '=' + esc(params[k]))
                        .join('&') : '';

                if (uri == null) return;
                var url = uri;
                if (uri.indexOf('bungalow:') == 0 || uri.indexOf('spotify:') == 0) {
                    url = '/api/' + url.split(':').slice(1).join('/') + '?' + query;
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

        /**
         * Get album by ID
         **/
        async getAlbumById(id) {
            let uri = 'spotify:album:' + id;
            let result = await fetch('/api/album/' + id, {credentials: 'include', mode: 'cors'}).then((e) => e.json())
            this.setState(uri, result);
            return result;
        }
        async getArtistById(id) {
            let uri = 'spotify:artist:' + id;
            let result = await fetch('/api/artist/' + id, {credentials: 'include', mode: 'cors'}).then((e) => e.json());
            this.setState(uri, result);
            return result;
        }
        login() {
            return new Promise((resolve, reject) => {
                var loginWindow = window.open('/api/music/login');

                var t = setInterval(() => {
                    if (!loginWindow) {
                        clearInterval(t);
                        resolve(true);
                    }
                });
            });
        }

    }
    return Store;
})