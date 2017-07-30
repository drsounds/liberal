define(['controls/view'], function (SPViewElement) {
    class SPPlaylistViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            this.classList.add('sp-view');
            if (!this.header) {
                this.header = document.createElement('sp-header');
                this.header.setAttribute('size', 128);
                this.appendChild(this.header);
            }
            if (!this.trackcontext) {
                this.trackcontext = document.createElement('sp-trackcontext');
                this.appendChild(this.trackcontext);
                this.trackcontext.setAttribute('fields', 'discovered,name,artists,album,user,added_at');
                this.trackcontext.setAttribute('headers', 'true');
                this.trackcontext.header = (this.header);
                this.trackcontext.view = (this);

            }



        }
        acceptsUri(uri) {
            return /^bungalow:user:(.*):playlist:([a-zA-Z0-9]+)$/.test(uri);
        }
        activate() {
            super.activate();
            this.trackcontext.activate();
            if (this.state == null)
                return;
            this.header.setState(this.state);
            GlobalTabBar.setState({
                object: this.state,
                objects: []
            });
        }
        navigate(uri) {
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {

                if (newVal in store.state) {
                    this.setData(store.state[newVal]);
                    return;
                }
                this.trackcontext.setAttribute('uri', newVal + ':track');
                let result = await store.request('GET', newVal);
                this.trackcontext.playlist = result;

                this.state = result;

                this.activate();
            }
        }
    }

    document.registerElement('sp-playlistview', SPPlaylistViewElement);
    return SPPlaylistViewElement;
})