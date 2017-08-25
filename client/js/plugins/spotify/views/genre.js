define(['controls/view'], function (SPViewElement) {
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
            if (!newVal) return;
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
    return SPGenreViewElement;
})