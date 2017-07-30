define(function () {
    class SPThemeEditorElement extends HTMLElement {
        attachedCallback() {
            if (!this.created) {
                this.colorChooser = document.createElement('input');
                this.colorChooser.setAttribute('type', 'range');
                this.innerHTML += '<label>' + _('Accent color') + '</label>';
                this.appendChild(this.colorChooser);
                this.colorChooser.setAttribute('max', 360);
                this.colorChooser.addEventListener('change', this.hueSlider);
                this.colorChooser.addEventListener('mousemove', this.hueSlider);
                this.saturationChooser = document.createElement('input');
                this.saturationChooser.setAttribute('type', 'range');
                this.label = document.createElement('label');
                this.label.innerHTML = _('Saturation');
                this.appendChild(this.saturationChooser);
                this.appendChild(this.label);
                this.saturationChooser.setAttribute('max', 360);
                this.saturationChooser.value = store.saturation;
                this.styleselect = document.createElement('select');
                this.styleselect.innerHTML += '<option value="bungalow">Bungalow</option><option value="maestro">Maestro</option><option value="obama">Obama</option><option value="obama-2010">Obama 2010</option><option value="obama-flat">Obama (flat)</option><option value="chromify">Chromify</option><option value="wmp_11">Windows Media Player 11</option><option value="wmp_11_beta">Windows Media Player 11</option><option value="wmp_10">Windows Media Player 10</option><option value="wmp_9">Windows Media Player 9</option>';
                this.appendChild(this.styleselect);
                this.flavorselect = document.createElement('select');
                this.flavorselect.innerHTML += '<option value="dark">' + _('Dark') + '</option><option value="light">' + _('Light') + '</option>';
                this.appendChild(this.flavorselect);
                this.saturationChooser.addEventListener('change', this.saturationSlider);
                this.saturationChooser.addEventListener('mousemove', this.saturationSlider);
                this.flavorselect.addEventListener('change', (e) => {
                    store.flavor = e.target.options[e.target.selectedIndex].value;
                });
                this.styleselect.addEventListener('change', (e) => {
                    store.stylesheet = e.target.options[e.target.selectedIndex].value;
                });
                this.created = true;

            }
        }
        hueSlider(e) {
            let value = e.target.value;
            store.hue = value;

        }
        saturationSlider(e) {
            let value = e.target.value;
            store.saturation = value;

        }
    }

    document.registerElement('sp-themeeditor', SPThemeEditorElement);
    return SPThemeEditorElement;
});