define(function () {
	return class SPImageElement extends HTMLElement {

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
            if (attrName === 'width') {
            this.style.width = newVal;
                
            }
            if (attrName === 'height') {
            this.style.height = newVal;
                
            }
        }
        setState(state) {
            if (state instanceof Object) {
                this.setState(state.uri);
                return;
            }
            this.style.backgroundImage = 'url(' + state + ')';
            this.style.width = this.getAttribute('width') ;
            this.style.height = this.getAttribute('height');
        }
    }
})