define(['controls/resource'], function (SPResourceElement) {
    return class SPCarouselElement extends SPResourceElement {
        attachedCallback() {
            this.style.position = 'relative';
        }
        setState(object) {
            this.innerHTML = '';
            for (let i = 0; i < object.objects.length; i++) {
                let obj = object.objects[i];
                let inlay = document.createElement('div');
                inlay.style.backgroundImge = 'url("' + obj.images[0].url + '")';
                this.appendChild(inlay);
            }
            $(this).slick();
        }
    }
});