
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
                for(var tr of trackItems) {
                    if (tr.getAttribute('data-uri') === this.state.player.item.uri) {
                        tr.classList.add('sp-current-track');
                    } else {
                        tr.classList.remove('sp-current-track');
                    }
                }
            }
        }, 1000);
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
                    method: method,
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


class SPChromeElement extends HTMLElement { 
    attachedCallback() {
        this.sidebar = document.createElement('sp-sidebar');
        this.appendChild(this.sidebar); 
        this.viewStack = document.createElement('sp-viewstack');
        GlobalViewStack = this.viewStack;
        this.appendChild(this.viewStack);
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
            if (/^bungalow:internal:start$/g.test(newUri)) {
                let artistView = document.createElement('sp-startview');
                this.addView(newUri, artistView);
                artistView.setAttribute('uri', newUri);
            } else if (/^bungalow:genre:(.*)$/g.test(newUri)) {
                let searchView = document.createElement('sp-genreview');
                this.addView(newUri, searchView);
                searchView.setAttribute('uri', newUri);
            } else if (/^bungalow:search:(.*)$/g.test(newUri)) {
                let searchView = document.createElement('sp-searchview');
                this.addView(newUri, searchView);
                searchView.setAttribute('uri', newUri);
            } else if (/^bungalow:artist:(.*)$/g.test(newUri)) {
                let artistView = document.createElement('sp-artistview');
                this.addView(newUri, artistView);
                artistView.setAttribute('uri', newUri);
        
            } else if (/^bungalow:album:(.*)$/g.test(newUri)) {
                let albumView = document.createElement('sp-albumview');
                this.addView(newUri, albumView);
                albumView.setAttribute('uri', newUri);
        
            } else if (/^bungalow:user:([a-zA-Z0-9._]+):playlist:([a-zA-Z0-9]+)$/g.test(newUri)) {
                let albumView = document.createElement('sp-playlistview');
                this.addView(newUri, albumView);
                albumView.setAttribute('uri', newUri);
        
            } else if (/^bungalow:user:([a-zA-Z0-9._]+)$/g.test(newUri)) {
                let albumView = document.createElement('sp-userview');
                this.addView(newUri, albumView);
                albumView.setAttribute('uri', newUri);
        
            }
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
    }
}

document.registerElement('sp-viewstack', SPViewStackElement);


class SPHeaderElement extends SPResourceElement {
    attachedCallback() {
        this.classList.add('header');
    }
    setState(object) {
        object.image_url = object.images && object.images[0].url ? object.images[0].url : '';
        this.innerHTML = '<table width="100%"><tbody><tr><td valign="top" width="128"><img width="128" height="128" src="' + object.image_url + '"></td><td valign="top"><h3><sp-link uri="' + object.uri + '">' + object.name + '</sp-link></h3><p>' + object.description + '</p></td></tr></tbody></table>';
    }
}

document.registerElement('sp-header', SPHeaderElement);


class SPViewElement extends HTMLElement {
    acceptsUri(uri) {
        return false;
    }
    navigate(uri) {
        
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
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            
          let result = await store.request('GET', newVal);
            
          this.setState(result);    
          this.albumList.setAttribute('uri', newVal + ':release');
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
        this.innerHTML = '<table width="100%" class="header"><tbody><tr><td valign="top" width="128"><img src="' + obj.images[0].url + '" width="128" height="128"></td>' +
            '<td valign="top"><h3><sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link></h3>' +
            '<sp-trackcontext uri="' + obj.uri + ':track' + '"></sp-trackcontext>' +
            '</td></tr></tbody></table>';
    }
}

document.registerElement('sp-album', SPAlbumElement);

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
        this.innerHTML = '<table width="100%" class="header"><tbody><tr><td valign="top" width="128"><img src="' + obj.images[0].url + '" width="128" height="128"></td>' +
            '<td valign="top"><h3><sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link></h3><p>' + obj.description + '</p>' +
            '<sp-trackcontext uri="' + obj.uri + ':track' + '"></sp-trackcontext>' +
            '</td></tr></tbody></table>';
    }
}

document.registerElement('sp-playlist', SPPlaylistElement);

class SPTrackContextElement extends SPResourceElement {
    attachedCallback() {
        if (!this.hasAttribute('fields'))
            this.setAttribute('fields', 'name,artists,album,user');
        if (this.table == null) {
            this.table = document.createElement('table');
            this.appendChild(this.table);
        }
        this.attributeChangedCallback('uri', null, this.getAttribute('uri'));
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
                if (this.getAttribute('uri').indexOf('spotify:album') == 0 || this.getAttribute('uri').indexOf('spotify:user') == 0 ) {
                    store.play({
                        context_uri: this.getAttribute('uri'),
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
              if (!val) return;
              if (val instanceof Array) {
                 td.innerHTML = val.map((v, i) => {
                  
                     return '<sp-link uri="' + v.uri + '">' + v.name + '</sp-link>'
                }).join(', '); 
              } else if (val instanceof Object) {
                  if (val) {
                  td.innerHTML = '<sp-link uri="' + val.uri + '">' + val.name + '</sp-link>'; 
                  } else {
                      td.innerHTML = '';
                  }
              } else {
                  td.innerHTML = val;
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
    attachedCallback() {
        this.searchForm = document.createElement('sp-searchform');
        this.appendChild(this.searchForm);
        if (!this.menu) {
            this.menu = document.createElement('sp-menu');
            this.appendChild(this.menu);
        }
    }
}

document.registerElement('sp-sidebar', SPSidebarElement);

class SPMenuElement extends HTMLElement {
    attachedCallback() {
        [
            {
                name: 'Start',
                uri: 'bungalow:internal:start'
            },
            null,
            {
                name: 'Featured tracks',
                uri: 'bungalow:user:drsounds:playlist:763eLyGqbJrXpuwdI5tlPV'
            },
            null,
            {
                name: 'drsounds',
                uri: 'bungalow:user:drsounds'
            },
            {
                name: 'Dr. Sounds',
                uri: 'spotify:artist:2FOROU2Fdxew72QmueWSUy'
            }
        ].map((item) => {
            if (!item) {
                this.appendChild(document.createElement('br'));
                return;
            }
            let menuItem = document.createElement('sp-menuitem');
            this.appendChild(menuItem);
            menuItem.innerHTML = item.name;
            menuItem.setAttribute('uri', item.uri);
        })    
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
            this.appendChild(this.header);
        }
        if (!this.trackcontext) {
            this.trackcontext = document.createElement('sp-trackcontext');
            this.appendChild(this.trackcontext);
            this.trackcontext.setAttribute('headers', 'true');
        }
        
    }
    acceptsUri(uri) {
        return /^bungalow:user:(.*):playlist:([a-zA-Z0-9]+)$/.test(uri);
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
        if (!this.trackcontext) {
            this.trackcontext = document.createElement('sp-trackcontext');
            this.appendChild(this.trackcontext);
            this.trackcontext.setAttribute('headers', 'true');
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
            this.trackcontext.setAttribute('uri', 'bungalow:search?q=' + query + '&type=track');
            let result = await store.request('GET', newVal);
            this.header.setState(result);
        }
    }   
}

document.registerElement('sp-searchview', SPSearchViewElement);

window.addEventListener('load', (e) => {
    document.body.appendChild(document.createElement('sp-chrome'));
});