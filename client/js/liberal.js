
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


applyTheme('obama', 'dark');


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
    render(uri, state) {
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

        if (uri in this.state && method == "GET" && cache)
            return this.state[uri];
        
        if (uri.indexOf('bungalow:') == 0 || uri.indexOf('spotify:') == 0) {
            if (uri.indexOf('spotify:') == 0) {
                uri = 'bungalow:' + uri.substr('spotify:'.length);
            }
            url = uri.substr('bungalow:'.length).split(':').join('/');
            
            url = '/api/music/' + url;
            
        }

        
        let options = {
            credentials: 'include',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            method: method
        };
        if (method === 'POST' || method === 'PUT') {
            options.body = JSON.stringify(payload);
        }
        try {
            let result = await fetch(url, {credentials: 'include', mode: 'cors'}).then((e) => e.json());
            this.render(uri, result);
     
            return result;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Get album by ID
     **/
    async getAlbumById(id) {
        let uri = 'spotify:album:' + id;
        let result = await fetch('/api/music/album/' + id, {credentials: 'include', mode: 'cors'}).then((e) => e.json())
        this.render(uri, result);
        return result;
    }
    async getArtistById(id) {
        let uri = 'spotify:artist:' + id;
        let result = await fetch('/api/music/artist/' + id, {credentials: 'include', mode: 'cors'}).then((e) => e.json());
        this.render(uri, result);
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


class SPAppHeaderElement extends HTMLElement {
    attachedCallback() {
        if (!this.searchForm) {
            this.searchForm = document.createElement('sp-searchform');
            this.appendChild(this.searchForm);
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
    }
}

GlobalViewStack = null;

var GlobalTemplates = {};

document.registerElement('sp-chrome', SPChromeElement);

class SPResourceElement extends HTMLElement {
    constructor() {
        super();
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'uri') {
            let data = await store.request('GET', newVal);
            this.render(data);
        }
    }
    getTemplate(url) {
        if (url in GlobalTemplates) {
            return GlobalTemplates[url];
        }
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', '/templates/' + url + '.html', false);
        xmlHttp.send();
        var _template = xmlHttp.responseText;
        return _.template(_template);
    }
    get uri() {
        return this.getAttribute('uri');
    }
    set uri(val) {
        this.setAttribute('uri', val);
    }
   
    render() {
        this.innerHTML = '';
        if (!this.state) {
            return;
        }
        if (this.template != null) {
            this.innerHTML = this.template(obj);
            return;
        }
        let obj = this.state;
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
              
        
            } else if (/^bungalow:user:([a-zA-Z0-9._]+):playlist:([a-zA-Z0-9]+)$/g.test(newUri)) {
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
    }
}

document.registerElement('sp-viewstack', SPViewStackElement);


class SPImageElement extends HTMLElement {

    attachedCallback() {
        this.attributeChangedCallback('src', null, this.getAttribute('src'));
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'src') {
            this.state = newVal;
        }
    }
    render() {
        if (state instanceof Object) {
            this.render(this.state.uri);
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
    attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'uri') {
            this.state = newVal;
        }
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
        GlobalTabBar.render({objects: []});
    }
    attributeChangedCallback(attr, oldValue, newVal) {
        
    }
}

document.registerElement('sp-view', SPViewElement);


class SPArtistViewElement extends SPViewElement {
    async attachedCallback() {
        
       
    }
    acceptsUri(uri) {
        return new RegExp(/^bungalow:artist:(.*)$/g).test(uri);
    }
    navigate(uri) {
            
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            this.state = await store.request('GET', newVal);
            this.state.albums = await store.request('GET', newVal + ':release');
            this.state.toplist = await store.request('GET', newVal + ':top:5:track');
            this.render();    
        }
    }
    render() {
        this.innerHTML = '';
        let state = this.state;
        if (!state) {
            return "<sp-center>Could not load view</sp-center>";
        }
        if (!this.header) {
        this.header = document.createElement('sp-header');
        this.appendChild(this.header);
        }
        this.classList.add('sp-view');
       
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
        GlobalTabBar.state = {
            objects: [
                {
                    name: 'Overview',
                    id: 'overview'
                }    
            ]
        };
        this.albumList.state = this.state.albums;
        this.topTracks.state = this.state.toplist;
        this.albumList.render();
        this.topTracks.render();
        this.header.render();
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
            
          this.render();    
          this.albumList.setAttribute('uri', newVal + ':playlist');
        }
    }
    render(state) {
        this.header.render();
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
            
          this.state = await store.request('GET', newVal);
            
          this.state.albums = await store.request('GET', newVal + ':playlist');
          this.render();
        }
    }
    render() {
        this.header.render();
    }
}

document.registerElement('sp-genreview', SPGenreViewElement);

document.registerElement('sp-resource', SPResourceElement);

class SPAlbumElement extends SPResourceElement {
    async attachedCallback() {
        this.template = this.getTemplate('album');
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            
            this.state = await store.request('GET', newVal);
            this.render();
        }
    }
}

document.registerElement('sp-album', SPAlbumElement);

class SPTopTracksElement extends SPResourceElement {
    async attachedCallback() {
        this.template = this.getTemplate('toplist');
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            
            this.state = await store.request('GET', newVal);
            this.render();
        }
    }
    render() {
            debugger;
        if (this.template instanceof Function)
        this.innerHTML = this.template(this.state);
    }
}

document.registerElement('sp-toptracks', SPTopTracksElement);

class SPPlaylistElement extends SPResourceElement {
    constructor() {
        super();
        
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'uri') {
            
          let result = await store.request('GET', newVal);
            this.render(result);
        }
    }
    render() {
        this.template = this.getTemplate('playlist');
        this.innerHTML = this.template(this.state);
    }
}

