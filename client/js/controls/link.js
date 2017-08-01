define(function () {
    return class SPLinkElement extends HTMLAnchorElement {
        onClick(e) {
            e.preventDefault();
            GlobalViewStack.navigate(this.getAttribute('uri'));
        }
        attachedCallback() {
            this.addEventListener('click', this.onClick);
        }
        disconnectedCallback() {
            this.removeEventListener('click', this.onClick);
        }
    }
});