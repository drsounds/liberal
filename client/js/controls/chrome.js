define(
    [
        'controls/about',
        'controls/appheader',
        'controls/appfooter',
        'controls/carousel',
        'controls/chrome',
        'controls/divider',
        'controls/gondole',
        'controls/header',
        'controls/image',
        'controls/infobar',
        'controls/link',
        'controls/main',
        'controls/menu',
        'controls/menuitem',
        'controls/nowplaying',
        'controls/playlist',
        'controls/playlistcontext',
        'controls/popularity',
        'controls/resource',
        'controls/searchform',
        'controls/sidebar',
        'controls/sidebarmenu',
        'controls/tab',
        'controls/tabbar',
        'controls/tabcontent',
        'controls/table',
        'controls/tabledatasource',
        'controls/tabledesigner',
        'controls/themeeditor',
        'controls/title',
        'controls/toolbar',
        'controls/trackcontext',
        'controls/tracktabledatasource',
        'controls/tracktabledesigner',
        'controls/view',
        'controls/viewstack',
        'store',
        'events'
    ],
    function (
        SPAboutElement,
        SPAppHeaderElement,
        SPAppFooterElement,
        SPCarouselElement,
        SPChromeElement,
        SPDividerElement,
        SPGondoleElement,
        SPHeaderElement,
        SPImageElement,
        SPInfoBarElement,
        SPLinkElement,
        SPMainElement,
        SPMenuElement,
        SPMenuItemElement,
        SPNowPlayingElement,
        SPPlaylistElement,
        SPPlaylistContextElement,
        SPPopularityElement,
        SPResourceElement,
        SPSearchFormElement,
        SPSidebarElement,
        SPSidebarMenuElement,
        SPTabElement,
        SPTabBarElement,
        SPTabContentElement,
        SPTableElement,
        SPTableDataSource,
        SPTableDesigner,
        SPThemeEditorElement,
        SPTitleElement,
        SPToolbarElement,
        SPTrackContextElement,
        SPTrackTableDataSourceElement,
        SPTrackTableDesignerElement,
        SPViewElement,
        SPViewStackElement,
        Store,
        EventEmitter
    ) {
	return class SPChromeElement extends HTMLElement {
        attachedCallback() {

            this.appHeader = document.createElement('sp-appheader');
            this.appendChild(this.appHeader);
            this.infoBar = document.createElement('sp-infobar');
            this.appendChild(this.infoBar);
            this.main = document.createElement('main');
            this.appendChild(this.main);
            this.sidebar = document.createElement('sp-sidebar');
            this.main.appendChild(this.sidebar); 
            this.mainView = document.createElement('sp-main');
            this.main.appendChild(this.mainView);
            this.appFooter = document.createElement('sp-appfooter');
            this.appendChild(this.appFooter);
              
            this.rightSideBar = document.createElement('sp-rightsidebar');
    //        this.main.appendChild(this.rightSideBar);
            this.playlist = document.createElement('sp-trackcontext');
            this.rightSideBar.appendChild(this.playlist);
            this.playlist.uri = 'spotify:internal:library:track';
            
        }
        alert(obj) {
            this.infoBar.show();
            this.infoBar.setState(obj);
        }
    }
})