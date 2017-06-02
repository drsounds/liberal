
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
        await this._request('PUT', 'spotify:me:player:play', {
            context_uri: context.uri,
            position: {
                uri: track.uri
            }
        });
    }
    async playTrackAtPosition(position, context) {
        await this._request('PUT', 'spotify:me:player:play', {
            context_uri: context.uri,
            position: {
                offset: position
            }
        });
    }
    async lookupTrack(name, version, artist, album) {
         q
    }
    async getCurrentTrack() {
        let result = await this._request('GET', 'spotify:me:player:currently-playing', null, false);
        
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
                
                url = '/api/music/' + url;
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
        this.heart = setInterval(async () => {
            this.state.player = await this.getCurrentTrack();
            this.emit('change');
            
        }, 1000);
        this.hue = this.hue;
        this.saturation = this.saturation;
        this.flavor = this.flavor;
        this.stylesheet = this.stylesheet;
        this.discoveredTracks = JSON.parse(localStorage.getItem('discoveredTracks'));
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
        
        let result = await this.request('PUT', 'spotify:me:player:play', context, false);
        this.state.player = await this.getCurrentTrack();
        this.emit('change');
   
    }
    async playTrack(track, context) {
        await this.request('PUT', 'spotify:me:player:play', {
            context_uri: context.uri,
            position: {
                uri: track.uri
            }
        });
    }
    async playTrackAtPosition(position, context) {
        await this.request('PUT', 'spotify:me:player:play', {
            context_uri: context.uri,
            position: {
                offset: position
            }
        });
    }
    async getCurrentTrack() {
        let result = await this.request('GET', 'spotify:me:player:currently-playing', null, false);
        
        return result;
    }
    async request(method, uri, payload, cache=true) {
        try {
            if (uri == null) return;
            var url = uri;
            if (uri.indexOf('bungalow:') == 0 || uri.indexOf('spotify:') == 0) {
                if (uri.indexOf('spotify:') == 0) {
                    uri = 'bungalow:' + uri.substr('spotify:'.length);
                }
                url = uri.substr('bungalow:'.length).split(':').join('/');
                
                url = '/api/music/' + url;
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
        let result = await fetch('/api/music/album/' + id, {credentials: 'include', mode: 'cors'}).then((e) => e.json())
        this.setState(uri, result);
        return result;
    }
    async getArtistById(id) {
        let uri = 'spotify:artist:' + id;
        let result = await fetch('/api/music/artist/' + id, {credentials: 'include', mode: 'cors'}).then((e) => e.json());
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
            this.colorChooser.addEventListener('change', this.colorSlider);
            this.colorChooser.addEventListener('mousemove', this.colorSlider);
            this.saturationChooser = document.createElement('input');
            this.saturationChooser.setAttribute('type', 'range');
            this.innerHTML += '<label>' + _('Saturation') + '</label>';
            this.appendChild(this.saturationChooser);
            this.saturationChooser.setAttribute('max', 360);
            this.saturationChooser.addEventListener('change', this.saturationSlider);
            this.saturationChooser.addEventListener('mousemove', this.saturationSlider);
            this.saturationChooser.value = store.saturation;
            this.styleselect = document.createElement('select');
            this.styleselect.innerHTML += '<option value="bungalow">Bungalow</option><option value="maestro">Maestro</option><option value="obama">Obama</option><option value="chromify">Chromify</option>';
            this.appendChild(this.styleselect);
            this.flavorselect = document.createElement('select');
            this.flavorselect.innerHTML += '<option value="dark">' + _('Dark') + '</option><option value="light">' + _('Light') + '</option>';
            this.appendChild(this.flavorselect);
            this.flavorselect.addEventListener('change', (e) => {
                store.flavor = e.target.options[e.target.selectedIndex].value;
            });
             this.styleselect.addEventListener('change', (e) => {
                store.stylesheet = e.target.options[e.target.selectedIndex].value;
            });
            this.created = true;
            
        }
    }
    colorSlider(e) {
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
            this.innerHTML = '<button id="btnBack" class="fa fa-arrow-left" onclick="history.back()"><button class="fa fa-arrow-right" onclick="history.forward()"></button><div style="flex: 5"></div>';
            if (!this.searchForm) {
                this.searchForm = document.createElement('sp-searchform');
                this.appendChild(this.searchForm);
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
    
    alert(e);
})

class SPAppFooterElement extends HTMLElement {
    attachedCallback() {
        if (!this.created) {
            this.previousButton = document.createElement('button');
            this.previousButton.classList.add('fa');
            this.previousButton.classList.add('fa-step-backward');
            this.appendChild(this.previousButton);
            this.previousButton.addEventListener('click', (e) => {
                store.skipBack();
            })
            this.playButton = document.createElement('button');
            this.playButton.classList.add('fa');
            this.playButton.setAttribute('id', 'playButton');
            this.playButton.classList.add('fa-play');
            this.appendChild(this.playButton);
            this.playButton.addEventListener('click', (e) => {
                store.playPause();
            })
            this.nextButton = document.createElement('button');
            this.nextButton.classList.add('fa');
            this.nextButton.classList.add('fa-step-forward');
            this.appendChild(this.nextButton);
            this.nextButton.addEventListener('click', (e) => {
                store.skipNext();
            });
            this.playthumb = document.createElement('input');
            this.playthumb.setAttribute('type', 'range');
            this.playthumb.setAttribute('id', 'playthumb');
            this.playthumb.style.flex = '5';
            this.appendChild(this.playthumb);
            let btn = document.createElement('button');
            btn.classList.add('fa');
            btn.classList.add('fa-paint-brush');
            this.appendChild(btn);
            btn.style.cssFloat = 'right';
            btn.addEventListener('click', (e) => {
               let hue = store.hue;
               if (hue > 360) {
                   hue = 0;
               }
               hue += 2;
               store.hue = hue;
            });
            this.created = true;
            store.on('change', (e) => {
                let trackItems = document.querySelectorAll('.sp-track');
                let playButton = document.querySelector('#playButton');
                if (store.state.player && store.state.player.item) {
                    let playThumb = document.querySelector('#playthumb');
                    if (playThumb) {
                        playThumb.setAttribute('min', 0);
                        playThumb.setAttribute('max', store.state.player.item.duration_ms);
                        playThumb.value = (store.state.player.progress_ms);
                
                    }
                
                    playButton.classList.remove('fa-play');
                    playButton.classList.add('fa-pause');
                    let imageUrl = store.state.player.item.album.images[0].url;
                    let img = document.createElement('img');
                    img.crossOrigin = '';
                    img.src = imageUrl;
                    img.onload = function () {
                    
                        var vibrant = new Vibrant(img);
                        let color = vibrant.swatches()['Vibrant'];
                 //       document.documentElement.style.setProperty('--now-playing-accent-color', 'rgba(' + color.rgb[0] + ',' + color.rgb[1] + ',' + color.rgb[2] + ', 1)');
                    }
                    document.querySelector('sp-nowplaying').style.backgroundImage = 'url("' + store.state.player.item.album.images[0].url + '")';
                  
                    document.querySelector('sp-nowplaying').setAttribute('uri', store.state.context_uri);
                    for(var tr of trackItems) {
                        if (tr.getAttribute('data-uri') === store.state.player.item.uri) {
                            tr.classList.add('sp-current-track');
                            
                        } else {
                            tr.classList.remove('sp-current-track');
                        }
                    }
                } else {
                    
                    playButton.classList.remove('fa-pause');
                    playButton.classList.add('fa-play');
                } 
            });
        }
    }
}


window.alert = function (message) {
    document.querySelector('sp-chrome').alert({
        type: 'info',
        name: message,
        uri: 'bungalow:error:0x00'
    });
    let x = 0;
    var i = setInterval(() => {
        x++;
        $('sp-infobar').animate({
            opacity: 0.1
        }, 50, () => {
             $('sp-infobar').animate({
                 opacity: 1
             }, 50);
        });
        clearInterval(i);
        
    }, 100);
}


document.registerElement('sp-appfooter', SPAppFooterElement);

class SPChromeElement extends HTMLElement { 
    attachedCallback() {
        this.appHeader = document.createElement('sp-appheader');
        this.appendChild(this.appHeader);
        this.infoBar = document.createElement('sp-infobar');
        this.appendChild(this.infoBar);
        this.main = document.createElement('main');
        this.appendChild(this.main);
        this.sidebar = document.createElement('sp-sidebar');
        this.main.appendChild(this.sidebar); 
        this.mainView = document.createElement('sp-main');
        this.main.appendChild(this.mainView);
        this.appFooter = document.createElement('sp-appfooter');
        this.appendChild(this.appFooter);
          
        this.rightSideBar = document.createElement('sp-rightsidebar');
        this.main.appendChild(this.rightSideBar);
        this.playlist = document.createElement('sp-trackcontext');
        this.rightSideBar.appendChild(this.playlist);
        this.playlist.uri = 'spotify:me:tracks';
        
    }
    alert(obj) {
        this.infoBar.show();
        this.infoBar.setState(obj);
    }
}



GlobalViewStack = null;

document.registerElement('sp-chrome', SPChromeElement);

class SPResourceElement extends HTMLElement {
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'uri') {
            let data = await store.request('GET', newVal);
            this.setState(data);
        }
    }
    setState(obj) {
        this.innerHTML = '<sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link>';
    }
}

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


