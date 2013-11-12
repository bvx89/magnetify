// Make M.* equal to empty objects if not defined
var M = M || {};
M.Settings = M.Settings || {};
M.Parser = M.Parser || {};
M.Page = M.Page || {};
M.Storage = M.Storage || {};

// Main Object for the Magnetify namespace
M = (function() {
	var lastLinks;
	var lookupObjects;

	function loadScript(scriptName, callback) {
	    var scriptEl = document.createElement('script');
	    scriptEl.src = chrome.extension.getURL('lib/' + scriptName + '.js');
	    scriptEl.addEventListener('load', callback, false);
	    document.head.appendChild(scriptEl);
	};

	function compareObj(obj1, obj2) {
		return JSON.stringify(obj1) === JSON.stringify(obj2);
	}

	return {
		pageUpdated : function(tabId, changeInfo) {
			M.Page.pageUpdated(tabId, changeInfo);
		},

		onMessage : function(message, sender, response) {
			// URL sent from content script
			if (message.command === 'convert-url') {
				var link = message.link;
				var id = sender.tab.id;
				
				// If it's a redirect, find out what the URL really is
				if (link.indexOf('spoti.fi') !== -1) {
					
					//TODO : Replace with jQuery

					// Start XHR request
					var xhr = new XMLHttpRequest();
					xhr.open("GET", link, true);
					xhr.onreadystatechange = function() {
						// Done redirection, now we have the page
						if (xhr.readyState == 4) {
						
							// Get the page as a string
							var page = xhr.responseText;
							var uri = findUriFromHTML(page);
							saveSong(url)
							changeURLofTab(id, uri);
						}
						
					}
					xhr.send();
				} else {
					var uri = M.Parser.createUriFromURL(message.link);
					M.addSpotifyURI(uri);
					response(uri);
				}

			// Open URI, sent from popup				
			} else if (message.command === 'open-uri') {
				M.Page.setURIofTab(undefined, message.link);
			
			// Update listeners according to the settings
			} else if (message.command === 'prefs-changed') {
				// Get settings
				var injecting = M.Storage.getInject();
				var address = M.Storage.getAddress();

				// Update listeners
				M.Settings.setListenerSettings(injecting, address);

				console.log('settings changed');
			}
	
		},

		/*
		*	Callback for when changes have been applied to
		*	the list of links/lookups
		*/
		onStored : function(changes, namespace) {
			for (key in changes) {
			    var storageChange = changes[key];
			    var newVal = storageChange.newValue;

			    // Find out which item was changed
			    switch (key) {
		    	case 'links':
		    		if (!compareObj(newVal, 
		    						lastLinks)) {
		    			M.Storage.setLinks(newVal);
		    			lastLinks = newVal;
		    		}

		    		break;
		    	case 'lookup':
		    		if (compareObj(storageChange.newValue, 
		    						lookupObjects)) {
		    			M.Storage.setLookup(newVal);
		    			lookupObjects = newVal;		
		    		}
		    		break;
			    }
		  	}
		},

		addSpotifyURI : function(uri) {
			// Find out if the URI is new
			var isNew = true;
			for(var link in lastLinks) {
				if (lastLinks[link] === uri)
					isNew = false;
			}
			
			if (isNew) {
				// Append first in the list
				lastLinks.unshift(uri);

				// Remove last if too many
				if (lookupObjects.length > M.Settings.getMaxNumSongs)
					lookupObjects.pop();

				// Ask spotify for the Spotify object in background
				if (uri.indexOf('playlist') !== -1) {
					M.Lookup.getSpecialObject(uri);
				} else {
					M.Lookup.getDefaultObject(uri);
				}

				// Store the links
				M.Storage.setSyncLinks(lastLinks);
			}
		},

		/**
		*	Puts new object in front
		*/
		addLookupObject : function(obj) {
			// Set the newest object first
			lookupObjects.unshift(obj);

			// Pop the oldest if needed
			if (lookupObjects.length > M.Settings.getMaxNumSongs)
				lookupObjects.pop();

			// Save in storage
			M.Storage.setSyncLookup(lookupObjects);

			// Notify popup
			chrome.runtime.sendMessage({command: "render-popup"});
		},

		getLookupObjects : function() {
			return lookupObjects;
		},

		init : function() {
			// Wait for the storage file to load
			loadScript('storage', function() {
				// Get stored data
				M.Storage.sync(function(lookup, links) {
					lookupObjects = lookup;
					lastLinks = links;
				});

				// Get stored preferences
				var address = M.Storage.getAddress();
				var injecting = M.Storage.getInject();

				// Set preferences inside the current settings
				M.Settings.setListenerSettings(injecting, address);
			});
		}
	}
}());


