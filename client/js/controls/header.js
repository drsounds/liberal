define(['controls/resource'], function (SPResourceElement) {
	return class SPHeaderElement extends SPResourceElement {
        attachedCallback() {
            if (!this.created) {
            this.classList.add('header');
                window.GlobalTabBar.titleVisible  = false;
                this.parentNode.addEventListener('scroll', (e) => {
                    let headerBounds = this.getBoundingClientRect();
                    let viewBounds = this.parentNode.getBoundingClientRect();
                    window.GlobalTabBar.titleVisible = (headerBounds.top < viewBounds.top - (headerBounds.height * 0.5));
                    console.log(headerBounds.top, viewBounds.top)
                });
                this.tabBar = document.createElement('sp-tabbar');
                this.parentNode.appendChild(this.tabBar);
                this.created = true;
                let innerHTML = _.unescape(document.querySelector('#headerTemplate').innerHTML);
                let template = _.template(innerHTML);
                let width = getComputedStyle(document.body).getPropertyValue('--image-size');
                this.innerHTML = template({
                    object: object,
                    size: size,
                    width: width,
                    height: width,
                    title: titleElement.innerHTML,
                    strFollowers: strFollowers  
                });
            }
        }
        setState(object) {
            let size = this.getAttribute('size') || 128;
            let width = size;
            let height = size;  
            let titleElement = document.createElement('sp-title');
            titleElement.setState(object);
            object.image_url = object.images && object.images.length > 0 && object.images[0].url ? object.images[0].url : '';
            let strFollowers = '';
            if ('followers' in object) {
                strFollowers = numeral(object.followers.total).format('0,0') + ' followers';
            }
            let innerHTML = _.unescape(document.querySelector('#headerTemplate').innerHTML);
            let template = _.template(innerHTML);
            width = getComputedStyle(document.body).getPropertyValue('--image-size');
            this.innerHTML = template({
                object: object,
                size: size,
                width: width,
                height: width,
                title: titleElement.innerHTML,
                strFollowers: strFollowers  
            }); /* if ('followers' in object) {
                let pop = '';
                 if (object.popularity) {
                     pop = '<hr><h3>#' + numeral( TOTAL_ARTISTS_ON_SPOTIFY - (TOTAL_ARTISTS_ON_SPOTIFY * ((object.popularity) / 100))).format('0,0') + '</h3><br>' + _('In he world');
                }
                this.innerHTML += '<div style="flex: 0 0 50pt;"> <h3>' + numeral(object.followers.total).format('0,0') + '</h3><br> ' + _('followers') + '<br> ' + pop + ' </div>';
               
            } */
            this.object = object;
         
            this.vibrant();
        }
        vibrant() {
            if (localStorage.getItem('stylesheet') != 'maestro') return;
            let object = this.object;
            if (!this.object) return;
            
            if (object.images instanceof Array && object.images.length > 0) {
                let imageUrl = object.images[0].url;
                let img = document.createElement('img');
                img.crossOrigin = '';
                img.src = imageUrl;
                img.onload = () => {
                
                    var vibrant = new Vibrant(img);
                    let color = vibrant.swatches()['Vibrant'];
                    let bg = 'rgba(' + color.rgb[0] + ',' + color.rgb[1] + ',' + color.rgb[2] + ', 0.05)';
                    this.parentNode.style.backgroundColor = bg;
                    window.GlobalTabBar.style.backgroundColor = bg;
                    
                
                }
            }
        }
    }
})