/**
 * Viewstack element
 **/
class SPViewStackElement extends HTMLElement {
    constructor() {
        super();
    }
    
    attachedCallback() {
        this.views = {};
        let path = window.location.pathname.substr(1);
        let uri = 'bungalow:' + path.split('/').join(':');
        this.navigate(uri, true);
    
        window.addEventListener('popstate', (event) => {
            let path = window.location.pathname.substr(1);
            let uri = 'bungalow:' + path.split('/').join(':');
            this.navigate(uri, true);
        });
        
    }
    /**
     * Navigates the view stack
     * @param {String} uri The URI to navigate to
     * @returns void
     **/
    navigate(uri, dontPush=false) {
        if (this.uri === uri) return;
        let evt = new CustomEvent('beforenavigate');
        this.dispatchEvent(evt);
        
        
        let menuItems = document.querySelectorAll('sp-menuitem');
        for (let item of menuItems) {
            item.classList.remove('active');
            
            //if (uri.indexOf(item.getAttribute('uri')) == 0) {
            if (uri == item.getAttribute('uri')) {
                item.classList.add('active');
            }
            
        }
        
        
        if (uri.indexOf('spotify:') === 0) {
            uri = 'bungalow:' + uri.substr('spotify:'.length);
        }
        let newUri = uri;
        if (uri === 'bungalow:internal:login') {
            store.login().then(() => {});
            return;
        }
        
        if (newUri === 'bungalow:') {
            newUri == 'bungalow:internal:start';
        }
            
        if (newUri.indexOf('bungalow:') != 0) {
            newUri = 'bungalow:search:' + uri;
            uri = newUri;
        }
        if (GlobalViewStack.currentView != null && newUri === GlobalViewStack.currentView.getAttribute('uri'))
            return;
        if (newUri in this.views) {
            let view = this.views[newUri];
            
            this.setView(view);
        } else {
            let view = null;
            
            if (newUri === 'bungalow:internal:settings' || newUri === 'bungalow:config') {
                view = document.createElement('sp-settingsview');  
            } else if (/^bungalow:internal:start$/g.test(newUri)) {
                view = document.createElement('sp-startview');
            } else if (/^bungalow:genre:(.*)$/g.test(newUri)) {
                view = document.createElement('sp-genreview');
                
            } else if (/^bungalow:artist:([a-zA-Z0-9._]+):top:([0-9]+)$/g.test(newUri)) {
                view = document.createElement('sp-playlistview');
              
        
            } else if (/^bungalow:country:([a-zA-Z0-9._]+):top:([0-9]+)$/g.test(newUri)) {
                view = document.createElement('sp-playlistview');
              
        
            } else if (/^bungalow:internal:library/g.test(newUri)) {
                view = document.createElement('sp-playlistview');
              
        
            } else if (/^bungalow:country:([a-zA-Z0-9._]+)/g.test(newUri)) {
                view = document.createElement('sp-countryview');
              
        
            } else if (/^bungalow:country:([a-zA-Z0-9._]+):top:([0-9]+)$/g.test(newUri)) {
                view = document.createElement('sp-playlistview');
              
        
            } else if (/^bungalow:search:(.*)$/g.test(newUri)) {
                view = document.createElement('sp-searchview');
               
            } else if (/^bungalow:artist:(.*)$/g.test(newUri)) {
                view = document.createElement('sp-artistview');
                
        
            } else if (/^bungalow:album:(.*)$/g.test(newUri)) {
                view = document.createElement('sp-albumview');
              
        
            } else if (/^bungalow:user:([a-zA-Z0-9._]+):playlist:([a-zA-Z0-9]+)$/g.test(newUri) || newUri === 'bungalow:me') {
                view = document.createElement('sp-playlistview');
              
        
            } else if (/^bungalow:user:([a-zA-Z0-9._]+)$/g.test(newUri)) {
                view = document.createElement('sp-userview');
                
        
            }

            this.addView(newUri, view);
            view.setAttribute('uri', newUri);
            
        }
        let url = uri.substr('bungalow:'.length).split(':').join('/');
        
        this.uri = uri;
        
        if (!dontPush) {
            history.pushState(uri, uri, '/' + url);
            
        }
            
        
    }
    addView(uri, view) {
        
        this.views[uri] = view;
        this.setView(view);
    }
    setView(view) {
        if (this.firstChild != null)
        this.removeChild(this.firstChild);
        this.appendChild(view);
        GlobalViewStack.currentView = view;

        if (view.activate instanceof Function) {
            view.activate();
        }
    }
}

