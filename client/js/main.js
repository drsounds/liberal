requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js',  
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        plugins: '../plugins',
        services: 'services'
    }
});


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
/**
 * Data store for application
 **/
class Store extends EventEmitter {
    constructor() {
        super();
        this.services = {
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



const TOTAL_ARTISTS_ON_SPOTIFY = 2000000;
const VERIFIED_PROFILES = ['drsounds', 'alexanderforselius', 'daniel', 'spotify'];


requirejs(
    [
        'controls/about',
        'controls/appheader',
        'controls/appfooter',
        'controls/carousel',
        'controls/chrome',
        'controls/divider',
        'controls/gondole',
        'controls/header',
        'controls/image',
        'controls/infobar',
        'controls/link',
        'controls/main',
        'controls/menu',
        'controls/menuitem',
        'controls/nowplaying',
        'controls/playlist',
        'controls/playlistcontext',
        'controls/popularity',
        'controls/resource',
        'controls/searchform',
        'controls/sidebar',
        'controls/sidebarmenu',
        'controls/tab',
        'controls/tabbar',
        'controls/tabcontent',
        'controls/table',
        'controls/tabledatasource',
        'controls/tabledesigner',
        'controls/themeeditor',
        'controls/title',
        'controls/toolbar',
        'controls/trackcontext',
        'controls/tracktabledatasource',
        'controls/tracktabledesigner',
        'controls/view',
        'controls/viewstack',
        'views/album',
        'views/artist',
        'views/audiobook',
        'views/country',
        'views/curator',
        'views/genre',
        'views/label',
        'views/playlist',
        'views/playqueue',
        'views/search',
        'views/settings',
        'views/start',
        'views/user'
    ],
function (
    SPAboutElement,
    SPAppHeaderElement,
    SPAppFooterElement,
    SPCarouselElement,
    SPChromeElement,
    SPDividerElement,
    SPGondoleElement,
    SPHeaderElement,
    SPImageElement,
    SPInfoBarElement,
    SPLinkElement,
    SPMainElement,
    SPMenuElement,
    SPMenuItemElement,
    SPNowPlayingElement,
    SPPlaylistElement,
    SPPlaylistContextElement,
    SPPopularityElement,
    SPResourceElement,
    SPSearchFormElement,
    SPSidebarElement,
    SPSidebarMenuElement,
    SPTabElement,
    SPTabBarElement,
    SPTabContentElement,
    SPTableElement,
    SPTableDataSource,
    SPTableDesigner,
    SPThemeEditorElement,
    SPTitleElement,
    SPToolbarElement,
    SPTrackContextElement,
    SPTrackTableDataSourceElement,
    SPTrackTableDesignerElement,
    SPViewElement,
    SPViewStackElement,
    SPAlbumViewElement,
    SPArtistViewElement,
    SPCountryViewElement,
    SPCuratorViewElement,
    SPGenreViewElement,
    SPLabelViewElement,
    SPPlaylistViewElement,
    SPPlayqueueViewElement,
    SPSearchViewElement,
    SPSettingsViewElement,
    SPStartViewElement,
    SPUserViewElement
) {
    document.registerElement('sp-about', SPAboutElement);
    document.registerElement('sp-appheader', SPAppHeaderElement);
    document.registerElement('sp-appfooter', SPAppFooterElement);
    document.registerElement('sp-carousel', SPCarouselElement);
    document.registerElement('sp-chrome', SPChromeElement);
    document.registerElement('sp-divider', SPDividerElement);
    document.registerElement('sp-GondoleElement', SPGondoleElement);
    document.registerElement('sp-header', SPHeaderElement);
    document.registerElement('sp-image', SPImageElement);
    document.registerElement('sp-infobar', SPInfoBarElement);
    document.registerElement('sp-link', SPLinkElement);
    document.registerElement('sp-main', SPMainElement);
    document.registerElement('sp-menu', SPMenuElement);
    document.registerElement('sp-menuitem', SPMenuItemElement);
    document.registerElement('sp-nowplaying', SPNowPlayingElement);
    document.registerElement('sp-playlist', SPPlaylistElement);
    document.registerElement('sp-playlistcontext', SPPlaylistContextElement);
    document.registerElement('sp-popularity', SPPopularityElement);
    document.registerElement('sp-resource', SPResourceElement);
    document.registerElement('sp-searchform', SPSearchFormElement);
    document.registerElement('sp-sidebar', SPSidebarElement);
    document.registerElement('sp-sidebarmenu', SPSidebarMenuElement)
    document.registerElement('sp-tab', SPTabElement);
    document.registerElement('sp-tabbar', SPTabBarElement);
    document.registerElement('sp-tabcontent', SPTabContentElement);
    document.registerElement('sp-table', SPTableElement);
    document.registerElement('sp-themeeditor', SPThemeEditorElement);
    document.registerElement('sp-title', SPTitleElement);
    document.registerElement('sp-toolbar', SPToolbarElement);
    document.registerElement('sp-trackcontext', SPTrackContextElement);
    document.registerElement('sp-view', SPViewElement);
    document.registerElement('sp-viewstack', SPViewStackElement);

    document.querySelector('.body').appendChild(document.createElement('sp-chrome'));
});