M.Lookup = (function($) {
	var URL = 'http://ws.spotify.com/lookup/1/.json?uri=';
	var EMBED_URL = 'https://embed.spotify.com/oembed/?url=';

	return {
		getDefaultObject : function(uri) {
			// Set up main lookup
			var lookup = $.ajax({
				url: URL + uri,
				dataType: 'json'
			});

			// Set up embed lookup
			var embed = $.ajax({
				url: EMBED_URL + uri,
				dataType: 'json'
			});

			// Wait til both are done
			$.when(lookup, embed).done(function(main, extra) {
				// Set the thumbnail inside the main object
				main[0].thumb = extra[0].thumbnail_url.replace('cover', '60');

				// Add it
				M.addLookupObject(main[0]);
			});
		},

		getSpecialObject : function(uri) {
			// Set up embed lookup
			var embed = $.ajax({
				url: EMBED_URL + uri,
				dataType: 'json',
			});

			// Wait for query to be done
			$.when(embed).done(function(data) {
				var obj = {};
				obj.info = {};
				obj.playlist = {};

				// Set thumbnail
				obj.thumb = data.thumbnail_url.replace('cover', '60');

				// Find username/user id
				if (uri.indexOf("user") !== -1) {
					obj.user = uri.slice(	uri.indexOf("user") + 5, 
							uri.indexOf(":", uri.indexOf("user") + 5));

				}

				// find playlist id
				if (uri.indexOf("playlist") !== -1) {
					obj.playlist.id = uri.slice(uri.indexOf("playlist") + 9);
					obj.info.type = 'playlist';
				}

				// Add uri
				obj.playlist.href = uri;

				M.addLookupObject(obj);
			});
		} 
	}
}(jQuery));


M.Settings = (function() {
	// Sites that will not be injected
	var illegalPaths = ["chrome-devtools://", 
						"chrome-extension://",
						"chrome://newtab/",
						"chrome://extensions/"];
	var spotifyPaths = ["//open.spotify.com", 
						"//play.spotify.com"];

	var injectingEnabled = true;
	var addressEnabled = true;

	var maxNumSongs = 10;

	return {

		/**
		*	Sets the settings for the listener.
		*	Each time this is run, the tabs.onUpdated listener is removed,
		*	but reattached if either injecting or address is true.
		*	
		*	This is to avoid multiple calls on the same function.
		*/
		setListenerSettings : function(injecting, address) {
			injectingEnabled = injecting;
			addressEnabled = address;
			
			// Remove the previous event listener
			chrome.tabs.onUpdated.removeListener(M.pageUpdated);

			// Add it back if the preferences allow it
			if (injecting === true || address === true) {
				chrome.tabs.onUpdated.addListener(M.pageUpdated);
			}
		},

		isInjecting : injectingEnabled,

		isAddressChecking : addressEnabled,

		getIllegalPaths : illegalPaths,

		getSpotifyPaths : spotifyPaths,

		getMaxNumSongs : maxNumSongs
	}
}());


M.Parser = (function() {
	// When parsing spoti.fi URLs, how far down the page should
	// the index be before starting to search for keyword
	var lengthFromEndOfPage = 800;

	// Add type and ID to URI
	var id_length = 22;

	// The word to look for inside the HTML page
	var keywordInHTML = 'landingURL';

	// Filters out info and creates valid URI from a Spotify URL.
	function createUriFromURL(URL) {
		var uri = 'spotify:';
		var last_index = (URL.indexOf('?') === -1 ? URL.length-1 : URL.indexOf('?')-1);
		var type;
		
		// Find type
		if (URL.indexOf('track') !== -1) {
			type = 'track';
		} else if (URL.indexOf('artist') !== -1){
			type = 'artist';
		} else if (URL.indexOf('album') !== -1){
			type = 'album';
		} else if (URL.indexOf('user') !== -1){
			// Extract username
			var user_index = URL.indexOf('user/') + 5;
			var user;
			
			// If normal playlist, we need ID. If not, just return.
			if (URL.indexOf('playlist') !== -1) {
				type = 'playlist';
				
				user = URL.substr(user_index, URL.indexOf('/playlist') - user_index);
				uri += 'user:' + user + ':';
			} else {
				// Add 'starred' for starred playlist and extract usernames for both
				if (URL.indexOf('starred') !== -1) {
					user = URL.substr(user_index, last_index - URL.indexOf('/starred'));
					uri += 'user:' + user + ':';
					
					uri += 'starred';
				} else {
					user = URL.substr(user_index, last_index);
					uri += 'user:' + user + ':';
				}
				
				return uri;
			}
		}
		
		uri += type + ':' + URL.substr(URL.indexOf(type) + type.length+1, id_length);
		
		return uri;
	};

	// Finds Spotify URL inside a Spotify page
	function findUriFromHTML(page) {
		// Find the correct URL from the JavaScript
		var start = page.indexOf(keywordInHTML, page.length - lengthFromEndOfPage);
		var end = page.indexOf('"', start + 15);
		var unparsed = '"' + page.substring(start + 13, end) + '"';
		
		var parsed = JSON.parse(unparsed)
		return createUriFromURL(parsed);

	};

	return {
		createUriFromURL : function (URL) {
			return createUriFromURL(URL);
		}
	}
}());


