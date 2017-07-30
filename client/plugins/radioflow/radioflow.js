define(
	[
		'liberal',
		'controls/view'
	],
	function (
		liberal,
		SPViewElement
	) {
    class SPPodcastViewElement extends SPViewElement {
        attachedCallback() {
            if (!this.created) {
                this.created = true;

            }
        }
    }
	document.registerElement('sp-podcastview', SPPodcastViewElement);


    class RadioflowTableDataSource extends SPTableDataSource {
        constructor() {

        }
        getNumberOfRows(row) {
            if (!row) {
                return
            }
        }
    }

});