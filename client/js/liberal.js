
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
    link.setAttribute('href', '/themes/' + theme + '/css/' + flavor + '.css');
}


applyTheme('chromify', 'light');


/**
 * Data store for application
 **/
class Store extends EventEmitter {
    constructor() {
        super();
        this.state = {};
        this.heart = setInterval(async () => {
            this.state.player = await this.getCurrentTrack();
            this.emit('change');
            let trackItems = document.querySelectorAll('.sp-track');
            if (this.state.player && this.state.player.item) {
                document.querySelector('sp-nowplaying').style.backgroundImage = 'url("' + this.state.player.item.album.images[0].url + '")';
             
                for(var tr of trackItems) {
                    if (tr.getAttribute('data-uri') === this.state.player.item.uri) {
                        tr.classList.add('sp-current-track');
                        
                    } else {
                        tr.classList.remove('sp-current-track');
                    }
                }
            }
        }, 1000);
        this.hue = this.hue;
        this.saturation = this.saturation;
        this.flavor = this.flavor;
        this.stylesheet = this.stylesheet;
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
        this.colorChooser = document.createElement('input');
        this.colorChooser.setAttribute('type', 'range');
        this.appendChild(this.colorChooser);
        this.colorChooser.setAttribute('max', 360);
        this.colorChooser.addEventListener('change', this.colorSlider);
        this.colorChooser.addEventListener('mousemove', this.colorSlider);
        this.saturationChooser = document.createElement('input');
        this.saturationChooser.setAttribute('type', 'range');
        this.appendChild(this.saturationChooser);
        this.saturationChooser.setAttribute('max', 360);
        this.saturationChooser.addEventListener('change', this.saturationSlider);
        this.saturationChooser.addEventListener('mousemove', this.saturationSlider);
        this.saturationChooser.value = store.saturation;
        this.styleselect = document.createElement('select');
        this.styleselect.innerHTML += '<option value="chromify">Chromify</option><option value="chromify-flat">Chromify (flat version)</option><option value="obama">Obama</option>';
        this.appendChild(this.styleselect);
        this.flavorselect = document.createElement('select');
        this.flavorselect.innerHTML += '<option value="dark">Dark</option><option value="light">Light</option>';
        this.appendChild(this.flavorselect);
        this.flavorselect.addEventListener('change', (e) => {
            store.flavor = e.target.options[e.target.selectedIndex].value;
        });
         this.styleselect.addEventListener('change', (e) => {
            store.stylesheet = e.target.options[e.target.selectedIndex].value;
        });
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
        if (!this.searchForm) {
            this.searchForm = document.createElement('sp-searchform');
            this.appendChild(this.searchForm);
            this.themeEditor = document.createElement('sp-themeeditor');
            this.appendChild(this.themeEditor);
        }
    }
    
}
document.registerElement('sp-appheader', SPAppHeaderElement);

class SPAppFooterElement extends HTMLElement {
    attachedCallback() {
        
    }
}
document.registerElement('sp-appfooter', SPAppFooterElement);

