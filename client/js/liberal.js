(function () {
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
        this.state = this.loadState();
    }
    
    /**
     * Save state
     **/
    saveState() {
        localStorage.setItem('store', JSON.stringify(this.state));
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
    }
    
    async request(method, uri) {
        if (uri.indexOf('spotify:') == 0) {
            uri = 'bungalow:' + uri.substr('spotify:'.length);
        }
        let url = uri.substr('bungalow:'.length).split(':').join('/');
        
        
        if (uri in this.state)
            return this.state[uri];
        
        let result = await fetch('/api/music/' + url, {credentials: 'include', mode: 'cors'}).then((e) => e.json());
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
    navigate(uri, dontPush) {
        let evt = new CustomEvent('beforenavigate');
        this.dispatchEvent(evt);
        
        
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
        }
        if (newUri in this.views) {
            let view = this.views[newUri];
            this.setView(view);
        } else {
            if (/^bungalow:artist:(.*)$/g.test(newUri)) {
                let artistView = document.createElement('sp-artistview');
                this.addView(newUri, artistView);
                artistView.setAttribute('uri', newUri);
        
            }
            if (/^bungalow:album:(.*)$/g.test(newUri)) {
                let albumView = document.createElement('sp-albumview');
                this.addView(newUri, albumView);
                albumView.setAttribute('uri', newUri);
        
            }
            if (/^bungalow:user:([a-zA-Z0-9._]+):playlist:([a-zA-Z0-9]+)$/g.test(newUri)) {
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
        this.header = document.createElement('sp-header');
        this.appendChild(this.header);
        this.classList.add('sp-view');
        this.state = {
            
        };
        this.albumsDivider = document.createElement('sp-divider');
        this.albumsDivider.innerHTML = 'albums';
        this.appendChild(this.albumsDivider);
        
        this.albumList = document.createElement('sp-albumcontext');
        this.appendChild(this.albumList);
        
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
        this.albumsDivider = document.createElement('sp-divider');
        this.albumsDivider.innerHTML = 'Public playlists';
        this.appendChild(this.albumsDivider);
        
        this.albumList = document.createElement('sp-playlistcontext');
        this.appendChild(this.albumList);
        
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
            '<td valign="top"><h3><sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link></h3>' +
            '<sp-trackcontext uri="' + obj.uri + ':track' + '"></sp-trackcontext>' +
            '</td></tr></tbody></table>';
    }
}

document.registerElement('sp-playlist', SPPlaylistElement);

class SPTrackContextElement extends SPResourceElement {
    attachedCallback() {
        if (!this.hasAttribute('fields'))
            this.setAttribute('fields', 'name,artists,album');
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
        this.table.innerHTML = '<thead><tr></tr></thead><tbody></tbody>';
        this.thead = this.table.querySelector('thead');
        this.tbody = this.table.querySelector('tbody');
        this.theadtr = this.table.querySelector('thead tr');
        
        var fields = this.getAttribute('fields').split(',');
        fields.map((f, i) => {
            let field = document.createElement('td');
            field.innerHTML = f;
            this.querySelector('thead tr').appendChild(field);
        });
        var rows = obj.objects.map((track, i) => {
           let tr = document.createElement('tr');
           
           fields.map((field, i) => {
              var td = document.createElement('td');
              
              let val = track[field];
              if (val instanceof Array) {
                 td.innerHTML = val.map((v, i) => {
                  
                     return '<sp-link uri="' + v.uri + '">' + v.name + '</sp-link>'
                }).join(','); 
              } else if (val instanceof Object) {
                  td.innerHTML = '<sp-link uri=2' + val.uri + '">' + val.name + '</sp-link>'; 
              } else {
                  td.innerHTML = val;
              }
            tr.appendChild(td);
           });
           this.tbody.appendChild(tr);
           
        });
        fields.forEach((f) => {
            this.thead.tr.appendChild(f);
        });
        
        rows.forEach((tr) => {
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
    }
}

document.registerElement('sp-sidebar', SPSidebarElement);

class SPMenuElement extends HTMLElement {
    constructor() {
        
    }
    setItems(items) {
        
    }
    
}


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

class SPMenuItemElement extends HTMLElement {
    attributeChangedCallback(attr, oldVal, newVal) {
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.a = new SPLinkElement();
        this.attributeChangedCallback('text', null, this.getAttribute('text'));
        this.attributeChangedCallback('href', null, this.getAttribute('uri'));
        if (attr == 'text') {
            this.shadow.a.innerHTML = newVal;
        }
        if (attr == 'uri') {
            this.shadow.a.href = newVal;
        }
    }
    attachedCallback() {
        
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
            event.preventDefault();
            let evt = new CustomEvent('enter');
            evt.query = this.searchTextBox.value;
            this.dispatchEvent(evt);
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
    constructor() {
        super();
    }
    acceptsUri(uri) {
        return uri === 'bungalow:internal:start';
    }
    navigate() {
        
    }
    attachedCallback() {
        this.innerHTML = '<h3>Start</h3>';
    }
}


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

window.addEventListener('load', (e) => {
    document.body.appendChild(document.createElement('sp-chrome'));
})




})(window);