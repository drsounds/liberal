define(
	[
		'liberal',
		'controls/view',
        'controls/header',
        'controls/table'
	],
	function (
		liberal,
		SPViewElement,
        SPHeaderElement
	) {



    class SPPodcastViewElement extends SPViewElement {
        attachedCallback() {
            if (!this.created) {
                this.created = true;

            }
        }
    }
	document.registerElement('sp-podcastview', SPPodcastViewElement);

    window.GlobalViewStack.registerView(/^bungalow:podcast:(.*)$/g, 'sp-podcastview');


    class RFPodcastEpisodeTableDataSource extends SPTableDataSource {
        constructor(url) {
            this.url = url;
        }
        async fetchNext() {
            fetch('/api/getPodcast?url=' + )
        }
    }

    return {
        SPPodcastViewElement: SPPodcastViewElement,
        RFPodcastEpisodeDataSource: RFPodcastEpisodeDataSource
    };

});