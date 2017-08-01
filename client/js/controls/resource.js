define(function () {
	return class SPResourceElement extends HTMLElement {
        async attributeChangedCallback(attrName, oldVal, newVal) {
            if (!newVal) return;
            if (attrName === 'uri') {
                let state = null;
                if (newVal in store.state) {
                    state = store.state[newVal];
                    this.setState(state);
                    return;
                }
                state = await store.request('GET', newVal);
                this.setState(state);
            }
        }
        vibrance() {
            let img = document.createElement('img');
            img.crossOrigin = '';
            img.src = this.object.images[0].url;
            img.onload = () => {
            
                var vibrant = new Vibrant(img);
                let color = vibrant.swatches()['Vibrant'];
                let light = vibrant.swatches()['LightVibrant'];
                let muted = vibrant.swatches()['Muted'];
                
                let bgColor = swatchToColor(color);
                
            //    this.view.style.backgroundColor = bgColor;
                let background = 'linear-gradient(-90deg, ' + swatchToColor(color) + ', ' + swatchToColor(muted) + ')';
                this.view.style.background = background;
            }
        }
        setState(obj) {
            this.obj = obj;
            this.innerHTML = '<sp-link uri="' + obj.uri + '">' + obj.name + '</sp-link>';
        }
    }
})