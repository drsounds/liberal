define(function () {
	class SPChromeElement extends HTMLElement { 
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


    GlobalViewStack = null;

    document.registerElement('sp-chrome', SPChromeElement);
    return SPChromeViewElement;
})