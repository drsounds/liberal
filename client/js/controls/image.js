define(function () {
	class SPImageElement extends HTMLElement {

        attachedCallback() {
            this.attributeChangedCallback('src', null, this.getAttribute('src'));
            this.addEventListener('click', (e) => {
               
            });
        }
        attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'src') {
                this.setState(newVal);
            }
        }
        setState(state) {
            if (state instanceof Object) {
                this.setState(state.uri);
                return;
            }
            this.style.backgroundImage = 'url(' + state + ')';
            this.style.width = this.getAttribute('width')  + 'px';
            this.style.height = this.getAttribute('height') + 'px';
        }
    }
    document.registerElement('sp-image', SPImageElement);
    return SPImageElement;
})