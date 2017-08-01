define(function () {
	/**
     * Table element
     **/
    return class SPTableElement extends HTMLElement {
        get fields () {

            let _fields = this.getAttribute('fields');
            if (!_fields) {
                _fields = 'name,artists,album';
            }
            return _fields.split(',');
        }
        set fields(value) {
            this.setAttribute('fields', value.join(','));
        }
        constructor() {
            super();
            this._dataSource = null;
            this._designer = null;
            this._selectedIndicies = [];
        }
        get selectedIndicies() {
            return this._selectedIndicies;
        }
        get selectedObjects() {
            return this.selectedIndicies.map((i) => {
                return this.dataSource.getRowAt(i);
            });
        }
        set selectedIndicies(value) {
            this._selectedIndicies = value;

            let trs = document.querySelectorAll('tr');
            for (let i = 0; i < trs.length; i++) {
                trs[i].classList.remove('sp-track-selected');
            }
            this._selectedIndicies.map((i) => {
                this.querySelector('tr[data-index="' + i + '"]').classList.add('sp-track-selected');
            });
        }
        fetchNext() {
            this.dataSource.fetchNext();
        }
        get dataSource() {
            return this._dataSource;
        }
        set dataSource(value) {
            this._dataSource = value;
            this._dataSource.table = this;
            this._dataSource.onchange = (e) => {
                this.render();
                let firstRow = this.querySelector('tr');
               /* if (firstRow) {
                    let th = this.querySelector('th');
                    let size = (firstRow.getBoundingClientRect().height * 2) + 'pt ' + (firstRow.cells[0].getBoundingClientRect().height * 1.5) + 'pt';
                    this.parentNode.style.backgroundSize =  size;
                    let tablestart = th.getBoundingClientRect().top + th.getBoundingClientRect().height;
                    this.parentNode.style.backgroundPosition = '0pt ' +  (tablestart) +  'pt';
                    debugger;
                }*/

            }
        }
        get designer() {
            return this._designer;
        }
        set designer(value) {
            this._designer = value;
            this._designer.table = this;
        }
        createdCallback() {
            console.log("T");
            if (!this.created) {  
                this.table = document.createElement('table');
                this.table.thead = document.createElement('thead');
                this.table.thead.tr = document.createElement('tr');
                this.table.thead.appendChild(this.table.thead.tr);
                this.table.appendChild(this.table.thead);
                this.table.tbody = document.createElement('tbody');
                this.table.appendChild(this.table.tbody);
                this.appendChild(this.table);
                this.created = true;

            }
        }   
        attachedCallback() {

                this.parentNode.classList.add('table-background');

        }

        activate() {
            // this.checkState();
        }

        get limit() {
            if (!this.hasAttribute('limit')) return 30;
            return parseInt(this.getAttribute('limit'));
        }

        set limit(value) {
                this.setAttribute('limit', value);
        }

        get offset() {
            if (!this.hasAttribute('offset')) return 0;
                return parseInt(this.getAttribute('offset'));
        }

        get uri() {
            return this.getAttribute('uri');
        }

        set uri(value) {
            this.setAttribute('uri', value);
        }
        set offset(value) {
            this.setAttribute('offset', value);
        }
        get query() {
            return this.getAttribute('query');
        }
        set query(value) {
            this.setAttribute('query', value);
        }
        set header(val) {
            this._header = val;
        }
        get header() {
            return this._header;
        }
        get view() {
            return this._view;
        }
        set view(val) {
            
            this._view = val;
            this._view.classList.add('zebra');

            this._view.addEventListener('scroll', this._onScroll.bind(this));
        }
        _onScroll(e) {
            let view = e.target;
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
                this.table.thead.style.transform = transform; 
            } else {
                this.table.thead.style.transform = 'translateY(0px)';
            }
            let gondole = this.querySelector('sp-gondole');
            if (gondole && gondole.getBoundingClientRect().top < viewBounds.top + viewBounds.height) {
                if (!gondole.hasAttribute('activated'))
                this.fetchNext();
            }
        
        }
        render() {
            if (this._designer == null) throw "No designer set";
            if (this._dataSource == null) throw "Missing data source";
            this.table.tbody.innerHTML = '';
            this.table.thead.innerHTML = '';
            this.table.thead.tr = this.designer.getHeaderRow(); 
            this.table.thead.appendChild(this.table.thead.tr);
             for (let i = 0; i < this.dataSource.getNumberOfRows(); i++) {
                
                let row = this.dataSource.getRowAt(i);
                let tr = this.designer.getRowElement(row);
                tr.setAttribute('data-id', row.id);
                for (let j = 0; j < this.dataSource.numberOfColumnHeaders; j++) {
                    let td = this.designer.getCellElement(j, row);
                    if (!td) continue;
                    tr.appendChild(td);
                    tr.dataset.index = i;
                    td.addEventListener('mousedown', (e) => {
                        this.selectedIndicies = [e.target.parentNode.dataset.index];
                    })
                }

                this.table.tbody.appendChild(tr);
                let numberOfChildren = this.dataSource.getNumberOfChildren(row);
                for (let c = 0; c < numberOfChildren; c++) {
                    
                    let child = this.dataSource.getRowAt(c, row);
                    let tr2 = this.designer.getRowElement(child);
                    tr2.setAttribute('data-parent-id', row.id);

                    tr2.setAttribute('data-parent-index', i);

                    for (let j = 0; j < this.dataSource.numberOfColumnHeaders; j++) {
                        let td = this.designer.getCellElement(j, child);
                        tr2.appendChild(td);
                        tr2.dataset.index = i;
                        td.addEventListener('mousedown', (e) => {
                            this.selectedIndicies = [e.target.parentNode.dataset.index];
                        })

                    }
                    tr2.style.display = 'none';
                    this.table.tbody.appendChild(tr2);

                }
                if (numberOfChildren > 0 && numberOfChildren % 2 == 1) {
                    let trf = document.createElement('tr');
                    this.table.tbody.appendChild(trf);
                }
                if (i == this.dataSource.getNumberOfRows() - 1) {
                    let rect = tr.getBoundingClientRect();
                    this.view.style.backgroundPosition = "0pt " + (rect.top + rect.height + (i % 2 == 0 ? rect.height : 0) + (this.header.getBoundingClientRect().top)) + 'pt';  
                }
            }
            for (let j = 0; j < this.dataSource.numberOfColumnHeaders; j++) {
                let th = this.designer.getColumnElementAt(j);
                this.table.thead.tr.appendChild(th);
            }
        }
    }
})