document.registerElement('sp-viewstack', SPViewStackElement);

const TOTAL_ARTISTS_ON_SPOTIFY = 2000000;

class SPImageElement extends HTMLElement {

    attachedCallback() {
        this.attributeChangedCallback('src', null, this.getAttribute('src'));
        this.addEventListener('click', (e) => {
           
        });
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'src') {
            this.setState(newVal);
        }
    }
    setState(state) {
        if (state instanceof Object) {
            this.setState(state.uri);
            return;
        }
        this.style.backgroundImage = 'url(' + state + ')';
        this.style.width = this.getAttribute('width')  + 'px';
        this.style.height = this.getAttribute('height') + 'px';
    }
}
document.registerElement('sp-image', SPImageElement);

const VERIFIED_PROFILES = ['drsounds', 'alexanderforselius', 'daniel', 'spotify'];

class SPTitleElement extends HTMLElement {
    attachedCallback() {
        
    }
    setState(object) {
        let title = _(object.name);
        if (VERIFIED_PROFILES.filter((o) => (object.id === o)).length > 0) {
            title += ' <i class="fa fa-check-circle new"></i>';
        }
        let titleHTML = '<sp-link uri="' + object.uri + '">' + _(title) + '</sp-link>';
        
        if (object.owner) {
            titleHTML += ' <span style="opacity: 0.7"> ' + _('by') + ' <sp-link uri="' + object.owner.uri + '">' + _(object.owner.name) + '</sp-link></span>'; 
        }
        if (object.for) {
            titleHTML += ' <span style="opacity: 0.7"> ' + _('for') + ' <sp-link uri="' + object.for.uri + '">' + _(object.for.name) + '</sp-link></span>'; 
        }
        if (object.in) {
            titleHTML += ' <span style="opacity: 0.7"> ' + _('in') + ' <sp-link uri="' + object.in.uri + '">' + _(object.in.name) + '</sp-link></span>'; 
        }
        this.innerHTML = titleHTML;
    }
}

