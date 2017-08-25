define(['controls/view'], function (SPViewElement) {
    class SPCountryViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            if (!this.created) {
                this.classList.add('sp-view');
                this.header = document.createElement('sp-header');
                this.appendChild(this.header);
                this.albumsDivider = document.createElement('sp-divider');
                this.albumsDivider.innerHTML = 'Top Tracks';
                this.appendChild(this.albumsDivider);
                this.topTracks = document.createElement('sp-playlist');
                this.appendChild(this.topTracks);
                this.created = true;
            }
        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName == 'uri') {

                let result = await store.request('GET', newVal);
                this.state = result;

                this.setState(this.state);
                this.topTracks.setAttribute('uri', newVal + ':top:5');
                this.setState(this.state);
                this.activate();
            }
        }
        setState(state) {
            this.header.setState(state);
        }
    }

    document.registerElement('sp-countryview', SPCountryViewElement);
    return SPCountryViewElement;
})