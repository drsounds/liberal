define(function () {
    return class SPInfoBarElement extends HTMLElement {
        hide() {
            this.style.display = 'none';
        }
        show() {
            this.style.display = 'block';
        }
        setState(obj) {
            this.innerHTML = '';
            this.innerHTML = '<i class="fa fa-info"></i> ' + obj.name;
            this.closeButton = document.createElement('a');
            this.appendChild(this.closeButton);
            this.closeButton.classList.add('fa');
            this.closeButton.classList.add('fa-times');
            this.closeButton.style = 'float: right';
            this.closeButton.addEventListener('click', (e) => {
                this.hide();
            });
        }
    }
});