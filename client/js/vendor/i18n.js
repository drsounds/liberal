window.languages = {};

function i18_registerLang(lang) {
        var xmlHttpRequest = new XMLHttpRequest();
        xmlHttpRequest.open('GET', '/lang/' + lang + '.json', false);
        xmlHttpRequest.send(null);
        let data = JSON.parse(xmlHttpRequest.responseText);
        window.languages[lang] = data;
    
}
/*
var listeners = [], 
doc = win.document, 
MutationObserver = win.MutationObserver || win.WebKitMutationObserver,
observer;
// From http://ryanmorr.com/using-mutation-observers-to-watch-for-element-availability/
function createObserver(selector, fn) {
    // Store the selector and callback to be monitored
    listeners.push({
        selector: selector,
        fn: fn
    });
    if (!observer) {
        // Watch for changes in the document
        observer = new MutationObserver(check);
        observer.observe(doc.documentElement, {
            childList: true,
            subtree: true
        });
    }
    // Check if the element is currently in the DOM
    check();
}

window.addEventListener('load', (event) => {
    createObserver('*[data-bind-lang]', (event) => {
        // Check the DOM for elements matching a stored selector
        for (var i = 0, len = listeners.length, listener, elements; i < len; i++) {
            listener = listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
                element = elements[j];
                // Make sure the callback isn't invoked with the 
                // same element more than once
                if (!element.ready) {
                    element.ready = true;
                    // Invoke the callback with the element
                    listener.fn.call(element, element);
                }
                element.innerHTML = _(element.getAttribute('data-bind-lang'));
            }
        }

    })
})

*/

var lang = language = window.navigator.userLanguage || window.navigator.language;
function _(str) {
    let output = str;
    if (lang in window.languages) {
        
    } else {
        i18_registerLang(lang);
        
    }
    let dictionary = window.languages[lang];
    if (str in dictionary) {
        output = dictionary[str];
    } 
    output = sprintf.apply(this, [output].concat(Array.prototype.slice.call(arguments, 1)));
    return output;
}

window.addEventListener('load', (event) => {
    moment.locale(lang);
    setInterval(() => {
        let elms = document.querySelectorAll('*[data-str]');
        for (let i = 0; i < elms.length; i++) {
            let elm = elms[i];
            elm.innerHTML = _(elm.getAttribute('data-str'));
        }
    }, 100);
});