document.registerElement('sp-title', SPTitleElement);



class SPHeaderElement extends SPResourceElement {
    attachedCallback() {
        this.classList.add('header');
        GlobalTabBar.titleVisible  = false;
        this.parentNode.addEventListener('scroll', (e) => {
            let headerBounds = this.getBoundingClientRect();
            let viewBounds = this.parentNode.getBoundingClientRect();
            GlobalTabBar.titleVisible = (headerBounds.top < viewBounds.top - (headerBounds.height * 0.5));
            console.log(headerBounds.top, viewBounds.top)
        });
    }
    setState(object) {
        let size = this.getAttribute('size') || 128;
        let width = size;
        let height = size;  
        let titleElement = document.createElement('sp-title');
        titleElement.setState(object);
        object.image_url = object.images && object.images[0].url ? object.images[0].url : '';
        let strFollowers = '';
        if ('followers' in object) {
            strFollowers = numeral(object.followers.total).format('0,0') + ' followers';
        }
        this.innerHTML = '' + 
            '<div style="flex: 0 0 ' + width + ';">' +
            '<sp-image width="' + width + '" height="' + height + '" src="' + object.image_url + '"></sp-image></div><div style="flex: 1"><small>' + _(object.type) + '</small><h3>' + titleElement.innerHTML + ' <span style="float: right">' + strFollowers + '</span></h3><sp-toolbar></sp-toolbar><p style="opacity: 0.5">' + (object.description ? object.description : '') + '</p></div>';
       /* if ('followers' in object) {
            let pop = '';
             if (object.popularity) {
                 pop = '<hr><h3>#' + numeral( TOTAL_ARTISTS_ON_SPOTIFY - (TOTAL_ARTISTS_ON_SPOTIFY * ((object.popularity) / 100))).format('0,0') + '</h3><br>' + _('In he world');
            }
            this.innerHTML += '<div style="flex: 0 0 50pt;"> <h3>' + numeral(object.followers.total).format('0,0') + '</h3><br> ' + _('followers') + '<br> ' + pop + ' </div>';
           
        } */
        this.object = object;
        this.vibrant();
    }
    vibrant() {
        if (localStorage.getItem('stylesheet') != 'maestro') return;
        let object = this.object;
        if (!this.object) return;
        
        if (object.images instanceof Array && object.images.length > 0) {
            let imageUrl = object.images[0].url;
            let img = document.createElement('img');
            img.crossOrigin = '';
            img.src = imageUrl;
            img.onload = () => {
            
                var vibrant = new Vibrant(img);
                let color = vibrant.swatches()['Vibrant'];
                let bg = 'rgba(' + color.rgb[0] + ',' + color.rgb[1] + ',' + color.rgb[2] + ', 0.05)';
                this.parentNode.style.backgroundColor = bg;
                GlobalTabBar.style.backgroundColor = bg;
                
            
            }
        }
    }
}


