define(['controls/view'], function (SPViewElement) {
    class SPStartViewElement extends SPViewElement {
        acceptsUri(uri) {
            return uri === 'bungalow:internal:start';
        }
        navigate() {

        }
        attachedCallback() {
            this.classList.add('container');
            this.innerHTML = '<h3>Start</h3>';
            this.innerHTML += '<sp-divider>Featured</sp-divider>';
            this.innerHTML += '<sp-carousel uri="bungalow:me:playlist"></sp-carousel>';
        }
    }
    document.registerElement('sp-startview', SPStartViewElement);
    return SPStartViewElement;
});