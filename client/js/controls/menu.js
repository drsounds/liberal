define(function () {
    return class SPMenuElement extends HTMLElement {
        async attachedCallback() {



        }
        setState(state) {
            this.state = state;
            this.render();
        }
        render() {
            this.innerHTML = '';
            if (this.state && this.state.objects instanceof Array)
                this.state.objects.map((item) => {
                    if (!item) {
                        this.appendChild(document.createElement('br'));
                        return;
                    }
                    let menuItem = document.createElement('sp-menuitem');
                    this.appendChild(menuItem);
                    /*let updated = moment(item.updated_at);
                     let now = moment();
                     let range = Math.abs(now.diff(updated, 'days'));
                     if (range < 1) {
                     menuItem.innerHTML = '<i class="fa fa-circle new"></i>';
                     }*/
                    menuItem.innerHTML += '<span>' + item.name + '</span>';
                    menuItem.setAttribute('uri', item.uri);
                });
        }

    }
})