class SPToolbarElement extends HTMLElement {
    attachedCallback () {
        this.innerHTML = '<button class="primary"><i class="fa fa-play"></i> ' + _('Play') + '</button>&nbsp;';
        this.innerHTML += '<button>...</button>';
    }
}
document.registerElement('sp-toolbar', SPToolbarElement);

document.registerElement('sp-header', SPHeaderElement);


class SPViewElement extends HTMLElement {
    constructor() {
        super();
        this.scrollX = 0;
        this.scrollY = 0;
    }
    acceptsUri(uri) {
        return false;
    }
    activate() {
        this.scrollTop = (this.scrollY);
        if (this.header) {
            this.header.vibrant();
        }
    }
    
    _onScroll(e) {
        let view = e.target;
        view.scrollY = view.scrollTop;
    }
    navigate(uri) {
        
        
    }
    attachedCallback() {
        
        GlobalTabBar.setState({objects: []});
        this.addEventListener('scroll', this._onScroll);
    }
    disconnectedCallback() {
        this.removeEventListener('scroll', this._onScrll);
    }
    attributeChangedCallback(attr, oldValue, newVal) {
        
    }
}

document.registerElement('sp-view', SPViewElement);


class SPArtistViewElement extends SPViewElement {
    async attachedCallback() {
        super.attachedCallback();
        if (!this.loaded) {
            this.state = {
                artist: null,
                albums: []
            }
            this.header = document.createElement('sp-header');
            this.appendChild(this.header);
            
            this.classList.add('sp-view');
         
            this.topTracksDivider = document.createElement('sp-divider');
            this.topTracksDivider.innerHTML = _('Top Tracks');
            this.appendChild(this.topTracksDivider);
        
            this.topTracks = document.createElement('sp-playlist');
            this.appendChild(this.topTracks);
           
            this.albumsDivider = document.createElement('sp-divider');
            this.albumsDivider.innerHTML = _('Albums');
            this.appendChild(this.albumsDivider);
        
      
            this.albumList = document.createElement('sp-playlistcontext');
            this.appendChild(this.albumList);
            this.albumList.view = this;
            this.loaded = true;
        }
    }
    acceptsUri(uri) {
        return new RegExp(/^bungalow:artist:(.*)$/g).test(uri);
    }
    navigate(uri) {
            
    }
    activate() {
        super.activate();
        GlobalTabBar.setState({
            object: this.state,
            objects: []
        });
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            
            let result = await store.request('GET', newVal);
            this.state = result;
            
            this.setState(this.state);    
            this.albumList.setAttribute('uri', newVal + ':release');
            this.topTracks.setAttribute('uri', newVal + ':top:5');
            this.setState(this.state);
            this.activate();
        }
    }
    setState(state) {
        this.header.setState(state);
    }
}
document.registerElement('sp-artistview', SPArtistViewElement);

