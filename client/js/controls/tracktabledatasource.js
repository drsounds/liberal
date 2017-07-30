define(['controls/tabledatasource'], function (SPTableDataSource) {
	return class SPTrackTableDataSource extends SPTableDataSource {
        constructor(uri, q, fields, limit = 28) {
            super();
            this.uri = uri;
            this.q = q;
            this.limit = limit;
            if (limit) {
                this.limitRows = true;
            }
            this.objects = [];
            this.offset = 1;
            this.fields = fields
        }
        async fetchNext() {

            let result = await store.request('GET', this.uri, {q: this.q, limit: this.limit, offset: this.offset});
            if ('objects' in result && result.objects instanceof Array)
            this.objects = result.objects;
            if (this.onchange instanceof Function) {
                this.onchange.call(this);
            }
        }
        getNumberOfRows(row) {
            if (!row) {
                if (this.table.maxRows > 0 && this.table.maxRows < this.objects.length)
                    return this.table.maxRows;
                return this.objects.length;
            }
        }
        getRowAt(index, row) {
            return this.objects[index];
        }
        get numberOfColumnHeaders () {
            return this.fields.length;
        }
        getColumnAt(pos) {
            return this.fields[pos];
        }
    }
})