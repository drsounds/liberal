var played_episodes = '';
class Channel extends EventEmitter {
    constructor (channel, mashcast) {
        // // console.log(arguments);
        this.podcasts = [];
        this.name = channel.name;
        this.id = channel.id;
        this.mashcast = mashcast;
        this.data = channel;
        this.status = READY;
         for (var i = 0; i < channel.podcasts.length; i++) {
            var podcast = new Podcast(channel.podcasts[i], this, this.mashcast);
            // // console.log("Podacst", podcast);
            this.podcasts.push(podcast);
            
         }

    };



    /***
     * Check for new episodes
     **/
    checkForNewEpisodes () {
    	// console.log(this.podcasts);
        for (var i = 0; i < this.podcasts.length; i++) {
        	// console.log("T");
            this.podcasts[i].checkForNewEpisodes();
        }
    }

    /**
     *Activates the channel
     * @function
     * @this {Channel} 
     */
    start () {
        // // console.log("Starting channel");
        // // console.log("CHANNEL", this);
        // // console.log(this.podcasts);
        for (var i = 0; i < this.podcasts.length; i++) {
            var podcast = this.podcasts[i];
            // // console.log(podcast);
            podcast.start();
        }
        this.status = PLAYING;
        this.emit('activeChannelAdded', this);
    }
    
    /**
     * Turns of the channel 
     */
    stop () {
        for (var i = 0; i < this.podcasts.length; i++) {
            var podcast = this.podcasts[i];
            podcast.stop();
        }
        this.status = READY;
        this.emit('activeChannelRemoved', this);
    }
    /*
     * Register a podcast channel into the system
     * @param {Podcast} podcast The podcast to register
     */
    registerPodcast (podcast) {
        this.podcasts.push(podcast);
        var self = this;
        podcast.on('newepisode', (event) => {
            this.mashcast.enqueueEpisode(event.data.episode);
        });
    }
    
    /**
     * Unregister a podcast from the system
     * @method
     * @this {Mashcast}
     * @param {Podcast} podcast The podcast to unregister 
     */
    unregisterPodcast (podcast) {
        this.podcasts.splice(this.podcasts.indexOf(podcast), 1);
    };
}
   
 

class Episode extends EventEmitter {
/***
     * Episode
     * @function
     * @constructor
     * @class
     * @param {String} url The url
     * @param {Mashcast} mashcast The instance of the mashcast object 
     */
    constructor (episode, mashcast) {
        this.url = episode.url;
        this.title = episode.title;
        this.mashcast = mashcast;
    };
    
    /**
     * Starts playing the episode 
     */
    play  () {
        // // console.log(this.url);
        // Play the episode
        this.mashcast.playEpisode(this); // Request mashcast to play the programme
        this.emit('episodestarted', {
            data: {
                episode: this
            }
        });
    };
    
     /**
     * Starts playing the episode 
     */
    stop () {
        // Play the episode
        this.mashcast.stopEpisode(this); // Request mashcast to play the programme
        this.emit('episodeended', {
            data: {
                episode: this
            }
        });
    };
    
    
    
}
    
    
    
function diff(x, y) {
    return x - y ? x - y : y - x;
}
/**
 * Podcast
 * @class
 * @this {Podcast}
 * @constructor
 * @param {String} url The url to the podcast 
 */
class Podcast extends EventEmitter {
    constructor (podcast, channel, mashcast) {
        this.url = podcast.url;
        this.name = podcast.name;
        this.channel = channel;
        
        this.ticker = null;
        this.mashcast = mashcast;
        // // console.log(mashcast);
    }
     /**
     * Returns the id of the last peisode for a given podcast with the url
     * @this {Podcast}
     * @function
     * @return {String|null} A string if found, otherwise null.
     */
    getLatestEpisode () {
        return localSettings.getItem('mashcast:podcast:' + this.url + ':episode', null);
    }
    