class SPUserViewElement extends SPViewElement {
    async attachedCallback() {
        super.attachedCallback();
        this.state = {
            artist: null,
            albums: []
        }
        this.header = document.createElement('sp-header');
        this.appendChild(this.header);
        this.classList.add('sp-view');
        this.state = {
            
        };
        if (!this.albumsDivider) {
        this.albumsDivider = document.createElement('sp-divider');
        this.albumsDivider.innerHTML = _('Public playlists');
        this.appendChild(this.albumsDivider);
        }
        if (!this.albumList) {
            this.albumList = document.createElement('sp-playlistcontext');
            this.appendChild(this.albumList);
        }
    }
    acceptsUri(uri) {
        return new RegExp(/^bungalow:artist:(.*)$/g).test(uri);
    }
    navigate(uri) {
            
    }
    activate() {
        super.activate();
        GlobalTabBar.setState({
            object: this.state,
            objects: [{
                id: 'overview',
                name: 'Overview'
            }]
        });
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            
          this.state = await store.request('GET', newVal);
            
          this.albumList.setAttribute('uri', newVal + ':playlist');
          this.setState(this.state); 
          this.activate();   
        }
    }
    setState(state) {
        this.header.setState(state);
    }
}

document.registerElement('sp-userview', SPUserViewElement);


class SPGenreViewElement extends SPViewElement {
    async attachedCallback() {
        super.attachedCallback();
        if (!this.loaded) {
          
            this.header = document.createElement('sp-header');
            this.appendChild(this.header);
            this.classList.add('sp-view');
            this.state = {
                
            };
            if (!this.albumsDivider) {
            this.albumsDivider = document.createElement('sp-divider');
            this.albumsDivider.innerHTML = 'Public playlists';
            this.appendChild(this.albumsDivider);
            }
            if (!this.albumList) {
                this.albumList = document.createElement('sp-playlistcontext');
                this.appendChild(this.albumList);
            }
        }
    }
    acceptsUri(uri) {
        return new RegExp(/^bungalow:genre:(.*)$/g).test(uri);
    }
    navigate(uri) {
            
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            
          let result = await store.request('GET', newVal);
            
          this.setState(result);    
          this.albumList.setAttribute('uri', newVal + ':playlist');
        }
    }
    setState(state) {
        this.header.setState(state);
    }
}

document.registerElement('sp-genreview', SPGenreViewElement);

document.registerElement('sp-resource', SPResourceElement);
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
        let titleElement = document.createElement('sp-title');
        titleElement.setState(obj);
        let copyrights = null;
        if (this.showCopyrights) {
            copyrights = obj.copyrights.map((c) => {
                return '<span style="opacity: 0.5">' + '(' + c.type + ') ' +  c.text + '</span>';
            }).join('<br>');
        }
        this.innerHTML = '' +
        '<div style="flex: 0 0 128">' +
            '<sp-image src="' + obj.images[0].url + '" width="128" height="128"></sp-image>' + 
        '</div>' +
        '<div style="flex: 2">' +
            '<h3>' +  titleElement.innerHTML + ' '+  strReleaseDate + ' </h3>' +
            
            (obj.description ? '<p>' + obj.description + '</p>' : '') +
            '<sp-trackcontext fields="name,artists,album,user,added_at" uri="' + obj.uri + ':track' + '"></sp-trackcontext>' +
            (copyrights ? copyrights : '') +
        
        '</div>';
        this.object = obj;
        if (this.view != null) {
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
            let bgColor = 'rgba(' + color.rgb[0] + ',' + color.rgb[1] + ',' + color.rgb[2] + ', 0.03)';
            this.view.style.backgroundColor = bgColor;
        }
    }
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


