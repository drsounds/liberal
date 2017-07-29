define(function () {
    class SPAppFooterElement extends HTMLElement {
        attachedCallback() {
            if (!this.created) {
                this.previousButton = document.createElement('button');
                this.previousButton.classList.add('fa');
                this.previousButton.classList.add('fa-step-backward');
                this.appendChild(this.previousButton);
                this.previousButton.addEventListener('click', (e) => {
                    store.skipBack();
                })
                this.playButton = document.createElement('button');
                this.playButton.classList.add('fa');
                this.playButton.setAttribute('id', 'playButton');
                this.playButton.classList.add('fa-play');
                this.appendChild(this.playButton);
                this.playButton.addEventListener('click', (e) => {
                    store.playPause();
                })
                this.nextButton = document.createElement('button');
                this.nextButton.classList.add('fa');
                this.nextButton.classList.add('fa-step-forward');
                this.appendChild(this.nextButton);
                this.nextButton.addEventListener('click', (e) => {
                    store.skipNext();
                });
                this.playthumb = document.createElement('input');
                this.playthumb.setAttribute('type', 'range');
                this.playthumb.setAttribute('id', 'playthumb');
                this.playthumb.style.flex = '5';
                this.appendChild(this.playthumb);
                let btn = document.createElement('button');
                btn.classList.add('fa');
                btn.classList.add('fa-paint-brush');
                this.appendChild(btn);
                btn.style.cssFloat = 'right';
                btn.addEventListener('click', (e) => {
                   let hue = store.hue;
                   if (hue > 360) {
                       hue = 0;
                   }
                   hue += 2;
                   store.hue = hue;
                });
                this.created = true;
                store.on('change', (e) => {
                    let trackItems = document.querySelectorAll('.sp-track');
                    let playButton = document.querySelector('#playButton');
                    if (store.state.player && store.state.player.item) {
                        let playThumb = document.querySelector('#playthumb');
                        if (playThumb) {
                            playThumb.setAttribute('min', 0);
                            playThumb.setAttribute('max', store.state.player.item.duration_ms);
                            playThumb.value = (store.state.player.progress_ms);
                    
                        }
                    
                        playButton.classList.remove('fa-play');
                        playButton.classList.add('fa-pause');
                        let imageUrl = store.state.player.item.album.images[0].url;
                        let img = document.createElement('img');
                        img.crossOrigin = '';
                        img.src = imageUrl;
                        img.onload = function () {
                        
                            var vibrant = new Vibrant(img);
                            let color = vibrant.swatches()['Vibrant'];
                     //       document.documentElement.style.setProperty('--now-playing-accent-color', 'rgba(' + color.rgb[0] + ',' + color.rgb[1] + ',' + color.rgb[2] + ', 1)');
                        }
                        document.querySelector('sp-nowplaying').style.backgroundImage = 'url("' + store.state.player.item.album.images[0].url + '")';
                      
                        document.querySelector('sp-nowplaying').setAttribute('uri', store.state.context_uri);
                        for(var tr of trackItems) {
                            if (tr.getAttribute('data-uri') === store.state.player.item.uri) {
                                tr.classList.add('sp-current-track');
                                
                            } else {
                                tr.classList.remove('sp-current-track');
                            }
                        }
                    } else {
                        
                        playButton.classList.remove('fa-pause');
                        playButton.classList.add('fa-play');
                    } 
                });
            }
        }
    }


    window.alert = function (message) {
        document.querySelector('sp-chrome').alert({
            type: 'info',
            name: message,
            uri: 'bungalow:error:0x00'
        });
        let x = 0;/*
        var i = setInterval(() => {
            x++;
            $('sp-infobar').animate({
                opacity: 0.1
            }, 50, () => {
                 $('sp-infobar').animate({
                     opacity: 1
                 }, 50);
            });
            clearInterval(i);
            
        }, 100);*/
    }


    document.registerElement('sp-appfooter', SPAppFooterElement);
});