    /**
     * Returns the id of the last peisode for a given podcast with the url
     * @this {Podcast}
     * @function
     * @return {String|null} A string if found, otherwise null.
     */
    setLatestEpisode (episode) {
        return localSettings.setItem('mashcast:podcast:' + this.url + ':episode', episode);
    }
    
    /**
     *Unset latest episode 
     */
    unsetLatestEpisode  (episode) {
        return localSettings.setItem('mashcast:podcast:' + this.url + ':episode', null);
    }
    
    /**
     * Check for updates
     * @this {Podcast}
     * @param {Object} url
     * 
     */
    checkForNewEpisodes () {
        // // console.log("Checking for new episodes");
        var self = this;
       // We don't need CORS header since this will be run inside
    	// a CEF-based app.
        try {
	        var xmlHttp = new XMLHttpRequest();
	        var url = this.url;
	        // console.log(url);
	        var self = this;
            if (podcast.stream_url !== '') {
                // Check schedule
                fetch(podcast.schedule_url).then((result) => result.json()).then((data) => {
                  $.each(data.schedule, function (episode) {
                    var start = new Date(episode.start);
                    var end = new Date(start.getTime() + episode.duration * 1000);
                    var now = new Date();
                    var offset = now.getTime() - start;
                    if (now.getTime() > start && now.getTime() < end) {
                      this.emit('newepisode', {
                        episode: new Episode({
                            url:episode.stream_url,
                            duration: episode.duration - offset
                        })
                      });
                    }
                  });
                });
                return;
            }
	        // this.unsetLatestEpisode(url);
            fetch('/api/rss/?url=' + encodeURI(url)).then((result) => result.body()).then((result) => {
            	// console.log(xmlHttp.readyState);
      
                // // console.log("Got data");
                // // console.log(xmlHttp);
              
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(result, "text/xml");
            
                // console.log(xmlDoc);
                if (xmlDoc != null) {
                    // // console.log(url);
                   console.log(xmlDoc.responseXML);
                   // console.log("TG"); 
                    var latestEpisode = xmlDoc.getElementsByTagName('item')[0];
                    if (!latestEpisode) 
                    {
                       	// console.log("Error");
                       	
                        return;
                    }
                    var items = xmlDoc.getElementsByTagName('item');
                    for (var i = items.length - 1; i >= 0; i--) {
                        var episode = items[i];
                        var pubDate = episode.getElementsByTagName('pubDate')[0].textContent;
                        pubDate = new Date(pubDate);
                        var now = mashcast.date != null ? mashcast.date : new Date();
                        // // console.log(now);
                        var delta = diff(now.getTime(), pubDate.getTime() );
                    
                        // // console.log("Difference", delta, pubDate);
                       
                        
                        var url = episode.getElementsByTagName("enclosure")[0].getAttribute('url');
                        // // console.log("Has new episodes", self.getLatestEpisode() != url);
                        if (delta > -1 && delta < 1000 * 60 * 60 * 2 && played_episodes.indexOf(url) < 0) {
                            //if (self.getLatestEpisode() == url) {
                             //   continue;
                            //}
                            // console.log("GT");
                            mashcast.date = null;
                            // // console.log("New episode found");
                            // // console.log(self.mashcast);
                            self.emit('newepisode', {
                                    episode: new Episode({
                                        url:url,
                                      duration: null
                                    })
                                
                            });
                            played_episodes += url + ';';
                            
                            self.setLatestEpisode(url);
                            break;
                        }
                        // We use local storage to check for enw 
                        
                    }
                  // resolve(url);
            
                }
            });
	      
        } catch (e) {
        	// console.log(e.stack);
        }
            
    }
    
    start () {
        this.ticker = setInterval(() => {
            // // console.log("Checking channel");
            this.checkForNewEpisodes();
        }, 60000);
        setTimeout(() => {
            // // console.log("Checking channel");
            this.checkForNewEpisodes();
        }, 1000);
    }
    stop () {
        clearInterval(this.ticker);
    }
    
}