document.registerElement('sp-playlist', SPPlaylistElement);


class RTrackContext extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            uri: this.props.uri,
            objects: [],
            showHeaders: this.props.showHeaders,
            selectedIndices: [],
            sorting: {
                name: (a,b) => { return a.name > b.name;},
                artist: (a,b) => { return a.artists[0].name > b.artists[0].name},
                release: (a,b) => { return a.album.name > b.album.name}
            },
            loaded: false,
            sort: null
        }
    }
    componentWillUpdate() {
        
    }
    componentDidMount() {
        let uri = this.props.uri;
        MusicStore.fetchObjectsFromCollection(this.props.uri);
        MusicStore.addChangeListener(() => {
            let uri = this.props.uri;
            let state = MusicStore.state.resources[uri];
            if (state)
            this.render({
                loaded: true,
                objects: state.objects
            });
        });
    }
    _onTouchTrack(i) {
        let track = this.state.objects[i];
        this.render({
            selectedIndices: [i]
        });
    }
    _onDoubleClick(i) {
        let track = this.state.objects[i];
        MusicStore.play({
            context_uri: this.state.uri.substr(0, this.state.uri.length - ':track'.length),
            offset: {
                position: i
            }
        });
    }
    render() {
        
        let tracks = this.state.objects;
        if (this.state.sort != null) {
            tracks = tracks.sort(this.state.sorting[this.state.sort]);
        }
        return (
            React.createElement(
                Loading,
                { loaded: undefined.state.loaded },
                React.createElement(
                    'table',
                    { className: 'sp-table', style: { width: '100%' } },
                    undefined.state.showHeaders && React.createElement(
                        'thead',
                        null,
                        React.createElement(
                            'tr',
                            null,
                            React.createElement(
                                'th',
                                null,
                                'Name'
                            ),
                            React.createElement(
                                'th',
                                null,
                                'Artist'
                            ),
                            React.createElement(
                                'th',
                                null,
                                'Album'
                            )
                        )
                    ),
                    React.createElement(
                        'tbody',
                        null,
                        tracks instanceof Array && tracks.map(function (o, i) {
                            var isSelected = undefined.state.selectedIndices.includes(i);
                            var className = MusicStore.state.player.item && MusicStore.state.player.item.uri === o.uri ? 'sp-now-playing' : '';
                            return React.createElement(
                                'tr',
                                { key: i, onDoubleClick: function onDoubleClick() {
                                        undefined._onDoubleClick(i);
                                    }, onMouseDown: function onMouseDown() {
                                        undefined._onTouchTrack(i);
                                    }, className: className + ' ' + (isSelected ? 'sp-track-selected' : '') },
                                React.createElement(
                                    'td',
                                    null,
                                    o.name
                                ),
                                React.createElement(
                                    'td',
                                    null,
                                    o.artists instanceof Array && o.artists.map(function (artist) {
                                        return React.createElement(
                                            Link,
                                            { to: uriToPath(artist.uri) },
                                            artist.name
                                        );
                                    })
                                ),
                                o.album && React.createElement(
                                    'td',
                                    null,
                                    React.createElement(
                                        Link,
                                        { to: uriToPath(o.album.uri) },
                                        o.album.name
                                    )
                                )
                            );
                        })
                    )
                )
            )
        )
    }
}


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
        view.parentNode.addEventListener('scroll', () => {
            console.log(this);
            
            let viewBounds = view.parentNode.getBoundingClientRect();
            let bounds = this.getBoundingClientRect();
            let tabBar = GlobalTabBar.getBoundingClientRect();
            let headerHeight = 0;
            if (this.header) {
                headerHeight = this.header.getBoundingClientRect().height;;
            } 
            console.log(bounds.top, viewBounds.top);
            if (bounds.top < viewBounds.top ) {
                this.style.display = 'block';
                let transform = 'translateY(' + ( this.view.parentNode.scrollTop - headerHeight) + 'px)';
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
            this.render(result);
        }
    }
    render(obj) {
        this.obj = obj;
        if (!obj || !obj.objects) {
            this.table.innerHTML = '<thead><thead><tbody>Could not load tracklist</tbody>';
            return;
        }
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
                    debugger;
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
            this.state = (result);
            this.render();
        }
    }
    render() {
        this.innerHTML = '';
        let albums = this.state.objects.map((item) => {
           var a = document.createElement('sp-album');
           a.state = item;
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
            
          this.state = await store.request('GET', newVal);
            this.render();
        }
    }
    render(obj) {
        this.innerHTML = '';
        let albums = obj.objects.map((item) => {
           var a = document.createElement('sp-playlist');
           store.state[item.uri] = item;
           a.render();
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
       
        if (!this.menu) {
            this.menu = document.createElement('sp-menu');
            this.appendChild(this.menu);
        }
    }
}

document.registerElement('sp-sidebar', SPSidebarElement);


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
        
    }
    render(state) {
        this.innerHTML = '';
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
    }
}
document.registerElement('sp-tabbar', SPTabBarElement);


class SPTabContentElement extends HTMLElement {
    attachedCallback() {
        
    }
}
document.registerElement('sp-tabcontent', SPTabContentElement);

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
    navigate() {
        
    }
    async attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === 'uri') {
            this.trackcontext.setAttribute('uri', newVal + ':track');
            this.state = await store.request('GET', newVal);
            this.header.render(this.state);
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
            this.header.state = result;
            this.render()
        }
    }   
    render() {
        this.header.render();
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
            this.header.render(result);
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
    document.body.appendChild(document.createElement('sp-chrome'));
});

