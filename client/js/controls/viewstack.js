define(function () {
    window.GlobalViewStack = null;

    /**
     * Viewstack element
     **/
    return class SPViewStackElement extends HTMLElement {
        async registerPlugin(appId) {
            
            require(['plugins/' + appId + '/' + appId], function (plugin) {
                plugin();
            });
        }

        registerView(regExp, viewClass) {
            this.views.push({
                regExp: regExp,
                view: viewClass
            });
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
            if (uri === 'bungalow:login') {
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
            if (window.GlobalViewStack.currentView != null && newUri === window.GlobalViewStack.currentView.getAttribute('uri'))
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
                } else if (/^bungalow:book:([a-zA-Z0-9\ \_]+):audio/g.test(newUri)) {
                    view = document.createElement('sp-audiobookview');
                } else if (/^bungalow:audiobook:([a-zA-Z\ \_]+)/g.test(newUri)) {
                    view = document.createElement('sp-audiobookview');
                } else if (/^bungalow:genre:(.*)$/g.test(newUri)) {
                    view = document.createElement('sp-genreview');
                    
                } else if (/^bungalow:label:([a-zA-Z\ \_]+)$/.test(newUri)) {
                    view = document.createElement('sp-labelview');
                } else if (/^bungalow:curator:([a-zA-Z\ \_]+)$/.test(newUri)) {
                    view = document.createElement('sp-curatorview');
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
                    
            
                } else {
                    let foundViews = this.views.map((v) => v.regExp.test(newUri));
                    if (foundViews.length > 0) {
                        view = document.createElement(foundViews[0].tag);
                    }
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
            window.GlobalViewStack.currentView = view;

            if (view.activate instanceof Function) {
                view.activate();
                onHashChanged();
            }
        }
    }
})