define(function () {
	class SPToolbarElement extends HTMLElement {
        attachedCallback () {
            this.innerHTML = '<button class="primary"><i class="fa fa-play"></i> ' + _('Play') + '</button>&nbsp;';
            this.innerHTML += '<button>...</button>';
        }
    }

    document.registerElement('sp-toolbar', SPToolbarElement);
    return SPToolbarElement;
})