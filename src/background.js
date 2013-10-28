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
	}

	return {
		pageUpdated : function(tabId, changeInfo) {
			M.Page.pageUpdated(tabId, changeInfo);
		},

		onMessage : function(message, sender, response) {
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
			} else if (message.command === 'open-uri') {
				M.Page.setURIofTab(undefined, message.link);
			}
	
		},

		addSpotifyURI : function(uri) {
			// Find out if the URI is new
			var isNew = true;
			for(var link in lastLinks) {
				if (link === uri)
					isNew = false;
			}
			
			if (isNew) {
				// Append first in the list
				lastLinks.unshift(uri);

				// Remove last if too many
				if (lookupObjects.length > M.Settings.getMaxNumSongs)
					lookupObjects.pop();

				// Ask spotify for the Spotify object in background
				M.Lookup.getObject(uri);

				// Store the links
				M.Storage.setLinks(lastLinks);
			} else {
				console.log("existed");
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
			M.Storage.setLookup(lookupObjects);

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
				lastLinks = M.Storage.getLinks();
				lookupObjects = M.Storage.getLookup();

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
		getObject : function(uri) {
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
		} 
	}
}(jQuery));


M.Settings = (function() {
	// Sites that will not be injected
	var illegalPaths = ["chrome-devtools://", 
						"chrome://newtab/"];
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
	// Local object that contains information of all tabs
	var tabsURL = {};

	function injectTabById(tabId) {
		chrome.tabs.executeScript(tabId, {file : "src/listener.js"});
	};

	var changingTab = false;

	function getCurrentTab(callback) {
		// Get selected tab
		chrome.tabs.query(
			{						
			"currentWindow": true,
			"active": true,
			"windowType": "normal"
			}, function(tabObject) {
				callback(tabObject[0]);
			});
	};

	function getURLofTab(tabId, callback) {
		getCurrentTab(function(tabObject) {
			callback(tabObject.url);
		});
	}

	function setURIofTab(tabId, uri) {
		changingTab = true;

		if (tabId === undefined) {
			// Tell the current tab to open URI
			getCurrentTab(function(tabObject) {
				forceChangeOfURI(tabObject.id, uri);
			});
		} else {
			forceChangeOfURI(tabId, uri);
		}
	};

	function forceChangeOfURI(tabId, uri) {
		// Set location blank
		console.log("id: " + tabId + ", uri: " + uri);
		chrome.tabs.executeScript(tabId, {
					file : 'src/injecter.js',
		}, function(result) {
			chrome.tabs.executeScript(tabId, {
					code: 'l("' + uri + '")',
			}, function(result2) {

				changingTab = false;
				// Check for error
				if (chrome.runtime.lastError) {
					console.log(chrome.runtime.lastError.message);
				}
			});
		});
	}

	function handleAddressChange(url) {
		// Validate that the path is to Spotify
		var isSpotifyPath = !M.Settings.getSpotifyPaths.every(
			function(path) {
				// Only need one element to return false
				// for it to be false
				return url.indexOf(path) === -1;
			}
		);

		if (isSpotifyPath) {

			// Close tab
			chrome.tabs.remove(tabId, function() {
				// Get spotify URI from URL
				var URI = M.Parser.createUriFromURL(url);

				// Use undefined index to get the current tab 
				// after the spotify tab has been closed
				M.Page.setURIofTab(undefined, URI);

				// Notify M object
				M.addSpotifyURI(URI);
			});
		}
	}

	return {
		getTabs : tabsURL,

		pageUpdated : function(tabId, changeInfo) {
			if (changingTab) return;

			// If page is loading, grab the URL of that page
			if (changeInfo.status === 'loading') {
				// Set the url of the current tab
				tabsURL[tabId] = changeInfo.url || tabsURL[tabId];

				if (M.Settings.isAddressChecking) {
					var url = tabsURL[tabId];

					if (url === undefined) {
						getURLofTab(tabId, function(correctURL) {
							handleAddressChange(correctURL);
						});
					} else {
						handleAddressChange(url)
					}					
				}
				
			// Inject site with JS if it's valid and done loading
			} else if (changeInfo.status === 'complete' && M.Settings.isInjecting) {
				var url = tabsURL[tabId];

				// Find URL if not in the list
				if (url === undefined) {
					getURLofTab(tabId, function(correctURL) {
						// Sometimes, the URL doesn't exist O.o
						if (correctURL !== undefined) {
							// Validate that the page is not in the excluded list
							var isNotExcluded = M.Settings.getIllegalPaths.every(
								function(path) {
									// Only need one element to return false for it to be false
									return correctURL.indexOf(path) === -1;
								}
							);

							if (isNotExcluded)
								injectTabById(tabId);
						}
					});
				} else {
					// Validate that the page is not in the excluded list
					var isNotExcluded = M.Settings.getIllegalPaths.every(
						function(path) {
							// Only need one element to return false for it to be false
							return url.indexOf(path) === -1;
						}
					);

					if (isNotExcluded)
						injectTabById(tabId);
				}	


				
			} 
		},

		setURIofTab : function(tabId, uri) {
			setURIofTab(tabId, uri);
		}
	}
}());

// Init the main object
M.init();


// Message listener in chrome, always enabled
chrome.runtime.onMessage.addListener(M.onMessage);