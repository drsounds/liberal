requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js',  
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        plugins: '../plugins'
    }
});

requirejs([],
function () {
    class EventEmitter {
        constructor() {
            this.listeners = [];
            
        }
        on(event, cb) {
            this.listeners.push({
                type: event,
                callback: cb
            });
        }
        emit(event) {
            let callbacks = this.listeners.filter((e) => e.type == event).forEach((event) => {
                event.callback.apply(this, arguments);
            });
        }
    }

    function applyTheme(theme, flavor='light') {
        let link = document.querySelector('link[id="theme"]');
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('id', 'theme');
            document.head.appendChild(link);
            link.setAttribute('rel', 'stylesheet');
        }
        let link2 = document.querySelector('link[id="theme_variant"]');
        if (!link2) {
            link2 = document.createElement('link');
            link2.setAttribute('id', 'theme_variant');
            document.head.appendChild(link2);
            link2.setAttribute('rel', 'stylesheet');
        }
        link2.setAttribute('href', '/themes/' + theme + '/css/' + flavor + '.css');
        link.setAttribute('href', '/themes/' + theme + '/css/' + theme + '.css');
    }


    applyTheme('chromify', 'light');


    class MusicService {
        constructor() {
            this.state = {};
        }
        /**
         * Pause playback
         **/
        pause() {
            
        }
        
        /**
         * Play track
         * */
        play(track) {
            
        }
        
        /**
         * Look up track
         **/
        lookupTrack(name, version, artist, album) {
            
        }
        
    }


    /**
     * Spotify music service
     **/
    class SpotifyMusicService extends MusicService {
        constructor() {
            super();
        }
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


    var store = new Store();


    class SPThemeEditorElement extends HTMLElement {
        attachedCallback() {
            if (!this.created) {
                this.colorChooser = document.createElement('input');
                this.colorChooser.setAttribute('type', 'range');
                this.innerHTML += '<label>' + _('Accent color') + '</label>';
                this.appendChild(this.colorChooser);
                this.colorChooser.setAttribute('max', 360);
                this.colorChooser.addEventListener('change', this.hueSlider);
                this.colorChooser.addEventListener('mousemove', this.hueSlider);
                this.saturationChooser = document.createElement('input');
                this.saturationChooser.setAttribute('type', 'range');
                this.label = document.createElement('label');
                this.label.innerHTML = _('Saturation');
                this.appendChild(this.saturationChooser);
                this.appendChild(this.label);
                this.saturationChooser.setAttribute('max', 360);
                this.saturationChooser.value = store.saturation;
                this.styleselect = document.createElement('select');
                this.styleselect.innerHTML += '<option value="bungalow">Bungalow</option><option value="maestro">Maestro</option><option value="obama">Obama</option><option value="obama-2010">Obama 2010</option><option value="obama-flat">Obama (flat)</option><option value="chromify">Chromify</option><option value="wmp_11">Windows Media Player 11</option><option value="wmp_11_beta">Windows Media Player 11</option><option value="wmp_10">Windows Media Player 10</option><option value="wmp_9">Windows Media Player 9</option>';
                this.appendChild(this.styleselect);
                this.flavorselect = document.createElement('select');
                this.flavorselect.innerHTML += '<option value="dark">' + _('Dark') + '</option><option value="light">' + _('Light') + '</option>';
                this.appendChild(this.flavorselect);
                this.saturationChooser.addEventListener('change', this.saturationSlider);
                this.saturationChooser.addEventListener('mousemove', this.saturationSlider);
                this.flavorselect.addEventListener('change', (e) => {
                    store.flavor = e.target.options[e.target.selectedIndex].value;
                });
                 this.styleselect.addEventListener('change', (e) => {
                    store.stylesheet = e.target.options[e.target.selectedIndex].value;
                });
                this.created = true;
                
            }
        }
        hueSlider(e) {
            let value = e.target.value;
            store.hue = value;
        
        }
        saturationSlider(e) {
            let value = e.target.value;
            store.saturation = value;
        
        }
    }

    document.registerElement('sp-themeeditor', SPThemeEditorElement);

    class SPAppHeaderElement extends HTMLElement {
        attachedCallback() {
            if (!this.created) {
                if (!this.searchForm) {
                    this.searchForm = document.createElement('sp-searchform');
                    if (localStorage.getItem("stylesheet") === 'maestro') {
                        document.body.appendChild(this.searchForm);
                    } else {
                        this.appendChild(this.searchForm);
                    }         
                    this.searchForm.style.marginRight = '5pt';
                }
                this.loginButton = document.createElement('button');
                this.loginButton.innerHTML = _('Log in');
                this.loginButton.addEventListener('click', (e) => {
                   GlobalViewStack.navigate('bungalow:internal:login'); 
                });
                this.appendChild(this.loginButton);
                this.created = true;
            }
        }
        
    }


    class SPInfoBarElement extends HTMLElement {
        hide() {
            this.style.display = 'none';
        }
        show() {
            this.style.display = 'block';
        }
        setState(obj) {
            this.innerHTML = '';
            this.innerHTML = '<i class="fa fa-info"></i> ' + obj.name;
            this.closeButton = document.createElement('a');
            this.appendChild(this.closeButton);
            this.closeButton.classList.add('fa');
            this.closeButton.classList.add('fa-times');
            this.closeButton.style = 'float: right';
            this.closeButton.addEventListener('click', (e) => {
                this.hide();
            });
        }
    }


    document.registerElement('sp-infobar', SPInfoBarElement);

    document.registerElement('sp-appheader', SPAppHeaderElement);

    window.addEventListener('error', (e) => {
        
        
    });



    

    

    

    var GlobalTabBar = null;

    class SPMainElement extends HTMLElement {
        attachedCallback() {
            if (!this.viewStack) {
                this.tabBar = document.createElement('sp-tabbar');
                this.appendChild(this.tabBar);
                GlobalTabBar = this.tabBar;
                this.viewStack = document.createElement('sp-viewstack');
                GlobalViewStack = this.viewStack;
                this.appendChild(this.viewStack);
                
                
            }
        }
    }
    document.registerElement('sp-main', SPMainElement);

    

    const TOTAL_ARTISTS_ON_SPOTIFY = 2000000;

    

    const VERIFIED_PROFILES = ['drsounds', 'alexanderforselius', 'daniel', 'spotify'];

    


    


    class SPTableDataSource {
        get numberOfRows () {
            return 0;
        }
        get numberOfColumnHeaders () {
            return 0;
        }
        getRowAt(rowId, row) {
            throw "NotImplementedException"
        }
        getColumnAt(pos) {
            throw "NotImplementedException"
        }
        getNumberOfChildren(row) {
            return 0;
        }
        getChildRowAt(parentRowId, rowId) {
            return null;
        }
        /**
         * Fetch next rows
         **/
        fetchNext() {
            // TODO Implement fetch next
        }
    }


    

    

    

    


    




    

    


    

    


 

    /*
    class SPAlbumElement extends SPResourceElement {
        attachedCallback() {
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (attrName == 'uri') {
                
              let result = await store.request('GET', newVal);
                this.setState(result);
            }
        }
        setState(obj) {
            this.innerHTML = '' +
            '<div style="flex: 0 0 128">' +
                '<sp-image src="' + obj.images[0].url + '" width="128" height="128"></sp-image>' + 
            '</div>' +
            '<div flex="2>' +
                '<h3><sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link></h3>' +
                '<sp-trackcontext uri="' + obj.uri + ':track' + '"></sp-trackcontext>' +
            '</div>';
        }
    }

    document.registerElement('sp-album', SPAlbumElement);
    /*
    class SPTopTracksElement extends SPResourceElement {
        attachedCallback() {
            
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (attrName == 'uri') {
                
              let result = await store.request('GET', newVal);
                this.setState(result);
            }
        }
        setState(obj) {
            this.innerHTML = '<table width="100%" class="header"><tbody><tr><td valign="top" width="128"><img src="/images/toplist.svg" width="128" height="128"></td>' +
                '<td valign="top"><h3>Top Tracks</h3>' +
                '<sp-trackcontext uri="' + obj.uri + ':top:5:track' + '"></sp-trackcontext>' +
                '</td></tr></tbody></table>';
        }
    }

    document.registerElement('sp-toptracks', SPTopTracksElement);*/

    class SPPlaylistElement extends SPResourceElement {
        attachedCallback() {
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName == 'uri') {
                
              let result = await store.request('GET', newVal);
                this.setState(result);
            }
        }
        setState(obj) {
            let strReleaseDate = '';
            if (obj.release_date instanceof String) {
                strReleaseDate = obj.release_date;
                let releaseDate = moment(obj.release_date);
                if (Math.abs(releaseDate.diff(moment(), 'days')) < 15) {
                    strReleaseDate = releaseDate.fromNow();
                } 
            }
            if ('tracks' in obj)
                store.state[obj.uri + ':track'] = obj.tracks;   
            let titleElement = document.createElement('sp-title');
            titleElement.setState(obj);
            let dataContextUri = this.getAttribute('data-context-artist-uri') || null;
            let maxRows = this.getAttribute("data-max-rows");

            this.innerHTML = '';
            let fields =  this.getAttribute('fields');
            this.object = obj;
            let template = _.unescape(document.querySelector('#playlistTemplate').innerHTML);
            this.innerHTML = _.template(template)({
                title: titleElement.innerHTML,
                strReleaseDate: strReleaseDate,
                fields: fields,
                maxRows: maxRows,
                obj: obj,
                dataContextUri: dataContextUri
            });
            
            if (this.view != null && localStorage.getItem('vibrance') == 'true') {
                this.vibrance();
            }
        }
        vibrance() {
            let img = document.createElement('img');
            img.crossOrigin = '';
            img.src = this.object.images[0].url;
            img.onload = () => {
            
                var vibrant = new Vibrant(img);
                let color = vibrant.swatches()['Vibrant'];
                let light = vibrant.swatches()['LightVibrant'];
                let muted = vibrant.swatches()['Muted'];
                
                let bgColor = swatchToColor(color);
                
            //    this.view.style.backgroundColor = bgColor;
                let background = 'linear-gradient(-90deg, ' + swatchToColor(color) + ' 0%, ' + swatchToColor(muted) + ' 10%)';
                this.view.style.background = background;
            }
        }
    }

    function swatchToColor(color) {
        return 'rgba(' + color.rgb[0] + ',' + color.rgb[1] + ',' + color.rgb[2] + ', 0.3)';
    }


    function rgbToRgba(rgb, alpha) {
        let str = 'rgba';
        let tf = rgb.split('(')[1].split(')')[0].split(',');
        str += '(' + tf + ',' + alpha + ')';
        return str;

    }



    document.registerElement('sp-playlist', SPPlaylistElement);

    String.prototype.toQuerystring = function () {
        var args = this.substring(0).split('&');

        var argsParsed = {};

        var i, arg, kvp, key, value;

        for (i=0; i < args.length; i++) {

            arg = args[i];

            if (-1 === arg.indexOf('=')) {

                argsParsed[decodeURIComponent(arg).trim()] = true;
            }
            else {

                kvp = arg.split('=');

                key = decodeURIComponent(kvp[0]).trim();

                value = decodeURIComponent(kvp[1]).trim();

                argsParsed[key] = value;
            }
        }

        return argsParsed;
    }


    


    class SPCountryViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            if (!this.created) {
                this.classList.add('sp-view');
                this.header = document.createElement('sp-header');
                this.appendChild(this.header);
                this.albumsDivider = document.createElement('sp-divider');
                this.albumsDivider.innerHTML = 'Top Tracks';
                this.appendChild(this.albumsDivider);
                this.topTracks = document.createElement('sp-playlist');
                this.appendChild(this.topTracks);
                this.created = true;
            }
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName == 'uri') {
                
                let result = await store.request('GET', newVal);
                this.state = result;
                
                this.setState(this.state);    
                this.topTracks.setAttribute('uri', newVal + ':top:5');
                this.setState(this.state);
                this.activate();
            }
        }
        setState(state) {
            this.header.setState(state);
        }
    }

    document.registerElement('sp-countryview', SPCountryViewElement);


    String.prototype.toHHMMSS = function () {
        var sec_num = parseInt(this, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);
        var strHours = hours, strMinutes = minutes, strSeconds = seconds;
        if (hours   < 10) {strHours   = "0"+hours;}
        if (minutes < 10) {strMinutes = "0"+minutes;}
        if (seconds < 10) {strSeconds = "0"+seconds;}
        return (hours > 0 ? strHours+':' : '') + strMinutes + ':' + strSeconds;
    }

    /*
    class SPTrackContextElement extends SPResourceElement {
        constructor() {
            super();
            
        }
        attachedCallback() {
            console.log("T");
            if (!this.created) {
                if (!this.hasAttribute('fields'))
                this.setAttribute('fields', 'name,duration,artists,album,user');
        
                this.table = document.createElement('table');
                this.appendChild(this.table);
                this.table.style.width = '100%';
                this.attributeChangedCallback('uri', null, this.getAttribute('uri'));
                
                this.style.display = 'block';
                this.thead = this.querySelector('thead');
                this.created = true;
            }
        }   
        async attributeChangedCallback(attrName, oldVal, newVal) {
            this.obj = await store.request('GET', newVal);
            
        }
        activate() {
            // this.checkState();
        }
        get limit() {
            if (!this.hasAttribute('limit')) return 30;
            return parseInt(this.getAttribute('limit'));
        }
        set limit(value) {
                this.setAttribute('limit', value);
        }
        get offset() {
            if (!this.hasAttribute('offset')) return 0;
                return parseInt(this.getAttribute('offset'));
        }
        get uri() {
            return this.getAttribute('uri');
        }
        set uri(value) {
            this.setAttribute('uri', value);
        }
        set offset(value) {
            this.setAttribute('offset', value);
        }
        get query() {
            return this.getAttribute('query');
        }
        set query(value) {
            this.setAttribute('query', value);
        }
        set header(val) {
            this._header = val;
        }
        get header() {
            return this._header;
        }
        get view() {
            return this._view;
        }
        set view(val) {
            
            this._view = val;
            this._view.addEventListener('scroll', this._onScroll.bind(this));
        }
        _onScroll(e) {
            let view = e.target;
            let viewBounds = view.getBoundingClientRect();
            let bounds = this.getBoundingClientRect();
            let tabBar = GlobalTabBar.getBoundingClientRect();
            let headerHeight = 0;
            if (this.header) {  
                headerHeight = this.header.getBoundingClientRect().height;;
            } 
            console.log(bounds.top, viewBounds.top);
            if (view.scrollTop > headerHeight ) {
                view.style.display = 'block';
                let transform = 'translateY(' + ( view.scrollTop - headerHeight) + 'px)';
                this.thead.style.transform = transform; 
            } else {
                this.thead.style.transform = 'translateY(0px)';
            }
            let gondole = this.querySelector('sp-gondole');
            if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height) {
                if (!gondole.hasAttribute('activated'))
                this.fetchNext();
            }
        
        }
        
        
        checkState() {
            let trs = this.querySelectorAll('tr.sp-track');
            for (let i = 0; i < trs.length; i++) {
                let tr = trs[i];
                let track = store.discoveredTracks.objects.filter((t) => t.uri === tr.getAttribute('data-uri'))[0];
                if (track) {
                    let discovered = track.playlists.filter((p) => {
                        let uri1 = p.uri.substr(p.uri.split(':')[0].length) + ':track';
                        let uri2 = this.getAttribute('uri').substr(p.uri.split(':')[0].length + 1);
                        return uri1 === uri2;
                    }).length > 0;
                    if (discovered) {
                        tr.querySelector('td.discovered').innerHTML = '';
                    }
                }
            }
        }
        
        async fetchNext() {
            let gondole = this.querySelector('sp-gondole');
            if (gondole)
            gondole.setAttribute('activated', 'true');
            this.offset += this.limit;
            let result = await store.request('GET', this.uri,{q: encodeURIComponent(this.q), type: 'track', limit: this.limit, offset: this.offset});
            if (result && result.objects instanceof Array && result.objects.length > 0) {
                result.objects.map(this.createTrack.bind(this)).map((tr) => {
                    this.tbody.appendChild(tr);
                });
                if (gondole)
                    gondole.setAttribute('activated', false);
            } else {  
                if (gondole)
                    this.querySelector('tfoot').removeChild(gondole);
            }
        }
        
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            let uri = newVal;
            if (attrName == 'uri') {
                
            }
        }
        createTrack (track, i) {
            let tr = document.createElement('tr');
            tr.addEventListener('mousedown', (e) => {
               let selectedTracks = document.querySelectorAll('.sp-track-selected');
               for (let t of selectedTracks) {
                   t.classList.remove('sp-track-selected');
               }
               tr.classList.add('sp-track-selected');
            });
            /*if (!(track.is_playable || (track.track && track.track.is_playable) || 'is_playable')) {
                tr.classList.add('sp-track-unavailable');
            }
            tr.classList.add('sp-track');
            tr.setAttribute('data-uri', track.uri);
            tr.setAttribute('data-position', track.position);
            if (isNaN(track.position)) throw "Error";
            
            tr.setAttribute('data-index', i);
            if (this.hasAttribute('data-context-artist-uri')) {
                let contextArtistUri = this.getAttribute('data-context-artist-uri').replace(
                    'bungalow', 'spotify'    
                );
                if (track.artists.filter( a => a.uri == contextArtistUri).length < 1 && !!contextArtistUri) {
                    tr.style.opacity = 0.6;
                }
            }
            tr.addEventListener('dblclick', (e) => {
                let tr = e.target.parentNode;
                while (tr.localName != 'tr') {
                    tr = tr.parentNode;
                }
                let position = tr.getAttribute('data-position'); 
                position = parseInt(position);
                if (this.getAttribute('uri').indexOf('bungalow:album') == 0 || this.getAttribute('uri').indexOf('bungalow:user') == 0 ) {
                    store.play({
                        context_uri: 'spotify:' + this.getAttribute('uri').substr('bungalow:'.length),
                        offset: {
                            position: position
                        }
                    });
                     tr.classList.remove('loading-bg');
               
                } else {
                    let xris = Array.prototype.filter.call(this.querySelectorAll('tr'), (o) => {
                        return o != null && o.getAttribute('data-uri') != null && o.getAttribute('data-uri').indexOf('spotify:local') != 0;
                    });
                    let uris = Array.prototype.map.call(xris, (o) => o.getAttribute('data-uri'));
                    store.play({
                        uris: uris,
                        offset: {
                            position: position
                        }
                    });
                }
             /*   
                debugger;
                 
            });
            if (store.state.player && store.state.player.item && store.state.player.item.uri == track.uri) {
                tr.classList.add('sp-current-track');
            }
            this.fields.map((field, i) => {
              var td = document.createElement('td');
              let val = track[field];
              if (field === 'p' || field === 'position') {
                  td.width = '1pt';
                  if (parseInt(val) < 10) {
                      val = '0' + val;
                  }
                  td.innerHTML = '<span style="text-align: right; opacity: 0.5">' + val + '</span>';
              } else if (field === 'duration') {
                  td.innerHTML = '<span style="opacity: 0.5">' + (val + '') .toHHMMSS() + '</span>';
                  td.width = '10pt';
              } else if (field === 'popularity') {
                  td.innerHTML = '<sp-popularitybar value="' + (track.popularity || 0) + '"></sp-popularitybar>';
              } else if (field === 'discovered') {
                  let discoverLevel = 0;
                  td.width = "10pt";
                  td.classList.add('discovered');
                  let discovered = store.hasDiscoveredTrack(track, this.playlist);
                    
                  if (!discovered) {
                      store.discoverTrack(track, this.playlist);
                      val = ''; // '<i class="fa fa-circle new"></i>';
                  } else {
                      val = "";
                  }
                  td.innerHTML = val;
              } else if ((field === 'time' || field == 'added_at') && !!val) {
                  let date = moment(val);
                  let now = moment();
                let dr = Math.abs(date.diff(now, 'days'));
                let fresh = Math.abs(date.diff(now, 'days'));
                let tooOld = dr > 1;
                  let strTime = dr ? date.format('YYYY-MM-DD') : date.fromNow();
                  td.innerHTML = '<span>' + strTime + '</span>';
                  if (tooOld) {
                      td.querySelector('span').style.opacity = 0.5;
                  }
                  let discoveredField = tr.querySelector('td.discovered');
                  if (discoveredField != null && fresh < 1) {
                      discoveredField.innerHTML = '<i class="fa fa-circle new"></i>';
                  }
                  
              } else if (typeof(val) === 'string') {
                td.innerHTML = '<span>' + val + '</span>';
              } else if (val instanceof Array) {
                 td.innerHTML = val.filter(o => {
                    if (!this.hasAttribute('data-context-artist-uri'))
                        return true;
                    return o.uri != this.getAttribute('data-context-artist-uri').replace(
                        'bungalow', 'spotify'    
                    );
                     
                 }).map((v, i) => {
                    
                     return '<sp-link uri="' + v.uri + '">' + v.name + '</sp-link>'
                }).join(', '); 
              } else if (val instanceof Object) {
                  if (val) {
                  td.innerHTML = '<sp-link uri="' + val.uri + '">' + val.name + '</sp-link>'; 
                  } else {
                      td.innerHTML = '&nbsp;';
                  }
              } else {
                td.innerHTML = '';
              }
              if (field === 'name') {
                td.width = '500pt';
            }
        
            tr.appendChild(td);
            });
            return tr;
        }
        
            
        async setState(obj) {
            if (!obj) return;
            this.obj = obj;
            if (!this.table) {
                this.table = document.createElement('table');
                this.table.setAttribute('width', '100%');
                this.appendChild(this.table);
            }
            this.table.innerHTML = '<thead><tr></tr></thead><tbody></tbody>';
            this.thead = this.table.querySelector('thead');
            this.tbody = this.table.querySelector('tbody');
            this.theadtr = this.table.querySelector('thead tr');
            if (!this.getAttribute('headers')) {
                this.thead.style.display = 'none';
            }
            
            this.fields = this.getAttribute('fields').split(',');
            this.fields.map((f, i) => {
                let field = document.createElement('th');
                field.innerHTML = _(f);
                this.querySelector('thead tr').appendChild(field);
                if (f === 'name') {
                    field.width = '500pt';
                }
            });
            if (obj && 'objects' in obj)
            obj.objects.map(this.createTrack.bind(this)).map((tr) => {
                this.tbody.appendChild(tr);
            });
            try {
                if (this.getAttribute('uri').indexOf('spotify:album') == 0) return;
                this.tfoot = document.createElement('tfoot');
                this.tfoot.innerHTML = '<sp-gondole></sp-gondole>';
                this.appendChild(this.tfoot);
                let gondole = this.querySelector('sp-gondole');
                let viewBounds = this.parentNode.getBoundingClientRect();
                if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height) {
                    this.fetchNext();
                }
            } catch (e) {
                
            }
        }
    }*/


    class SPAudioBookViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            this.classList.add('sp-view');
        }
        acceptsUri(uri) {
            return /^bungalow:book:(.*):audio$/.test(uri);
        }
        navigate() {
            
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {
                this.obj = await store.request('GET', newVal);
                this.innerHTML = '';
                this.albumView = document.createElement('sp-playlist');
                this.albumView.fields = 'name,duration,artists'
                this.appendChild(this.albumView);
                this.albumView.showCopyrights = true;
                this.albumView.view = this;
                let id = newVal.split(':')[2];
                this.albumView.setAttribute('uri', 'bungalow:album:' + id);
            }
        }   
    }

    document.registerElement('sp-audiobookview', SPAudioBookViewElement);


    class SPTrackContextElement extends SPTableElement {
        attachedCallback() {
            super.attachedCallback();
            if (!this.created2) {
                this.attributeChangedCallback('uri', null, this.getAttribute('uri'));
                this.attributeChangedCallback('fields', null, this.getAttribute('fields'));
                this.created2 = true;
            }


        }
        get maxRows() {
            return this.getAttribute('data-max-rows') || 0;
        }
        attributeChangedCallback(attrName, oldVal, newVal) {
            if (attrName == 'fields') {
                if (!!newVal)
                this.fields = newVal.split(',');
            }
            if (attrName == 'uri') {
                this.designer = new SPTrackTableDesigner();
                
                this.dataSource = new SPTrackTableDataSource(newVal, '', this.fields, this.maxRows);
                this.fetchNext();
            }
        }
        render() {
            super.render();
            if (!this.getAttribute('headers')) {
                let thead = this.querySelector('thead');
                this.table.thead.style.display = 'none';
                
            }
        }
    }
    document.registerElement('sp-trackcontext', SPTrackContextElement);
    /*
    class SPAlbumContextElement extends SPResourceElement {
        attachedCallback() {    
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (attrName == 'uri') {
                
              let result = await store.request('GET', newVal);
                this.setState(result);
            }
        }
        setState(obj) {
            this.innerHTML = '';
            let albums = obj.objects.map((item) => {
               var a = document.createElement('sp-playlist');
               a.setState(item);
               store.state[item.uri] = item;
               return a;
            });
            albums.forEach((album) => {
                this.appendChild(album);
            })
        }
    }

    document.registerElement('sp-albumcontext', SPAlbumContextElement);
    */


    class SPGondoleElement extends HTMLElement {
        
    }
    document.registerElement('sp-gondole', SPGondoleElement);


    class SPPlaylistContextElement extends SPResourceElement {
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName == 'uri') {
                this.limit = 30;
                this.offset = 1;
                let uri = newVal;
                let result = await store.request('GET', newVal, {limit: this.limit, offset: this.offset});
                this.setState(result);
                if (result != null && result.objects.length > 0) {
                    
                    let divider = this.parentNode.querySelector('sp-divider[data-uri="' + newVal + '"]');
                    if (divider != null)
                        divider.style.display = 'block';
                }
            }
        }
        createPlaylist (playlist) {
            let elm = document.createElement('sp-playlist');
            if (this.hasAttribute('fields'))
                elm.setAttribute('fields', this.getAttribute('fields'));
            if (this.hasAttribute('data-context-artist-uri')) {
                
                elm.setAttribute('data-context-artist-uri', this.getAttribute('data-context-artist-uri'));
            }
            store.state[playlist.uri] = playlist;
            store.state[playlist.uri + ':track'] = playlist.tracks; 
            elm.setAttribute('uri', playlist.uri);
            return elm;
        }
        setState(obj) {
            if (obj && obj.objects instanceof Array) {
                let albums = obj.objects.map((item) => {
                   var a = document.createElement('sp-playlist');
                   if (this.hasAttribute('data-max-rows')) {
                        a.setAttribute('data-max-rows', this.getAttribute('data-max-rows'));
                   }
                    if (this.hasAttribute('data-context-artist-uri')) {
                       a.setAttribute('data-context-artist-uri', this.getAttribute('data-context-artist-uri'));
                    }
                    if (this.hasAttribute('fields'))
                        a.setAttribute('fields', this.getAttribute('fields'));
                    let fields = a.fields;
                    
                   a.setState(item);
                   store.state[item.uri + ':track'] = item.tracks;
                   store.state[item.uri] = item;
                   return a;
                });
                albums.forEach((album) => {
                    this.appendChild(album);
                });
            }
            this.innerHTML += '<sp-gondole></sp-gondole>';
            let gondole = this.querySelector('sp-gondole');
                let viewBounds = this.parentNode.getBoundingClientRect();
                if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height && !gondole.getAttribute('active') === 'true') {
                    this.fetchNext();
                }
        }
        async fetchNext() {
            if (this.fetching) return;
            this.fetching = true;
            let gondole = this.querySelector('sp-gondole');
            gondole.setAttribute('active', 'true');
            this.offset += this.limit;
            this.removeChild(gondole);
            console.log(this.offset);
            let uri = this.getAttribute('uri') + '?offset=' + this.offset + '&limit=' + this.limit;
            console.log(uri);
            let result = await store.request('GET', uri);
            if (result && result.objects instanceof Array && result.objects.length > 0) {
                result.objects.map(this.createPlaylist.bind(this)).map((tr) => {
                    this.appendChild(tr);
                });
                this.fetching = false;
                gondole.setAttribute('active', 'false');
                this.appendChild(gondole);
                
            } else {  
                if (this.gondole) 
                    this.removeChild(this.gondole);
            }
        }
        get view() {
            return this._view;
        }
        set view(val) {
            
            this._view = val;
            this._view.addEventListener('scroll', this._onScroll.bind(this));
        }
        _onScroll(e) {
            let view = e.target;
            let viewBounds = view.getBoundingClientRect();
            let gondole = this.querySelector('sp-gondole');
            if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height) {
                this.fetchNext();
            }
        
        }
    }

    document.registerElement('sp-playlistcontext', SPPlaylistContextElement);

    class SPDividerElement extends HTMLElement {
        attachedCallback() {
            
        }
    }
    document.registerElement('sp-divider', SPDividerElement);

    class SPSidebarElement extends HTMLElement {
        async attachedCallback() {
            
           this.menu = document.createElement('sp-sidebarmenu');
           this.appendChild(this.menu);
           this.nowplaying = document.createElement('sp-nowplaying');
           this.appendChild(this.nowplaying);
        }
    }

    document.registerElement('sp-sidebar', SPSidebarElement);


    class SPSidebarMenuElement extends HTMLElement {
        async attachedCallback() {
            if (!this.menu) {
                this.searchForm = document.createElement('sp-searchform');
                this.appendChild(this.searchForm);
                
                
                this.label = document.createElement('label');
                this.label.innerHTML = _('Main Menu');
                this.appendChild(this.label);
                this.menu = document.createElement('sp-menu');
                this.appendChild(this.menu);
                this.menu.setState({
                    objects: [
                        {
                            name: _('Start'),
                            uri: 'bungalow:internal:start'
                        },
                        {
                            name: _('Settings'),
                            uri: 'bungalow:internal:settings'
                        },
                        {
                            name: _('Library'),
                            uri: 'bungalow:internal:library'
                        }
                    ]
                });
                this.appendChild(document.createElement('br'));
                this.label2 = document.createElement('label');
                this.label2.innerHTML = _('Playlists');
                this.appendChild(this.label2);
                this.searchesMenu = document.createElement('sp-menu');
                
                this.playlistsMenu = document.createElement('sp-menu');
                this.appendChild(this.playlistsMenu);
                let playlists = await store.request('GET', 'spotify:me:playlist');
                this.playlistsMenu.setState(playlists);
            }
        }
        
    }

    document.registerElement('sp-sidebarmenu', SPSidebarMenuElement);


    class SPNowPlayingElement extends HTMLElement {
        attachedCallback() {
            this.addEventListener('click', this.onClick);
        }
        onClick(e) {
            if (store.state.player) {
                if (store.state.player.context instanceof Object) {
                    GlobalViewStack.navigate(store.state.player.context.uri);
                }
                if (store.state.player.item.album instanceof Object) {
                    GlobalViewStack.navigate(store.state.player.item.album.uri);
                }
            }
        }
        disconnectedCallback() {
            this.removeEventListener('click', this.onClick);
            
        }
    }

    document.registerElement('sp-nowplaying', SPNowPlayingElement);

    class SPTabElement extends HTMLElement {
        attachedCallback() {
            this.addEventListener('mousedown', this.onClick);
        }
        
        onClick(event) {
            let tabId = event.target.getAttribute('data-tab-id');
            let evt = new CustomEvent('tabselected');
            evt.data = tabId;
            this.dispatchEvent(evt);
        }
        
        disconnectedCallback() {
            this.removeEventListener('click', this.onClick);
        }
    }


    document.registerElement('sp-tab', SPTabElement);


    class SPSettingsViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            if (!this.created) {
                this.create();
                this.created = true;
            }
        }
        create() {
            this.classList.add('sp-view');
            this.innerHTML = '<form>' +
                            '<h1>' + _('Settings') + '</h1>' +
                            '<fieldset><legend>' + _('Appearance') + '</legend><sp-themeeditor></sp-themeeditor></fieldset>' +
                            '</form>';
        }
        activate() {
           super.activate();
        }
    }

    document.registerElement('sp-settingsview', SPSettingsViewElement);


    class RadioflowTableDataSource extends SPTableDataSource {
        constructor() {

        }
        getNumberOfRows(row) {
            if (!row) {
                return
            }
        }
    }


    class SPPodcastViewElement extends SPViewElement {
        attachedCallback() {
            if (!this.created) {
                this.created = true;

            }
        }
    }

    class SPTabBarElement extends HTMLElement {
        attachedCallback() {
            if (!this.created) {
                this.titleBar = document.createElement('div');
                this.titleBar.style.visibility = 'hidden';
                this.appendChild(this.titleBar);
                this.created = true;
                this.addEventListener('scroll', this._onScroll.bind(this));
                this.style.display = 'none';
            }
        }
        
        _onScroll(e) {
            let view = this.parentNode;
            let viewBounds = view.getBoundingClientRect();
            let bounds = this.getBoundingClientRect();
            let tabBar = GlobalTabBar.getBoundingClientRect();
            let headerHeight = 0;
            if (this.header) {  
                headerHeight = this.header.getBoundingClientRect().height;;
            } 
            console.log(bounds.top, viewBounds.top);
            if (view.scrollTop > headerHeight ) {
                view.style.display = 'block';
                let transform = 'translateY(' + ( view.scrollTop - headerHeight) + 'px)';
                this.thead.style.transform = transform; 
            } else {
                this.thead.style.transform = 'translateY(0px)';
            }
            let gondole = this.querySelector('sp-gondole');
            if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height) {
                if (!gondole.hasAttribute('activated'))
                this.fetchNext();
            }
        
        }
        
        get titleVisible() {
            return this.titleBar.style.visibility == 'visible';
        }
        set titleVisible(val) {
            this.titleBar.style.visibility = val ? 'visible': 'hidden';
     
        }
        get title() {
            return this.titleBar.innerHTML;
        }
        set title(val) {
            this.titleBar.innerHTML = value;
        }
        setState(state) {
            this.innerHTML = '';
            this.titleBar = document.createElement('div');
            this.titleBar.style.visibility = 'hidden';
            this.titleBar.style.paddingRight = '113pt';
            this.titleBar.style.paddingTop = '-12px';
            //this.appendChild(this.titleBar);
            if (state.object instanceof Object) {
                if (state.object.images && state.object.images.length > 0) {
                    let image_url = state.object.images[0].url;
                    this.titleBar.innerHTML = '<img style="display: inline-block; float: left; margin-top: -3pt; margin-right: 10pt" src="' + image_url + '" width="24pt" height="24pt" />';
                }
                if (state.object.name != null) {
                    this.titleBar.innerHTML += '<span>'+ state.object.name + '</span>';
                    if (VERIFIED_PROFILES.filter((o) => (state.object.id === o)).length > 0) {
                        this.titleBar.innerHTML += ' <i class="fa fa-check-circle new"></i>';
                    }
                    
                }
            }
            if (state && state.objects instanceof Array && state.objects.length > 0) {
                for (let i = 0; i < state.objects.length; i++) {
                    let obj = state.objects[i];
                    let tab = document.createElement('sp-tab');
                    tab.setAttribute('data-tab-id', obj.id);
                    
                    tab.innerHTML = obj.name;
                    tab.addEventListener('tabselected', (e) => {
                        window.location.hash = '#' + e.data;
                    });
                    if (obj.id == window.location.hash.substr(1)) tab.classList.add('sp-tab-active');
                    this.appendChild(tab);
                    this.style.display = 'flex';
                } 
            } else {
                this.style.display = 'none';
            }
        
            
            this.rightTitleBar = document.createElement('div');
            this.rightTitleBar.innerHTML = '&nbsp;';
            this.appendChild(this.rightTitleBar);
        }
    }
    document.registerElement('sp-tabbar', SPTabBarElement);


    class SPTabContentElement extends HTMLElement {
        attachedCallback() {
            
        }
    }
    document.registerElement('sp-tabcontent', SPTabContentElement);

    class SPMenuElement extends HTMLElement {
        async attachedCallback() {
            
            
           
        }
        setState(state) {
            this.state = state;
            this.render();
        }
        render() {
            this.innerHTML = '';
            if (this.state && this.state.objects instanceof Array)
            this.state.objects.map((item) => {
                if (!item) {
                    this.appendChild(document.createElement('br'));
                    return;
                }
                let menuItem = document.createElement('sp-menuitem');
                this.appendChild(menuItem);
                /*let updated = moment(item.updated_at);
                let now = moment();
                let range = Math.abs(now.diff(updated, 'days'));
                if (range < 1) {
                    menuItem.innerHTML = '<i class="fa fa-circle new"></i>';
                }*/
                menuItem.innerHTML += '<span>' + item.name + '</span>';
                menuItem.setAttribute('uri', item.uri);
            });
        }
        
    }

    document.registerElement('sp-menu', SPMenuElement);

    class SPLinkElement extends HTMLAnchorElement {
        onClick(e) {
            e.preventDefault();
            GlobalViewStack.navigate(this.getAttribute('uri'));
        }
        attachedCallback() {
            this.addEventListener('click', this.onClick);
        }
        disconnectedCallback() {
            this.removeEventListener('click', this.onClick);
        }
    }

    document.registerElement('sp-link', SPLinkElement);

    class SPMenuItemElement extends SPLinkElement {

        attributeChangedCallback(attr, oldVal, newVal) {
           
        }
    }

    document.registerElement('sp-menuitem', SPMenuItemElement);


    class SPSearchFormElement extends HTMLFormElement {
       
        attachedCallback() {
            if (!this.created) {
                 this.innerHTML = '<button id="btnBack" class="fa fa-arrow-left" onclick="history.back()"><button class="fa fa-arrow-right" onclick="history.forward()"></button><div style="flex: 5"></div>';
               
                this.form = document.createElement('form');
                this.form.setAttribute('action', '/');
                this.form.setAttribute('method', 'GET');
                this.appendChild(this.form);
                this.form.addEventListener('submit', (event) => {
                    let query = this.searchTextBox.value;
                    GlobalViewStack.navigate(query);
                    event.preventDefault();
                })
                this.searchTextBox = document.createElement('input');
                this.searchTextBox.setAttribute('type', 'search');
                this.searchTextBox.setAttribute('placeholder', 'search');
                this.form.appendChild(this.searchTextBox);
                this.btnSubmit = document.createElement('button');
                this.btnSubmit.setAttribute('type', 'submit');
                this.btnSubmit.style.display = 'none';
                this.form.appendChild(this.btnSubmit);
                this.created = true;
                
            }
            
        }
    }

    document.registerElement('sp-searchform', SPSearchFormElement);

    class SPStartViewElement extends SPViewElement {
        acceptsUri(uri) {
            return uri === 'bungalow:internal:start';
        }
        navigate() {
            
        }
        attachedCallback() {
            this.classList.add('container');
            this.innerHTML = '<h3>Start</h3>';
            this.innerHTML += '<sp-divider>Featured</sp-divider>';
            this.innerHTML += '<sp-carousel uri="bungalow:me:playlist"></sp-carousel>';
        }
    }
    document.registerElement('sp-startview', SPStartViewElement);


    class SPCarouselElement extends SPResourceElement {
        attachedCallback() {
            this.style.position = 'relative';
        }
        setState(object) {
            this.innerHTML = '';
            for (let i = 0; i < object.objects.length; i++) {
                let obj = object.objects[i];
                let inlay = document.createElement('div');
                inlay.style.backgroundImge = 'url("' + obj.images[0].url + '")';
                this.appendChild(inlay);
            }
            $(this).slick();
        }
    }


    document.registerElement('sp-carousel', SPCarouselElement);

    class SPAlbumViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            this.classList.add('sp-view');
        }
        acceptsUri(uri) {
            return /^bungalow:album:(.*)$/.test(uri);
        }
        navigate() {
            
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {
                this.obj = await store.request('GET', newVal);
                this.innerHTML = '';
                this.albumView = document.createElement('sp-playlist');
                this.appendChild(this.albumView);
                this.albumView.showCopyrights = true;
                this.albumView.view = this;
                this.albumView.setAttribute('uri', newVal);
            }
        }   
    }

    document.registerElement('sp-albumview', SPAlbumViewElement);

    class SPPlaylistViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            this.classList.add('sp-view');
            if (!this.header) {
                this.header = document.createElement('sp-header');
                this.header.setAttribute('size', 128);
                this.appendChild(this.header);
            }
            if (!this.trackcontext) {
                this.trackcontext = document.createElement('sp-trackcontext');
                this.appendChild(this.trackcontext);
                this.trackcontext.setAttribute('fields', 'discovered,name,artists,album,user,added_at');
                this.trackcontext.setAttribute('headers', 'true');
                this.trackcontext.header = (this.header);    
                this.trackcontext.view = (this);   
            
            }
            

            
        }
        acceptsUri(uri) {
            return /^bungalow:user:(.*):playlist:([a-zA-Z0-9]+)$/.test(uri);
        }
        activate() {
            super.activate();
            this.trackcontext.activate();
            if (this.state == null) 
                return;
            this.header.setState(this.state);
            GlobalTabBar.setState({
                object: this.state,
                objects: []
            });
        }
        navigate(uri) {
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {
                
                if (newVal in store.state) {
                    this.setData(store.state[newVal]);
                    return;
                }
                this.trackcontext.setAttribute('uri', newVal + ':track');
                let result = await store.request('GET', newVal);
                this.trackcontext.playlist = result;
              
                this.state = result;
               
                this.activate();
            }
        }   
    }

    document.registerElement('sp-playlistview', SPPlaylistViewElement);

    class SPPlayqueueViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            this.classList.add('sp-view');
            if (!this.header) {
                this.header = document.createElement('sp-header');
                this.appendChild(this.header);
            }
            if (!this.trackcontext) {
                this.trackcontext = document.createElement('sp-trackcontext');
                this.appendChild(this.trackcontext);
            }
            
        }
        acceptsUri(uri) {
            return /^bungalow:internal:playqeueue$/.test(uri);
        }
        navigate() {
            
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {
                this.trackcontext.setAttribute('uri', newVal + ':track');
                
                if (newVal in store.state) {
                    this.header.setState(store.state[newVal]);
                    return;
                }
                let result = await store.request('GET', newVal);
                this.header.setState(result);
            }
        }   
    }

    document.registerElement('sp-playqueueview', SPPlayqueueViewElement);

    class SPSearchViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
             if (!this.created) {
                this.classList.add('sp-view');
                //this.innerHTML = "<div style='padding: 13pt'><h3>Search results for '<span id='q'>'</span>";
                this.header = document.createElement('sp-header');    
           
                this.trackcontext = document.createElement('sp-trackcontext');
                this.appendChild(this.trackcontext);
                this.trackcontext.setAttribute('headers', 'true');
                this.trackcontext.header = (this.header);
                this.trackcontext.view = (this);
                this.created = true;    
            }
            
        }
        activate() {
            let uri = ''
            if (!this.hasAttribute('uri'))
                return;
            uri = this.getAttribute('uri');
            let query = this.getAttribute('uri').substr('bungalow:search:'.length);
        
            this.header.tabBar.setState({
                id: query,
                uri: this.getAttribute('uri'),
                name: query,
                type: 'search'
            })
        }
        acceptsUri(uri) {
            return /^bungalow:search:(.*)$/.test(uri);
        }
        navigate() {
            
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {
                let query = newVal.substr('bungalow:search:'.length);
                this.trackcontext.query = query;
                this.trackcontext.setAttribute('uri', 'bungalow:search');
                this.header.setState({
                    name: query,
                    id: query,
                    description: "Search results for '" + query + "'",
                    uri: 'bungalow:search: ' + query,
                    type: 'search',
                    images: [{
                        url: ''
                    }]
                });
            }
        }   
    }

    document.registerElement('sp-searchview', SPSearchViewElement);
    const onHashChanged =  (e) => {
       let tabId = 'overview';
       try {
           tabId = window.location.hash.substr(1);
           if (!tabId || tabId.length < 1) {
               tabId = 'overview'
           };;
       } catch (e) {
           
       }
       let view = GlobalViewStack.currentView;
       let foundTab = false;
       for (let tab of document.querySelectorAll('sp-tab')) {
           if (tab.getAttribute('data-tab-id') == tabId) {
               tab.classList.add('sp-tab-active');
               foundTab = true;
           } else {
               tab.classList.remove('sp-tab-active');
               
           }
       }
       if (!foundTab) {
           let tabs = document.querySelectorAll('sp-tab');
           if (tabs.length > 0)
            tabs[0].classList.add('sp-tab-active');
       }
       for (let tabView of view.querySelectorAll('sp-tabcontent')) {
           if (tabView.getAttribute('data-tab-id') == tabId) {
               tabView.style.display = 'block';
           } else {
               tabView.style.display = 'none';
           }
       }
    };
    window.addEventListener('hashchange', onHashChanged);
        




    class SPLabelViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            if (!this.created) {
                this.classList.add('sp-view');
                this.header = document.createElement('sp-header');
                this.appendChild(this.header);
                this.releasecontext = document.createElement('sp-playlistcontext');
                this.attributeChangedCallback('uri', null, this.getAttribute('uri'));
                this.divider = document.createElement('sp-divider');
                this.divider.innerHTML = _('Releases');
                this.appendChild(this.divider);
                this.appendChild(this.releasecontext);
                
                this.created = true;
            }
            
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (attrName == 'uri') {
                if (newVal == null) return;
                this.releasecontext.setAttribute('uri', newVal + ':release');
                this.obj = await store.request('GET', newVal);
                this.setState(this.obj);
            }
        }
        setState(obj) {
            this.header.setState(obj);
        }
    }

    document.registerElement('sp-labelview', SPLabelViewElement);

    document.querySelector('.body').appendChild(document.createElement('sp-chrome'));

});