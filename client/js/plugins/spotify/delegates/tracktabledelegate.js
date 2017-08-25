define(['controls/tabledelegate'], function (SPTableDelegate) {
    return class SPTrackTableDelegate extends SPTableDelegate {
        onItemDblClick(tr) {
            let id = tr.getAttribute('data-uri');
        }
    }
})