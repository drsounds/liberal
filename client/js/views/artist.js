define(['controls/view'], function (SPViewElement) {
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
                this.overviewTab = document.createElement('sp-tabcontent');
                this.overviewTab.setAttribute('data-tab-id', 'overview');
                this.appendChild(this.overviewTab);
                this.overviewTab.topTracksDivider = document.createElement('sp-divider');
                this.overviewTab.topTracksDivider.innerHTML = _('Top Tracks');
            
               // this.overviewTab.appendChild(this.overviewTab.topTracksDivider);
                this.overviewTab.toplist = document.createElement('sp-playlist');
                this.overviewTab.appendChild(this.overviewTab.toplist);
                
                this.aboutTab = document.createElement('sp-tabcontent');
                this.aboutTab.aboutElement = document.createElement('sp-about');
                this.aboutTab.appendChild(this.aboutTab.aboutElement);
                this.aboutTab.setAttribute('data-tab-id', 'about');
                this.appendChild(this.aboutTab);
                this.loaded = true;
            }
        }
        async createReleaseSection(name, uri, release_type) {
            
            let singlesDivider = document.createElement('sp-divider');
            singlesDivider.style.display = 'none';
            singlesDivider.setAttribute('data-uri', uri + ':' + release_type);
            singlesDivider.innerHTML = name;
            this.overviewTab.appendChild(singlesDivider);
            
            let releaseList = document.createElement('sp-playlistcontext');
            releaseList.setAttribute('fields', 'p,name,duration,artists');
            releaseList.setAttribute('data-context-artist-uri', uri);
            
            
            this.overviewTab.appendChild(releaseList);
            await releaseList.setAttribute('uri', uri + ':' + release_type);
            
        }
        acceptsUri(uri) {
            return new RegExp(/^bungalow:artist:(.*)$/g).test(uri);
        }
        navigate(uri) {
                
        }
        activate() {
            super.activate();
            this.header.tabBar.setState({
                object: this.state,
                objects: [
                    {
                        id: 'overview',
                        name: _('Overview')
                    },
                    {
                        id: 'about',
                        name: _('About')
                    }
                ]
            });
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName == 'uri') {
                this.overviewTab.toplist.setAttribute('data-context-artist-uri', newVal);
                this.overviewTab.toplist.setAttribute('fields', 'p,name,duration,artists');
                if (newVal in store.state) {
                    this.setState(store.state[newVal]);
                    return;
                }
                
                let result = await store.request('GET', newVal);
                this.overviewTab.toplist.setAttribute('uri', newVal + ':top:5');
                this.state = result;
                
                this.createReleaseSection(_('Albums'), newVal, 'album');
                this.createReleaseSection(_('Singles'), newVal, 'single');
                this.createReleaseSection(_('Appears on'), newVal, 'appears_on');
                this.createReleaseSection(_('Compilations'), newVal, 'compilation');
                
                this.setState(this.state);
                this.aboutTab.aboutElement.setAttribute('uri', newVal + ':about');
                this.activate();
            }
        }
        setState(state) {
            this.header.setState(state);
        }
    }
    document.registerElement('sp-artistview', SPArtistViewElement);

});