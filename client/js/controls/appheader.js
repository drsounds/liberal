define(function () {
    class SPAppHeaderElement extends HTMLElement {
        attachedCallback() {
            if (!this.created) {
                if (!this.searchForm) {
                    this.searchForm = document.createElement('sp-searchform');
                    if (localStorage.getItem("stylesheet") === 'maestro') {
                        document.body.appendChild(this.searchForm);
                    } else {
                        this.appendChild(this.searchForm);
                    }
                    this.searchForm.style.marginRight = '5pt';
                }
                this.loginButton = document.createElement('button');
                this.loginButton.innerHTML = _('Log in');
                this.loginButton.addEventListener('click', (e) => {
                    GlobalViewStack.navigate('bungalow:internal:login');
                });
                this.appendChild(this.loginButton);
                this.created = true;
            }
        }

    }
    document.registerElement('sp-appheader', SPAppHeaderElement);
    return SPAppHeaderElement;
});