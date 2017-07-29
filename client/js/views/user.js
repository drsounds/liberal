define(['controls/view'], function (SPViewElement) {
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
                this.albumList.setAttribute('data-max-rows', 10);
                this.albumList.setAttribute('fields', 'name,duration,artists,added_at,added_by');
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
            this.header.tabBar.setState({
                object: this.state,
                objects: [{
                    id: 'overview',
                    name: 'Overview'
                }]
            });
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
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
});