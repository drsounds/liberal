define(function () {
    return class SPTableDataSource {
        get numberOfRows () {
            return 0;
        }
        get numberOfColumnHeaders () {
            return 0;
        }
        getRowAt(rowId, row) {
            throw "NotImplementedException"
        }
        getColumnAt(pos) {
            throw "NotImplementedException"
        }
        getNumberOfChildren(row) {
            return 0;
        }
        getChildRowAt(parentRowId, rowId) {
            return null;
        }
        /**
         * Fetch next rows
         **/
        fetchNext() {
            // TODO Implement fetch next
        }
    }
})