class SPTrackContextElement extends SPResourceElement {
    attachedCallback() {
        console.log("T");
        if (!this.created) {
            if (!this.hasAttribute('fields'))
            this.setAttribute('fields', 'name,artists,album,user');
    
            this.table = document.createElement('table');
            this.appendChild(this.table);
            this.table.style.width = '100%';
            this.attributeChangedCallback('uri', null, this.getAttribute('uri'));
            this.style.display = 'block';
            this.thead = this.querySelector('thead');
            this.created = true;
            
        }
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
        let result = await store.request('GET', this.uri + '?q=' + encodeURIComponent(this.query) + '&type=track&limit=' + this.limit + '&offset=' + this.offset);
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
        
        if (attrName == 'uri') {
          let result = await store.request('GET', newVal + '?q=' + this.query);
                this.setState(result);
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
        }*/
        tr.classList.add('sp-track');
        tr.setAttribute('data-uri', track.uri);
        console.log(track.position);
        tr.setAttribute('data-position', track.position);
        if (isNaN(track.position)) throw "Error";
        tr.setAttribute('data-index', i);
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
             */
        });
        if (store.state.player && store.state.player.item && store.state.player.item.uri == track.uri) {
            tr.classList.add('sp-current-track');
        }
        this.fields.map((field, i) => {
          var td = document.createElement('td');
          let val = track[field];
          
          if (field === 'discovered') {
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
             td.innerHTML = val.map((v, i) => {
              
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
        if (attrName == 'uri') {
            this.limit = 30;
            this.offset = 0;
            
            let result = await store.request('GET', newVal + '?limit=' + this.limit + '&offset=' + this.offset);
            this.setState(result);
        }
    }
    createPlaylist (playlist) {
        let elm = document.createElement('sp-playlist');
        elm.setAttribute('uri', playlist.uri);
        return elm;
    }
    setState(obj) {
        if (obj && obj.objects instanceof Array) {
            let albums = obj.objects.map((item) => {
               var a = document.createElement('sp-playlist');
               a.setState(item);
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
            if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height) {
                this.fetchNext();
            }
    }
    async fetchNext() {
        if (this.fetching) return;
        this.fetching = true;
        let gondole = this.querySelector('sp-gondole');
        
        this.offset += this.limit;
        
        let result = await store.request('GET', this.getAttribute('uri') + '?offset=' + this.offset + '&limit=' + this.limit);
        if (result && result.objects instanceof Array && result.objects.length > 0) {
            result.objects.map(this.createPlaylist.bind(this)).map((tr) => {
                this.appendChild(tr);
            });
            this.fetching = false;
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


class SPTabBarElement extends HTMLElement {
    attachedCallback() {
        if (!this.created) {
            this.titleBar = document.createElement('div');
            this.titleBar.style.visibility = 'hidden';
            this.appendChild(this.titleBar);
            this.created = true;
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
        this.appendChild(this.titleBar);
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
        if (state && state.objects instanceof Array)
        for (let i = 0; i < state.objects.length; i++) {
            let obj = state.objects[i];
            let tab = document.createElement('sp-tab');
            tab.setAttribute('data-tab-id', obj.id);
            tab.innerHTML = obj.name;
            tab.addEventListener('tabselected', (e) => {
                window.location.hash = '#' + e.data;
            });
            this.appendChild(tab);
        }
        this.rightTitleBar = document.createElement('div');
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


class SPFlowElement extends SPResourceElement {
    attachedCallback() {
        this.classList.add('row');
    }
    setState(object) {
        this.innerHTML = '';
        object.objects.map((o) => {
           let div = document.createElement('div');
           let card = document.createElement('sp-card');
           div.appendChild(card);
           return div;
        }).map((d) => {
            this.appendChild(d);
        });
    }
}

document.registerElement('sp-flow');


class SPCardElement extends SPResourceElement {
    setState(object) {
        let image = object.images && object.images.length > 0 ? object.images[0].url : '';
        this.innerHTML = '<sp-cardheader style="' + image + '"></sp-cardheader>' + 
                        '<sp-carcontent><h3><sp-link uri="' + object.uri + '">' + object.name + '</sp-link></h3>' +
                        '</sp-cardcontent>';
    
    }
}

document.registerElement('sp-card', SPCardElement);

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
    attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'uri') {
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
        if (attrName === 'uri') {
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
        if (attrName === 'uri') {
            this.trackcontext.setAttribute('uri', newVal + ':track');
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
        GlobalTabBar.setState({
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
        if (attrName === 'uri') {
            let query = newVal.substr('bungalow:search:'.length);
            this.trackcontext.query = query;
            this.trackcontext.setAttribute('uri', 'bungalow:search');
            let result = await store.request('GET', newVal);
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
window.addEventListener('hashchanged', (e) => {
   let tabId = window.location.hash.substr(1);
   let view = GlobalViewStack.currentView;
   for (let tab in document.querySelector('sp-tab')) {
       if (tab.getAttribute('data-tab-id') == tabId) {
           tab.classList.add('sp-tab-active');
       } else {
           tab.classList.remove('sp-tab-active');
           
       }
   }
   for (let tabView of view.querySelector('sp-tabcontent')) {
       if (tabView.getAttribute('data-tab-id') == tabId) {
           tabView.style.display = 'block';
       } else {
           tabView.style.display = 'none';
       }
   }
});
window.addEventListener('load', (e) => {
    document.querySelector('.body').appendChild(document.createElement('sp-chrome'));
});

