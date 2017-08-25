define(['controls/viewstack'], function (SPViewStackElement) {
    return class SPMainElement extends HTMLElement {
        attachedCallback() {
            if (!this.viewStack) {
                this.tabBar = document.createElement('sp-tabbar');
                this.appendChild(this.tabBar);
                window.GlobalTabBar = this.tabBar;
                this.viewStack = document.createElement('sp-viewstack');
                window.GlobalViewStack = this.viewStack;
                this.appendChild(this.viewStack);


            }
        }
    }
})