define(['controls/viewstack'], function (SPViewStackElement) {
    class SPMainElement extends HTMLElement {
        attachedCallback() {
            if (!this.viewStack) {
                this.tabBar = document.createElement('sp-tabbar');
                this.appendChild(this.tabBar);
                GlobalTabBar = this.tabBar;
                this.viewStack = document.createElement('sp-viewstack');
                GlobalViewStack = this.viewStack;
                this.appendChild(this.viewStack);


            }
        }
    }
    document.registerElement('sp-main', SPMainElement);
})