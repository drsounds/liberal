define(function () {

    /**
     * Popularity bar
     */
    class SPPopularityBarElement extends HTMLElement {
        createdCallback() {
            
        }
        attachedCallback() {
            this.canvas = document.createElement('canvas');
            this.appendChild(this.canvas);
            this.node = this.canvas;
            this.BAR_WIDTH = 2 * 5;
            this.BAR_HEIGHT = 2 * 109;
            this.SPACE = 8;
            this.popularity = 0.0;
            this.height = 7;
            this.width = 3;
            
            this.node.style.width = '60px';
            this.node.style.height = '7px';
            this.style.padding = '0px';
            this.attributeChangedCallback('value', 0, !isNaN(this.getAttribute('value')) || 0);
        }
        attributeChangedCallback(attrName, oldVal, newVal) {
            if (attrName === 'value') {
                this.setState(newVal);
            }
        }
        setState(value) {

            this.style.backgroundColor = 'transparent';
            var ctx = this.node.getContext('2d');
            // draw dark bars
            ctx.fillStyle = this.style.backgroundColor;
            ctx.fillRect(0, 0, this.node.width, this.node.height);
            let fillStyle = rgbToRgba(window.getComputedStyle(this).getPropertyValue('color'), 0.5);
            ctx.fillStyle = fillStyle;
            var totalPigs = 0
            for (var i = 0; i < this.node.width; i+= this.BAR_WIDTH + this.SPACE) {
                ctx.fillRect(i, 0, this.BAR_WIDTH, this.BAR_HEIGHT);
                totalPigs++;
            }
            ctx.fillStyle = window.getComputedStyle(this.parentNode).color;
            var lightPigs = value * totalPigs;
            var left = 0;
            for (var i = 0; i < lightPigs; i++) {
                ctx.fillRect(left, 0, this.BAR_WIDTH, this.BAR_HEIGHT);
                left += this.BAR_WIDTH + this.SPACE;
            }
        }

    }

    document.registerElement('sp-popularitybar', SPPopularityBarElement);
    return SPPopularityBarElement;
})