class SPChromeElement extends HTMLElement { 
    attachedCallback() {
        this.appHeader = document.createElement('sp-appheader');
        this.appendChild(this.appHeader);
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
        if (newUri in this.views) {
            let view = this.views[newUri];
            
            this.setView(view);
        } else {
            let view = null;
            if (/^bungalow:internal:start$/g.test(newUri)) {
                view = document.createElement('sp-startview');
            } else if (/^bungalow:genre:(.*)$/g.test(newUri)) {
                view = document.createElement('sp-genreview');
                
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


class SPImageElement extends HTMLElement {

    attachedCallback() {
        this.attributeChangedCallback('src', null, this.getAttribute('src'));
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


class SPHeaderElement extends SPResourceElement {
    attachedCallback() {
        this.classList.add('header');

    }
    setState(object) {
        let size = this.getAttribute('size') || 171;
        let width = size;
        let height = size;  
        object.image_url = object.images && object.images[0].url ? object.images[0].url : '';
        this.innerHTML = '<table width="100%"><tbody><tr><td valign="top" width="' + width + '"><sp-image width="' + width + '" height="' + height + '" src="' + object.image_url + '"></sp-image></td><td valign="top"><h3><sp-link uri="' + object.uri + '">' + object.name + '</sp-link></h3><p>' + object.description + '</p></td></tr></tbody></table>';
    }
}

document.registerElement('sp-header', SPHeaderElement);


class SPViewElement extends HTMLElement {
    acceptsUri(uri) {
        return false;
    }
    navigate(uri) {
        
        
    }
    attachedCallback() {
        GlobalTabBar.setState({objects: []});
    }
    attributeChangedCallback(attr, oldValue, newVal) {
        
    }
}

document.registerElement('sp-view', SPViewElement);


class SPArtistViewElement extends SPViewElement {
    async attachedCallback() {
        this.state = {
            artist: null,
            albums: []
        }
        if (!this.header) {
        this.header = document.createElement('sp-header');
        this.appendChild(this.header);
        }
        this.classList.add('sp-view');
        this.state = {
            
        };
         if (!this.topTracksDivider) {
        this.topTracksDivider = document.createElement('sp-divider');
        this.topTracksDivider.innerHTML = 'Top tracks';
        this.appendChild(this.topTracksDivider);
        }
        if (!this.topTracks) {
            this.topTracks = document.createElement('sp-toptracks');
            this.appendChild(this.topTracks);
        }
        if (!this.albumsDivider) {
        this.albumsDivider = document.createElement('sp-divider');
        this.albumsDivider.innerHTML = 'albums';
        this.appendChild(this.albumsDivider);
        }
        if (!this.albumList) {
        
            this.albumList = document.createElement('sp-albumcontext');
            this.appendChild(this.albumList);
        }
    }
    acceptsUri(uri) {
        return new RegExp(/^bungalow:artist:(.*)$/g).test(uri);
    }
    navigate(uri) {
            
    }
    activate() {
        GlobalTabBar.setState({
            object: this.state,
            objects: [{
                name: 'Overview',
                id: 'overview'
            }]
        });
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            
            let result = await store.request('GET', newVal);
            this.state = result;
            
            this.setState(this.state);    
            this.albumList.setAttribute('uri', newVal + ':release');
            this.topTracks.setAttribute('uri', newVal);
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
        this.albumsDivider.innerHTML = 'Public playlists';
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
        this.innerHTML = '<table width="100%" class="header"><tbody><tr><td valign="top" width="171"><img src="' + obj.images[0].url + '" width="171" height="171"></td>' +
            '<td valign="top"><h3><sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link></h3>' +
            '<sp-trackcontext uri="' + obj.uri + ':track' + '"></sp-trackcontext>' +
            '</td></tr></tbody></table>';
    }
}

document.registerElement('sp-album', SPAlbumElement);

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
        this.innerHTML = '<table width="100%" class="header"><tbody><tr><td valign="top" width="171"><img src="/images/toplist.svg" width="171" height="171"></td>' +
            '<td valign="top"><h3>Top Tracks</h3>' +
            '<sp-trackcontext uri="' + obj.uri + ':top:5:track' + '"></sp-trackcontext>' +
            '</td></tr></tbody></table>';
    }
}

document.registerElement('sp-toptracks', SPTopTracksElement);

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
        this.innerHTML = '<table width="100%" class="header"><tbody><tr><td valign="top" width="171"><img src="' + obj.images[0].url + '" width="171" height="171"></td>' +
            '<td valign="top"><h3><sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link></h3><p>' + obj.description + '</p>' +
            '<sp-trackcontext uri="' + obj.uri + ':track' + '"></sp-trackcontext>' +
            '</td></tr></tbody></table>';
    }
}

document.registerElement('sp-playlist', SPPlaylistElement);

class SPTrackContextElement extends SPResourceElement {
    attachedCallback() {
        console.log("T");
        if (!this.hasAttribute('fields'))
            this.setAttribute('fields', 'name,artists,album,user');
        if (this.table == null) {
            this.table = document.createElement('table');
            this.appendChild(this.table);
        }
        this.attributeChangedCallback('uri', null, this.getAttribute('uri'));
        this.style.display = 'block';
        this.thead = this.querySelector('thead');
    }   
    setHeader(header) {
        this.header = header;
    }

    setView(view) {
        this.view = view;
        view.addEventListener('scroll', () => {
            console.log(this);
            let viewBounds = view.getBoundingClientRect();
            let bounds = this.getBoundingClientRect();
            let tabBar = GlobalTabBar.getBoundingClientRect();
            let headerHeight = 0;
            if (this.header) {
                headerHeight = this.header.getBoundingClientRect().height;;
            } 
            console.log(bounds.top, viewBounds.top);
            if (this.view.scrollTop > headerHeight ) {
                this.style.display = 'block';
                let transform = 'translateY(' + ( this.view.scrollTop - headerHeight) + 'px)';
                console.log(transform);
                this.thead.style.transform = transform; 
            } else {
                this.thead.style.transform = 'translateY(0px)';
            }
        });
    }
    
    async attributeChangedCallback(attrName, oldVal, newVal) {
        
        if (attrName == 'uri') {
          let result = await store.request('GET', newVal);
            this.setState(result);
        }
    }
    setState(obj) {
        this.obj = obj;
        this.table.innerHTML = '<thead><tr></tr></thead><tbody></tbody>';
        this.thead = this.table.querySelector('thead');
        this.tbody = this.table.querySelector('tbody');
        this.theadtr = this.table.querySelector('thead tr');
        if (!this.getAttribute('headers')) {
            this.thead.style.display = 'none';
        }
        
        var fields = this.getAttribute('fields').split(',');
        fields.map((f, i) => {
            let field = document.createElement('th');
            field.innerHTML = f;
            this.querySelector('thead tr').appendChild(field);
        });
        var rows = obj.objects.map((track, i) => {
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
            tr.setAttribute('data-index', i);
            tr.addEventListener('dblclick', (e) => {
                let tr = e.target;
                if (this.getAttribute('uri').indexOf('bungalow:album') == 0 || this.getAttribute('uri').indexOf('bungalow:user') == 0 ) {
                    
                    store.play({
                        context_uri: 'spotify:' + this.getAttribute('uri').substr('bungalow:'.length),
                        offset: {
                            position: i
                        }
                    });
                } else {
                    store.play({
                        uris: this.obj.objects.map((o) => o.uri),
                        offset: {
                            position: i
                        }
                    });
                }
            });
            if (store.state.player && store.state.player.item && store.state.player.item.uri == track.uri) {
                tr.classList.add('sp-current-track');
            }
            fields.map((field, i) => {
              var td = document.createElement('td');
              let val = track[field];
              if (typeof(val) === 'string') {
                td.innerHTML = val;
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

            tr.appendChild(td);
           });
           this.tbody.appendChild(tr);
           
        });
    }
}
document.registerElement('sp-trackcontext', SPTrackContextElement);

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
           var a = document.createElement('sp-album');
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

class SPPlaylistContextElement extends SPResourceElement {
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
            this.innerHTML += '<label>Main</label>';
            this.menu = document.createElement('sp-menu');
            this.appendChild(this.menu);
            this.menu.setState({
                objects: [
                    {
                        name: 'Start',
                        uri: 'bungalow:internal:start'
                    }
                ]
            });
            this.innerHTML += '<br><label>Playlists</label>';
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
        
    }
    disconnectedCallback() {
        
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



class SPTabBarElement extends HTMLElement {
    attachedCallback() {
        this.titleBar = document.createElement('div');
        this.appendChild(this.titleBar);
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
        this.titleBar.style.display = 'inline-block';
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
                
            }
        }
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
        this.state.objects.map((item) => {
            if (!item) {
                this.appendChild(document.createElement('br'));
                return;
            }
            let menuItem = document.createElement('sp-menuitem');
            this.appendChild(menuItem);
            menuItem.innerHTML = item.name;
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


class SPSearchFormElement extends HTMLElement {
   
    attachedCallback() {
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
        this.innerHTML = '<h3>Start</h3>';
    }
}
document.registerElement('sp-startview', SPStartViewElement);


class SPAlbumViewElement extends SPViewElement {
    attachedCallback() {
        this.classList.add('sp-view');
    }
    acceptsUri(uri) {
        return /^bungalow:album:(.*)$/.test(uri);
    }
    navigate() {
        
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'uri') {
            this.albumView = document.createElement('sp-album');
            this.appendChild(this.albumView);
            this.albumView.setAttribute('uri', newVal);
        }
    }   
}

document.registerElement('sp-albumview', SPAlbumViewElement);

class SPPlaylistViewElement extends SPViewElement {
    attachedCallback() {
        this.classList.add('sp-view');
        if (!this.header) {
            this.header = document.createElement('sp-header');
            this.header.setAttribute('size', 64);
            this.appendChild(this.header);
        }
        if (!this.trackcontext) {
            this.trackcontext = document.createElement('sp-trackcontext');
            this.appendChild(this.trackcontext);
            this.trackcontext.setAttribute('headers', 'true');
            this.trackcontext.setHeader(this.header);    
            this.trackcontext.setView(this);    
        }


        
    }
    acceptsUri(uri) {
        return /^bungalow:user:(.*):playlist:([a-zA-Z0-9]+)$/.test(uri);
    }
    activate() {
        if (this.state == null) 
            return;
        this.header.setState(this.state);
        GlobalTabBar.setState({
            object: this.state,
            objects: [{
                name: 'Overview',
                id: 'overview'
            }]
        });
    }
    navigate(uri) {
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'uri') {
            this.trackcontext.setAttribute('uri', newVal + ':track');
            let result = await store.request('GET', newVal);
            this.state = result;
           
            this.activate();
        }
    }   
}

document.registerElement('sp-playlistview', SPPlaylistViewElement);

class SPPlayqueueViewElement extends SPViewElement {
    attachedCallback() {
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
        this.classList.add('sp-view');
        this.innerHTML = "<div style='padding: 13pt'><h3>Search results for '<span id='q'></span>";
        this.header = this.querySelector('div');    
        if (!this.trackcontext) {
            this.trackcontext = document.createElement('sp-trackcontext');
            this.appendChild(this.trackcontext);
            this.trackcontext.setAttribute('headers', 'true');
            this.trackcontext.setHeader(this.header);
            this.trackcontext.setView(this);

        }
        
    }
    acceptsUri(uri) {
        return /^bungalow:search:(.*)$/.test(uri);
    }
    navigate() {
        
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'uri') {
            let query = newVal.substr('bungalow:search:'.length);
            this.querySelector('#q').innerHTML = query;
            this.trackcontext.setAttribute('uri', 'bungalow:search?q=' + query + '&type=track&limit=50');
            let result = await store.request('GET', newVal);
            this.header.setState(result);
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

