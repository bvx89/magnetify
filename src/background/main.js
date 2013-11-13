// Make M.* equal to empty objects if not defined
var M = {};
M.Settings = M.Settings || {};
M.Parser = M.Parser || {};
M.Page = M.Page || {};
M.Storage = M.Storage || {};

// Main Object for the Magnetify namespace
M = (function() {
	var lastLinks;
	var lookupObjects;

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
					M.Lookup.getSpecialObject(uri, function(obj) {
						M.addLookupObject(obj);
					});
				} else {
					M.Lookup.getDefaultObject(uri, function(obj) {
						M.addLookupObject(obj);
					});
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
			
			// Activate the context menu
			M.Menu.init();
		}
	}
}());

$(document).ready(function() {
	// Init the main object
	M.init();


	// Message listener in chrome, always enabled
	chrome.runtime.onMessage.addListener(M.onMessage);

	// Save listener
	chrome.storage.onChanged.addListener(M.onStored);
	
});