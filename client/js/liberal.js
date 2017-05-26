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
    
    /**
     * Get album by ID
     **/
    async getAlbumById(id) {
        let uri = 'spotify:album:' + id;
        let result = await fetch('/api/music/album/' + id).then((e) => e.json())
        this.setState(uri, result);
    }
    async getArtistById(id) {
        let uri = 'spotify:artist:' + id;
        let result = await fetch('/api/music/artist/' + id).then((e) => e.json());
        this.setState(uri, result);
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
        this.viewStack = document.createElement('sp-viewstack');
        GlobalViewStack = this.viewStack;
        this.appendChild(this.viewStack);
        this.sidebar = document.createElement('sp-sidebar');
        this.appendChild(this.sidebar); 
        this.viewStack.navigate('bungalow:internal:start');
    }
}

GlobalViewStack = null;

document.registerElement('sp-chrome', SPChromeElement);


/**
 * Viewstack element
 **/
class SPViewStackElement extends HTMLElement {
    constructor() {
        super();
    }
    
    attachedCallback() {
        debugger;
        let path = window.location.pathname.substr(1);
        let uri = 'bungalow:' + path.split('/').join(':');
        this.navigate(uri);
    
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
        
        let url = uri.substr('bungalow:'.length).split(':').join('/');
        
        if (!dontPush)
            history.pushState(uri, uri, '/' + url);
            
        
    }
}

document.registerElement('sp-viewstack', SPViewStackElement);


class SPViewElement extends HTMLElement {
    constructor() {
        this.attributeChangedCallback('uri', null, this.getAttribute('uri'));
    }
    acceptsUri(uri) {
        return false;
    }
    navigate(uri) {
        
    }
    attributeChangedCallback(attr, oldValue, newVal) {
        
    }
}

document.registerElement('sp-view', SPViewElement);


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
    attachedCallback() {
        this.addEventListener('click', (e) => {
            e.preventDefault();
            ViewStack.navigate(this.getAttribute('href'));
        })
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

window.addEventListener('load', (e) => {
    document.body.appendChild(document.createElement('sp-chrome'));
})

})(window);