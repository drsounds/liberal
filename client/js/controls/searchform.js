define(function () {
    class SPSearchFormElement extends HTMLFormElement {

        attachedCallback() {
            if (!this.created) {
                this.innerHTML = '<button id="btnBack" class="fa fa-arrow-left" onclick="history.back()"><button class="fa fa-arrow-right" onclick="history.forward()"></button><div style="flex: 5"></div>';

                this.form = document.createElement('form');
                this.form.setAttribute('action', '/');
                this.form.setAttribute('method', 'GET');
                this.appendChild(this.form);
                this.form.addEventListener('submit', (event) => {
                    let query = this.searchTextBox.value;
                    GlobalViewStack.navigate(query);
                    event.preventDefault();
                })
                this.searchTextBox = document.createElement('input');
                this.searchTextBox.setAttribute('type', 'search');
                this.searchTextBox.setAttribute('placeholder', 'search');
                this.form.appendChild(this.searchTextBox);
                this.btnSubmit = document.createElement('button');
                this.btnSubmit.setAttribute('type', 'submit');
                this.btnSubmit.style.display = 'none';
                this.form.appendChild(this.btnSubmit);
                this.created = true;

            }

        }
    }

    document.registerElement('sp-searchform', SPSearchFormElement);
    return SPSearchFormElement;
})