define(['controls/link'], function (SPLinkElement) {
    class SPMenuItemElement extends SPLinkElement {

        attributeChangedCallback(attr, oldVal, newVal) {

        }
    }

    document.registerElement('sp-menuitem', SPMenuItemElement);

    return SPMenuItemElement;
})