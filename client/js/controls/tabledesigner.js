define(function () {
	/**
     * Cretes a design for the table
     **/
    return class SPTableDesigner {
        getCellElementAt(columnIndex, row) {
            let td = document.createElement('td');
            return td;
        }
        getRowElement(row) {
            // Returns row at index
            let tr = document.createElement('tr');
            return tr;
        }
        getColumnElement(row, column) {
            let th = document.createElement('th');
            return th;
        }
    }
})