define(['controls/resource'], function (SPResourceElement) {
    return class SPPlaylistContextElement extends SPResourceElement {
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName == 'uri') {
                this.limit = 30;
                this.offset = 1;
                let uri = newVal;
                let result = await store.request('GET', newVal, {limit: this.limit, offset: this.offset});
                this.setState(result);
                if (result != null && result.objects.length > 0) {

                    let divider = this.parentNode.querySelector('sp-divider[data-uri="' + newVal + '"]');
                    if (divider != null)
                        divider.style.display = 'block';
                }
            }
        }
        createPlaylist (playlist) {
            let elm = document.createElement('sp-playlist');
            if (this.hasAttribute('fields'))
                elm.setAttribute('fields', this.getAttribute('fields'));
            if (this.hasAttribute('data-context-artist-uri')) {

                elm.setAttribute('data-context-artist-uri', this.getAttribute('data-context-artist-uri'));
            }
            store.state[playlist.uri] = playlist;
            store.state[playlist.uri + ':track'] = playlist.tracks;
            elm.setAttribute('uri', playlist.uri);
            return elm;
        }
        setState(obj) {
            if (obj && obj.objects instanceof Array) {
                let albums = obj.objects.map((item) => {
                    var a = document.createElement('sp-playlist');
                    if (this.hasAttribute('data-max-rows')) {
                        a.setAttribute('data-max-rows', this.getAttribute('data-max-rows'));
                    }
                    if (this.hasAttribute('data-context-artist-uri')) {
                        a.setAttribute('data-context-artist-uri', this.getAttribute('data-context-artist-uri'));
                    }
                    if (this.hasAttribute('fields'))
                        a.setAttribute('fields', this.getAttribute('fields'));
                    let fields = a.fields;

                    a.setState(item);
                    store.state[item.uri + ':track'] = item.tracks;
                    store.state[item.uri] = item;
                    return a;
                });
                albums.forEach((album) => {
                    this.appendChild(album);
                });
            }
            this.innerHTML += '<sp-gondole></sp-gondole>';
            let gondole = this.querySelector('sp-gondole');
            let viewBounds = this.parentNode.getBoundingClientRect();
            if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height && !gondole.getAttribute('active') === 'true') {
                this.fetchNext();
            }
        }
        async fetchNext() {
            if (this.fetching) return;
            this.fetching = true;
            let gondole = this.querySelector('sp-gondole');
            gondole.setAttribute('active', 'true');
            this.offset += this.limit;
            this.removeChild(gondole);
            console.log(this.offset);
            let uri = this.getAttribute('uri') + '?offset=' + this.offset + '&limit=' + this.limit;
            console.log(uri);
            let result = await store.request('GET', uri);
            if (result && result.objects instanceof Array && result.objects.length > 0) {
                result.objects.map(this.createPlaylist.bind(this)).map((tr) => {
                    this.appendChild(tr);
                });
                this.fetching = false;
                gondole.setAttribute('active', 'false');
                this.appendChild(gondole);

            } else {
                if (this.gondole)
                    this.removeChild(this.gondole);
            }
        }
        get view() {
            return this._view;
        }
        set view(val) {

            this._view = val;
            this._view.addEventListener('scroll', this._onScroll.bind(this));
        }
        _onScroll(e) {
            let view = e.target;
            let viewBounds = view.getBoundingClientRect();
            let gondole = this.querySelector('sp-gondole');
            if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height) {
                this.fetchNext();
            }

        }
    }
});