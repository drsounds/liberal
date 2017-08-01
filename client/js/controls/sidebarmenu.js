define(['store'], function () {
    return class SPSidebarMenuElement extends HTMLElement {
        async attachedCallback() {
            if (!this.menu) {
                this.searchForm = document.createElement('sp-searchform');
                this.appendChild(this.searchForm);


                this.label = document.createElement('label');
                this.label.innerHTML = _('Main Menu');
                this.appendChild(this.label);
                this.menu = document.createElement('sp-menu');
                this.appendChild(this.menu);
                this.menu.setState({
                    objects: [
                        {
                            name: _('Start'),
                            uri: 'bungalow:internal:start'
                        },
                        {
                            name: _('Settings'),
                            uri: 'bungalow:internal:settings'
                        },
                        {
                            name: _('Library'),
                            uri: 'bungalow:internal:library'
                        }
                    ]
                });
                this.appendChild(document.createElement('br'));
                this.label2 = document.createElement('label');
                this.label2.innerHTML = _('Playlists');
                this.appendChild(this.label2);
                this.searchesMenu = document.createElement('sp-menu');

                this.playlistsMenu = document.createElement('sp-menu');
                this.appendChild(this.playlistsMenu);
                let playlists = await store.request('GET', 'spotify:me:playlist');
                this.playlistsMenu.setState(playlists);
            }
        }

    }
});