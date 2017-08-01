define(function () {
    return class SPTabElement extends HTMLElement {
        attachedCallback() {
            this.addEventListener('mousedown', this.onClick);
        }

        onClick(event) {
            let tabId = event.target.getAttribute('data-tab-id');
            let evt = new CustomEvent('tabselected');
            evt.data = tabId;
            this.dispatchEvent(evt);
        }

        disconnectedCallback() {
            this.removeEventListener('click', this.onClick);
        }
    }
})