class Mashcast extends EventEmitter {
    constructor() {
        var strPodcasts = localSettings.getItem('podcasts');
        try {
          this.podcasts = JSON.parse(strPodcasts);
          if (this.podcasts === null) {
            this.podcasts = [];
          }
        } catch (e) {
          this.podcasts = [];
        }
        this.broadcasts = []; 
        console.log("f", this.podcasts);
        this.date = null;
        this.audioApp = audioApp;
        this.channels = [];
        this.pendingEpisodes = [];
        this.episodes = [];
        this.episode = null;
        this.channel = null;
        this.playing = false;
        this.status = READY;

        var self = this;
        window.onmediaended = () => {
          if (self.episodes.length < 1)
            this.stopEpisode();
            this.episodes = []; // TODO Empty the qeue for now
        }
        this.on('mediaended', function () {
          console.log("EVENT");
          mashcast.stopEpisode();
          self.episodes = []; // TODO Empty the qeue for now
          self.playing = false;
          
        });
        this.volume = 50;
        
        this.tickert = setInterval(function () {
            if (self.playing) {
                return;
            }
            var episode = self.episodes.shift();
            if (episode != null) {
              if (!self.playing)
                self.play(episode);
              if (!isNaN(episode.duration)) {
                setTimeout(function () {
                  document.querySelector('audio').stop();
                  mashcast.stopEpisode();
                  self.episodes = [];

                }, episode.duration);
              }
            }
        }, 1000);
        this.on('newepisode', (e, evt, data) => {
            var episode = data.episode;
            // // console.log("Episode", episode);
            if (self.episodes.length == 0 && !self.playing) // TODO Queue doesn't work empty it
            self.episodes.push(episode);
        });



    }

    hasPodcast (podcast) {
      // console.log("podcasts", this.podcasts);
      this.podcasts = [];
      try {
        this.podcasts = JSON.parse(localSettings.getItem('podcasts'));
        if (this.podcasts === null) {
            this.podcasts = [];
          }
      } catch (e) {

      }
        var podcasts = this.podcasts.filter((object) => {
          // console.log(podcast, "Podcast");
           // console.log(podcast, object);
            return object && object.url === podcast.url || object.url == podcast;
        });
        // console.log("Has podcasts", podcast, podcasts);
      //  console.log("podcasts", podcasts);
        return podcasts.length > 0;
    }

   addPodcast(podcast) {
        this.podcasts.push(podcast);
        console.log(this.podcasts);
        localSettings.setItem('podcasts', JSON.stringify(this.podcasts));
    }

    removePodcast (podcast) {
        podcast = this.podcasts.filter(function (a) {
          return podcast.id == a.id;
        })[0]
        this.podcasts.splice(this.podcasts.indexOf(podcast), 1);
        localSettings.setItem('podcasts', JSON.stringify(this.podcasts));
    }

    /**
     * Returns the id of the last peisode for a given podcast with the url
     * @this {Podcast}
     * @function
     * @return {String|null} A string if found, otherwise null.
     */
    setLatestEpisode (episode) {
        return localSettings.setItem('mashcast:podcast:' + this.url + ':episode', episode);
    }
    

    start() {
        // // console.log(this);
        // // console.log("Starting channel");
        var self = this;
        this.ticker = setInterval(function () {
            // // console.log("Checking channel");
            self.checkForNewEpisodes();
        }, 60000);

            self.checkForNewEpisodes();
    }



    stop () {
        clearInterval(this.ticker);
    }