M.Page = (function () {
	function injectTabById(tabId) {
		console.log('injecting tab: ' + tabId);
		chrome.tabs.executeScript(tabId, {file : "src/listener.js"});
	};

	/*
	* 	Get's the current tab, quite unsafe as it doesn't
	*	check if it's a valid tab
	*/
	function getCurrentTab(callback) {
		chrome.tabs.query(
			{						
			"currentWindow": true,
			"active": true,
			"windowType": "normal"
			}, function(tabObjects) {
				callback(tabObjects);
			});
	};

	/*
	*	Get's a tab object given an id
	*/
	function getTabById(tabId, callback) {
		// Get selected tab
		chrome.tabs.get(tabId, callback);
	};

	/*
	*	Tries to get a valid tab and send uri change to it
	*/
	function setURI(uri) {
		var typeOfTab = {
		'active': true,
		'windowType': 'normal'
		};

		chrome.tabs.query(typeOfTab, function(tabObjects) {
			for (var t in tabObjects) {
				// Validate the current tab
				if (tabObjects[t].url !== undefined 
					&& !isIllegalPath(tabObjects[t].url)
					&& !isSpotifyPath(tabObjects[t].url)) {

					// Found a "good" tab, inject it
					forceChangeOfURI(tabObjects[t].id, uri, function(response) {
						if (response !== undefined) {
							console.log('success');
						} else {
							console.log('failure on tab ' + tabObjects[t].id);
						}
					});
					break;
				}
			}

		});
	};

	function forceChangeOfURI(tabId, uri, callback) {
		chrome.tabs.sendMessage(tabId, 
								{command: "inject-uri", link: uri}, 
								callback);
	};

	function isSpotifyPath(url) {
		// Check if the url is to the Spotify web player
		var sPaths = M.Settings.getSpotifyPaths;
		for (var s in sPaths) {
			if (url.indexOf(sPaths[s]) !== -1) {
				return true;
			}
		}
		return false;
	};

	function isIllegalPath(url) {
		// Check if the url is to the Spotify web player
		var iPaths = M.Settings.getIllegalPaths;
		for (var i in iPaths) {
			if (url.indexOf(iPaths[i]) !== -1) {
				return true;
			}
		}
		return false;
	}

	return {

		pageUpdated : function(tabId, changeInfo) {
			// If page is loading.
			if (changeInfo.status === 'loading' && M.Settings.isAddressChecking) {
				// get tab object for this id
				getTabById(tabId, function(tab) {
					
					// If it's a Spotify tab, close it
					if (!isIllegalPath(tab.url) && isSpotifyPath(tab.url)) {
						console.log('spotify tab found ' + tab.id);
						chrome.tabs.remove(tabId, function() {
							// Get spotify URI from URL
							var uri = M.Parser.createUriFromURL(tab.url);
							
							// Let Page object find a tab ID to enter URI
							setURI(uri);

							// Notify M object
							M.addSpotifyURI(uri);
						});
					}

				});
				
			// Inject site with JS if it's valid and done loading
			} else if (changeInfo.status === 'complete' && M.Settings.isInjecting) {
				
				// Get URL of the tab first
				getTabById(tabId, function(tab) {

					// If the tab is undefined, return
					if (tab.url === undefined) {
						return;
					}

					// Verify that it's not illegal
					if (!isIllegalPath(tab.url))
						injectTabById(tab.id);
				});
			} 
		},

		setURIofTab : function(tabId, uri) {
			if (tabId === undefined)
				setURI(uri);
			else 
				forceChangeOfURI(tabId, uri);
		}
	}
}());

// Init the main object
M.init();


// Message listener in chrome, always enabled
chrome.runtime.onMessage.addListener(M.onMessage);

// Save listener
chrome.storage.onChanged.addListener(M.onStored);