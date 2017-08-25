define([
    'plugins/spotify/views/playqueue', 
    'plugins/spotify/views/playlist',
    'plugins/spotify/views/artist',
    'plugins/spotify/views/album',
    'plugins/spotify/views/label',
    'plugins/spotify/views/user',
    'plugins/spotify/views/country',
    'plugins/spotify/views/genre',
    'plugins/spotify/views/curator',
    'plugins/spotify/views/audiobook'
    ], function (
        SPPlayQueueViewElement,
        SPPlaylistViewElement,
        SPArtistViewElement,
        SPAlbumViewElement,
        SPLabelViewElement,
        SPUserViewElement,
        SPCountryViewElement,
        SPGenreViewElement,
        SPCuratorViewElement,
        SPAudioBookViewElement
        ) {
    
        document.registerElement('sp-playqueueview', SPPlayQueueViewElement);
        document.registerElement('sp-playlistview', SPPlaylistViewElement);
        document.registerElement('sp-artistview', SPArtistViewElement);
        document.registerElement('sp-albumview', SPAlbumViewElement);
        document.registerElement('sp-labelview', SPLabelViewElement);
        document.registerElement('sp-userview', SPUserViewElement);
        document.registerElement('sp-countryview', SPCountryViewElement);
        document.registerElement('sp-genreview', SPGenreViewElement);
        document.registerElement('sp-curatorview', SPCuratorViewElement);
        document.registerElement('sp-audiobookview', SPAudioBookViewElement);
        document.addEventListener('viewstackloaded', () => {
            GlobalViewStack.registeredViews.push({
                tag: 'sp-startview',
                regex: /^bungalow:internal:start$/g
            });
            GlobalViewStack.registeredViews.push({
                tag: 'sp-playlistview',
                regex: /^bungalow:user:([0-9a-zA-Z]+):playlist:([0-9a-zA-Z]+)$/g
            });
            GlobalViewStack.registeredViews.push({
                tag: 'sp-playqueueview',
                regex: /^bungalow:internal:playqueue$/g
            });
             GlobalViewStack.registeredViews.push({
                tag: 'sp-artistview',
                regex: /^bungalow:artist:([0-9a-zA-Z]+)$/g
            });
            GlobalViewStack.registeredViews.push({
                tag: 'sp-albumview',
                regex: /^bungalow:album:([0-9a-zA-Z]+)$/g
            });
             GlobalViewStack.registeredViews.push({
                tag: 'sp-labelview',
                regex: /^bungalow:label:([0-9a-zA-Z]+)$/g
            });
             GlobalViewStack.registeredViews.push({
                tag: 'sp-userview',
                regex: /^bungalow:user:([0-9a-zA-Z]+)$/g
            });
            GlobalViewStack.registeredViews.push({
                tag: 'sp-countryview',
                regex: /^bungalow:country:([0-9a-zA-Z]+)$/g
            });
             GlobalViewStack.registeredViews.push({
                tag: 'sp-genreview',
                regex: /^bungalow:genre:([0-9a-zA-Z]+)$/g
            });
             GlobalViewStack.registeredViews.push({
                tag: 'sp-curatorview',
                regex: /^bungalow:curator:([0-9a-zA-Z]+)$/g
            });
             GlobalViewStack.registeredViews.push({
                tag: 'sp-audiobookview',
                regex: /^bungalow:book:([0-9a-zA-Z]+):audio$/g
            });
        });
})