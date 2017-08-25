define(['controls/view'], function (SPViewElement) {
    class SPLabelViewElement extends SPViewElement {
        attachedCallback() {
            super.attachedCallback();
            if (!this.created) {
                this.classList.add('sp-view');
                this.header = document.createElement('sp-header');
                this.appendChild(this.header);
                this.releasecontext = document.createElement('sp-playlistcontext');
                this.attributeChangedCallback('uri', null, this.getAttribute('uri'));
                this.divider = document.createElement('sp-divider');
                this.divider.innerHTML = _('Releases');
                this.appendChild(this.divider);
                this.appendChild(this.releasecontext);

                this.created = true;
            }

        }
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (attrName == 'uri') {
                if (newVal == null) return;
                this.releasecontext.setAttribute('uri', newVal + ':release');
                this.obj = await store.request('GET', newVal);
                this.setState(this.obj);
            }
        }
        setState(obj) {
            this.header.setState(obj);
        }
    }

    document.registerElement('sp-labelview', SPLabelViewElement);
    return SPLabelViewElement;
})