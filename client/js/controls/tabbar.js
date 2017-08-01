define(['controls/tab'], function (SPTabElement) {
	return class SPTabBarElement extends HTMLElement {
	    attachedCallback() {
	        if (!this.created) {
	            this.titleBar = document.createElement('div');
	            this.titleBar.style.visibility = 'hidden';
	            this.appendChild(this.titleBar);
	            this.created = true;
	            this.addEventListener('scroll', this._onScroll.bind(this));
	            this.style.display = 'none';

	        }

	    }
	    
	    _onScroll(e) {
	        let view = this.parentNode;
	        let viewBounds = view.getBoundingClientRect();
	        let bounds = this.getBoundingClientRect();
	        let tabBar = window.GlobalTabBar.getBoundingClientRect();
	        let headerHeight = 0;
	        if (this.header) {  
	            headerHeight = this.header.getBoundingClientRect().height;;
	        } 
	        console.log(bounds.top, viewBounds.top);
	        if (view.scrollTop > headerHeight ) {
	            view.style.display = 'block';
	            let transform = 'translateY(' + ( view.scrollTop - headerHeight) + 'px)';
	            this.thead.style.transform = transform; 
	        } else {
	            this.thead.style.transform = 'translateY(0px)';
	        }
	        let gondole = this.querySelector('sp-gondole');
	        if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height) {
	            if (!gondole.hasAttribute('activated'))
	            this.fetchNext();
	        }
	    
	    }
	    
	    get titleVisible() {
	        return this.titleBar.style.visibility == 'visible';
	    }
	    set titleVisible(val) {
	        this.titleBar.style.visibility = val ? 'visible': 'hidden';
	 
	    }
	    get title() {
	        return this.titleBar.innerHTML;
	    }
	    set title(val) {
	        this.titleBar.innerHTML = value;
	    }
	    setState(state) {
	        this.innerHTML = '';
	        this.titleBar = document.createElement('div');
	        this.titleBar.style.visibility = 'hidden';
	        this.titleBar.style.paddingRight = '113pt';
	        this.titleBar.style.paddingTop = '-12px';
	        //this.appendChild(this.titleBar);
	        if (state.object instanceof Object) {
	            if (state.object.images && state.object.images.length > 0) {
	                let image_url = state.object.images[0].url;
	                this.titleBar.innerHTML = '<img style="display: inline-block; float: left; margin-top: -3pt; margin-right: 10pt" src="' + image_url + '" width="24pt" height="24pt" />';
	            }
	            if (state.object.name != null) {
	                this.titleBar.innerHTML += '<span>'+ state.object.name + '</span>';
	                if (VERIFIED_PROFILES.filter((o) => (state.object.id === o)).length > 0) {
	                    this.titleBar.innerHTML += ' <i class="fa fa-check-circle new"></i>';
	                }
	                
	            }
	        }
	        if (state && state.objects instanceof Array && state.objects.length > 0) {
	            for (let i = 0; i < state.objects.length; i++) {
	                let obj = state.objects[i];
	                let tab = document.createElement('sp-tab');
	                tab.setAttribute('data-tab-id', obj.id);
	                
	                tab.innerHTML = obj.name;
	                tab.addEventListener('tabselected', (e) => {
	                    window.location.hash = '#' + e.data;
	                });
	                if (obj.id == window.location.hash.substr(1)) tab.classList.add('sp-tab-active');
	                this.appendChild(tab);
	                this.style.display = 'flex';
	            } 
	        } else {
	            this.style.display = 'none';
	        }
	    
	        
	        this.rightTitleBar = document.createElement('div');
	        this.rightTitleBar.innerHTML = '&nbsp;';
	        this.appendChild(this.rightTitleBar);
	    }
	}
})