requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js',  
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        plugins: '../plugins',
        services: 'services'
    }
});


const TOTAL_ARTISTS_ON_SPOTIFY = 2000000;
const VERIFIED_PROFILES = ['drsounds', 'alexanderforselius', 'daniel', 'spotify'];


requirejs(
    [
        'controls/about',
        'controls/appheader',
        'controls/appfooter',
        'controls/carousel',
        'controls/chrome',
        'controls/divider',
        'controls/gondole',
        'controls/header',
        'controls/image',
        'controls/infobar',
        'controls/link',
        'controls/main',
        'controls/menu',
        'controls/menuitem',
        'controls/nowplaying',
        'controls/playlist',
        'controls/playlistcontext',
        'controls/popularity',
        'controls/resource',
        'controls/searchform',
        'controls/sidebar',
        'controls/sidebarmenu',
        'controls/tab',
        'controls/tabbar',
        'controls/tabcontent',
        'controls/table',
        'controls/tabledatasource',
        'controls/tabledesigner',
        'controls/themeeditor',
        'controls/title',
        'controls/toolbar',
        'controls/trackcontext',
        'controls/tracktabledatasource',
        'controls/tracktabledesigner',
        'controls/view',
        'controls/viewstack',
        'store'
    ],
function (
    SPAboutElement,
    SPAppHeaderElement,
    SPAppFooterElement,
    SPCarouselElement,
    SPChromeElement,
    SPDividerElement,
    SPGondoleElement,
    SPHeaderElement,
    SPImageElement,
    SPInfoBarElement,
    SPLinkElement,
    SPMainElement,
    SPMenuElement,
    SPMenuItemElement,
    SPNowPlayingElement,
    SPPlaylistElement,
    SPPlaylistContextElement,
    SPPopularityElement,
    SPResourceElement,
    SPSearchFormElement,
    SPSidebarElement,
    SPSidebarMenuElement,
    SPTabElement,
    SPTabBarElement,
    SPTabContentElement,
    SPTableElement,
    SPTableDataSource,
    SPTableDesigner,
    SPThemeEditorElement,
    SPTitleElement,
    SPToolbarElement,
    SPTrackContextElement,
    SPTrackTableDataSourceElement,
    SPTrackTableDesignerElement,
    SPViewElement,
    SPViewStackElement,
    Store
) {


    function applyTheme(theme, flavor='light') {
        let link = document.querySelector('link[id="theme"]');
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('id', 'theme');
            document.head.appendChild(link);
            link.setAttribute('rel', 'stylesheet');
        }
        let link2 = document.querySelector('link[id="theme_variant"]');
        if (!link2) {
            link2 = document.createElement('link');
            link2.setAttribute('id', 'theme_variant');
            document.head.appendChild(link2);
            link2.setAttribute('rel', 'stylesheet');
        }
        link2.setAttribute('href', '/themes/' + theme + '/css/' + flavor + '.css');
        link.setAttribute('href', '/themes/' + theme + '/css/' + theme + '.css');
    }


    applyTheme('chromify', 'light');


    class MusicService {
        constructor() {
            this.state = {};
        }
        /**
         * Pause playback
         **/
        pause() {
            
        }
        
        /**
         * Play track
         * */
        play(track) {
            
        }
        
        /**
         * Look up track
         **/
        lookupTrack(name, version, artist, album) {
            
        }
        
    }







    var store = new Store();








    window.addEventListener('error', (e) => {
        
        
    });



    

    

    

    var GlobalTabBar = null;






    

    

    

    



    String.prototype.toQuerystring = function () {
        var args = this.substring(0).split('&');

        var argsParsed = {};

        var i, arg, kvp, key, value;

        for (i=0; i < args.length; i++) {

            arg = args[i];

            if (-1 === arg.indexOf('=')) {

                argsParsed[decodeURIComponent(arg).trim()] = true;
            }
            else {

                kvp = arg.split('=');

                key = decodeURIComponent(kvp[0]).trim();

                value = decodeURIComponent(kvp[1]).trim();

                argsParsed[key] = value;
            }
        }

        return argsParsed;
    }


    





    String.prototype.toHHMMSS = function () {
        var sec_num = parseInt(this, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);
        var strHours = hours, strMinutes = minutes, strSeconds = seconds;
        if (hours   < 10) {strHours   = "0"+hours;}
        if (minutes < 10) {strMinutes = "0"+minutes;}
        if (seconds < 10) {strSeconds = "0"+seconds;}
        return (hours > 0 ? strHours+':' : '') + strMinutes + ':' + strSeconds;
    }























        





    document.querySelector('.body').appendChild(document.createElement('sp-chrome'));

});