    checkForNewEpisodes () {
        // // console.log("Checking for new episodes");
        var self = this;
       // We don't need CORS header since this will be run inside
        // a CEF-based app.
        console.log("Checking for new episodes");
        this.podcasts.forEach(function (podcast) {
            var url = podcast.url;
            if (podcast.schedule_url !== '' && podcast.schedule_url !== null && typeof(podcast.schedule_url) !== 'undefined') {
              console.log("Checking", podcast.schedule_url);
              // Check schedule
              fetch('/json.php?url=' + encodeURI(podcast.schedule_url)).then((response) => response.json()).then((data) => {
                console.log("Got schedule URL");
                data.schedule.map((episode, i) => {
                  try {
                    console.log("episode.start", episode.start);
                    var start = new Date(Date.parse(episode.start));
                    console.log(episode.duration);
                    console.log(start);
                    var end = new Date(start.getTime() + episode.duration * 1000);
    
                    var now = new Date();
                    var offset = now.getTime() - start.getTime();
                    console.log("Checking programme ", episode);
                    var d = now.getTime() > start && now.getTime() < end.getTime();
                    console.log(now.getTime() - start);
                    console.log("in program", d);
                    console.log("start", start);
                    console.log("end", end);
                    console.log("now", now);
                    if (d) {
                      console.log("Dispatch live episode", episode);
                      this.emit('newepisode', {
                        episode: new Episode({
                            url:episode.schedule_url,
                            duration: (episode.duration - offset)
                        })
                      });
                    }
                  } catch (e) {
                      console.log(e, e.stack);
                  }
                });
                }).fail(function (e) {
                console.log(e)
                });
                return;
            }
            fetch('/rss.php?url=' + encodeURI(url)).then((result) => result.body()).then((result) => {
            // console.log(xmlHttp.readyState);
               // console.log(xmlHttp.status);
              // // console.log("Connection start")
              // // console.log(xmlHttp);
              var xmlDoc = null;
              // console.log(xmlHttp.responseText);
              if (xmlHttp.responseXML != null) {
                  xmlDoc = xmlHttp.responseXML;
              } else {
                  var parser = new DOMParser();
                  xmlDoc = parser.parseFromString(xmlHttp.responseText, "text/xml");
                  
              }
              
              if (xmlDoc != null) {
                  // // console.log(url);
                 // console.log("TG"); 
                  var latestEpisode = xmlDoc.getElementsByTagName('item')[0];
                  if (!latestEpisode) 
                  {
                      // console.log("Error");
                      
                      return;
                  }
                  var items = xmlDoc.getElementsByTagName('item');
                  for (var i = items.length - 1; i >= 0; i--) {
                      var episode = items[i];
                      var pubDate = episode.getElementsByTagName('pubDate')[0].textContent;
                      pubDate = new Date(pubDate);
                      var now = mashcast.date != null ? mashcast.date : new Date();
                      // // console.log(now);
                      var delta = diff(now.getTime(), pubDate.getTime() );
                  
                      // // console.log("Difference", delta, pubDate);
                     
                      
                      var url = episode.getElementsByTagName("enclosure")[0].getAttribute('url');
                      //console.log(url);
                      // // console.log("Has new episodes", self.getLatestEpisode() != url);
                      if (delta > -1 && delta < 1000 * 60 * 60 * 2 && played_episodes.indexOf(url) < 0) {
                          //if (self.getLatestEpisode() == url) {
                           //   continue;
                          //}
                          // console.log("GT");
                          mashcast.date = null;
                          // // console.log("New episode found");
                          // // console.log(self.mashcast);
                          self.emit('newepisode', {
                                  episode: new Episode({
                                      url:url,
                                      duration: null
                                  })
                              
                          });
                          played_episodes += url + ';';
                          
                          self.setLatestEpisode(url);
                          break;
                      }
                      // We use local storage to check for enw 
                      
                  }
                // resolve(url);
              }
              
            });
        });
          // // console.log("Request sent");
    }
        

    getChannelById (id) {
        for(var i = 0 ; i < this.channels.length; i++) {
            var channel = this.channels[i];
            if (channel.id == id)
                return channel;
        }
        return null;
    }

