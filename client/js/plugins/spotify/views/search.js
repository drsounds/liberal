define(['controls/view'], function (SPViewElement) {
    class SPSearchViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            if (!this.created) {
                this.classList.add('sp-view');
                //this.innerHTML = "<div style='padding: 13pt'><h3>Search results for '<span id='q'>'</span>";
                this.header = document.createElement('sp-header');

                this.trackcontext = document.createElement('sp-trackcontext');
                this.appendChild(this.trackcontext);
                this.trackcontext.setAttribute('headers', 'true');
                this.trackcontext.header = (this.header);
                this.trackcontext.view = (this);
                this.created = true;
            }

        }
        activate() {
            let uri = ''
            if (!this.hasAttribute('uri'))
                return;
            uri = this.getAttribute('uri');
            let query = this.getAttribute('uri').substr('bungalow:search:'.length);

            this.header.tabBar.setState({
                id: query,
                uri: this.getAttribute('uri'),
                name: query,
                type: 'search'
            })
        }
        acceptsUri(uri) {
            return /^bungalow:search:(.*)$/.test(uri);
        }
        navigate() {

        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {
                let query = newVal.substr('bungalow:search:'.length);
                this.trackcontext.query = query;
                this.trackcontext.setAttribute('uri', 'bungalow:search');
                this.header.setState({
                    name: query,
                    id: query,
                    description: "Search results for '" + query + "'",
                    uri: 'bungalow:search: ' + query,
                    type: 'search',
                    images: [{
                        url: ''
                    }]
                });
            }
        }
    }

    document.registerElement('sp-searchview', SPSearchViewElement);
    return SPSearchViewElement;
});