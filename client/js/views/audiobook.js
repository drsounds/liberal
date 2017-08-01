define(['controls/view'], function (SPViewElement) {
    class SPAudioBookViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            this.classList.add('sp-view');
        }
        acceptsUri(uri) {
            return /^bungalow:book:(.*):audio$/.test(uri);
        }
        navigate() {

        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {
                this.obj = await store.request('GET', newVal);
                this.innerHTML = '';
                this.albumView = document.createElement('sp-playlist');
                this.albumView.fields = 'name,duration,artists'
                this.appendChild(this.albumView);
                this.albumView.showCopyrights = true;
                this.albumView.view = this;
                let id = newVal.split(':')[2];
                this.albumView.setAttribute('uri', 'bungalow:album:' + id);
            }
        }
    }

    document.registerElement('sp-audiobookview', SPAudioBookViewElement);
    return SPAudioBookViewElement;
})