    request(method, address, query) {
         var promise = new Promise(function (resolve, fail) {
	         var xmlHttp = new XMLHttpRequest();
	         xmlHttp.onreadystatechange = function () {
	             if (xmlHttp.readyState == 4) {
	                 if (xmlHttp.status == 200) {
	                     var json = JSON.parse(xmlHttp.responseText);
	                     resolve(json);
	                 }
	             }
	         };
	         xmlHttp.open(method, address + '?' + query);
	         xmlHttp.send(query);
         });
         return promise;
         
    }
    
    loadChannel (channel) {
         let promise = new Promise((resolve, fail) => {
      
	         fetch('http://api.radioflow.se/v1/channel/' + channel + '/', 'format=json').then((result) => result.json()).then((data) => {
	            var channel = new Channel(data, self, this.mashcast);
	            this.channels.push(channel);
	            resolve(channel);
	            this.channel = channel;
	         });
         });
         return promise;
    }
    
    /**
     * Stop (Mute) the music 
     */
   stopMusic () {
        // // console.log("Stopping music");
       
    }
    /**
     * Stop (Mute) the music 
     */
    startMusic () {
        // // console.log("Starting music");
        
    };
    
    fadeOutMusic(appId) {
        var promise = new Promise((resolve, fail) => {
	        var self = this;
	       
	        var appId = this.audioApp;
	        // // console.log("A");
	        // // console.log("Starting fading in music from" + self.volume);
					if (true) {
						MC.stopMusic();
						setTimeout(() => {
							resolve();
						}, 100);
            self.status = PLAYING;
            mashcast.playing = true;
					} else {
						var ic = setInterval(() => {
	            if (self.volume > -1) {
	                self.volume -= 1;
	               } else {
	                   MC.stopMusic();
	                     resolve(self);
	                    clearInterval(ic);
	                    __mashcast.showPopup(0, 'Radioflow', 'Music block started');
	                    self.status = PLAYING;
	                    mashcast.playing = true;
				
	               }
	               // // console.log(self.volume);
	            var result = __mashcast.setApplicationVolume(appId, self.volume);     
	            if (!result) {
	                clearInterval(ic);
	               	fail();
	                __mashcast.showMessage(0, "Could not sync volume, the program will not be played");
	            } else {
	                
	            }
	            // // console.log("setting volume to " + self.volume);
	            
						}, 100);
					}
		});
        return promise;
    }
    fadeInMusic () {
        var self = this;
        var promise = new Promise((resolve, fail) => {
	        var appId = this.audioApp;
	        console.log(MC.play());
          // // console.log("Starting fading in music");
					MC.play();

          self.status = READY;
          mashcast.playing = false;
	        if (false) {
						var ic = setInterval(() => {
	            
	            if (self.volume < 50) {
	                self.volume += 1;
	                
	            } else { 
	                self.status = READY;
	                mashcast.playing = false;
	                fail(self);
	                clearInterval(ic);
	                
	            }
	            // // console.log("setting volume to " + self.volume);
	            __mashcast.setApplicationVolume(appId, self.volume);
	            // // console.log("T");
	            
						}, 100);
					}
					setTimeout(() => {
						resolve(self);
					}, 100);
		});
        return promise;
    }
    
    playEpisode (episode) {
        var self = this;
       
        
        this.episodes.push(episode);
    }
    
    play(episode) {
    	if (this.playing) {
    		return;
    	}
			if (episode == null) {
				return;
			}
        // // console.log(episode.url);
        var self = this;
    
         this.stopMusic();
         this.playing = true;
    
    }
    
    stopEpisode(episode) {
        
        this.episode = null;
				this.playing = false;
      /*  if (this.episodes.length > 0) {
            this.play();
        } else {
            this.startMusic(); // Unmute the music
        }*/
       //// alert(this.episodes.length);
       console.log(this.episodes);
        console.log(this.episodes.length);
      // if (this.episodes.length < 1) {
       //	// alert("T");
        	this.startMusic();
       //}
    };
    
    /**
     *Queue the episode 
     */
    
   enqueueEpisode (episode) {
        this.episodes.push(episode);  
    };
    
    /**	
     * Channel 
     **/
    
    
    
    
}