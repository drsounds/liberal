define(function () {
    return class SPSidebarElement extends HTMLElement {
        async attachedCallback() {

            this.menu = document.createElement('sp-sidebarmenu');
            this.appendChild(this.menu);
            this.nowplaying = document.createElement('sp-nowplaying');
            this.appendChild(this.nowplaying);
        }
    }
});