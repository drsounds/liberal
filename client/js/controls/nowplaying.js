define(function () {
    class SPNowPlayingElement extends HTMLElement {
        attachedCallback() {
            this.addEventListener('click', this.onClick);
        }
        onClick(e) {
            if (store.state.player) {
                if (store.state.player.context instanceof Object) {
                    GlobalViewStack.navigate(store.state.player.context.uri);
                }
                if (store.state.player.item.album instanceof Object) {
                    GlobalViewStack.navigate(store.state.player.item.album.uri);
                }
            }
        }
        disconnectedCallback() {
            this.removeEventListener('click', this.onClick);

        }
    }

    document.registerElement('sp-nowplaying', SPNowPlayingElement);
    return SPNowPlayingElement;
})