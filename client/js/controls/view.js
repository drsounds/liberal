define(function () {
	class SPViewElement extends HTMLElement {
        constructor() {
            super();
            this.scrollX = 0;
            this.scrollY = 0;
        }
        acceptsUri(uri) {
            return false;
        }
        activate() {
            this.scrollTop = (this.scrollY);
            if (this.header) {
                this.header.vibrant();
            }
        }
        
        _onScroll(e) {
            let view = e.target;
            view.scrollY = view.scrollTop;
        }
        navigate(uri) {
            
            
        }
        attachedCallback() {
            
            GlobalTabBar.setState({objects: []});
            this.addEventListener('scroll', this._onScroll);
        }
        disconnectedCallback() {
            this.removeEventListener('scroll', this._onScroll);
        }
        attributeChangedCallback(attr, oldValue, newVal) {
            
        }
    }

    document.registerElement('sp-view', SPViewElement);

    return SPViewElement;
})