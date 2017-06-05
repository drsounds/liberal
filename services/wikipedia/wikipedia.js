var wikipedia = require("wikipedia-js");

function WikipediaService () {
    
}

/**
 * Get basic info for the certain term
 **/
WikipediaService.prototype.describe = function (query, lang) {
    return new Promise(function (resolve, reject) {
        if (!lang) lang = 'en';
        var options = {query: query, format: "html", summaryOnly: true, lang: lang};
        wikipedia.searchArticle(options, function(err, htmlWikiText){
            if(err){
              fail(err);
              return;
            }
            resolve(htmlWikiText);
        });
    });
};


module.exports = WikipediaService;