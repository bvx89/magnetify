var chrome = chrome || {},
	jQuery = jQuery || {};

// Main Object for the Magnetify namespace
var M = (function ($) {
    'use strict';
	var lastLinks, lookupObjects;

	function compareObj(obj1, obj2) {
		return JSON.stringify(obj1) === JSON.stringify(obj2);
	}

	return {
		pageUpdated : function (tabId, changeInfo) {
			M.Page.pageUpdated(tabId, changeInfo);
		},

		onMessage : function (message, sender, response) {
			// URL sent from content script
			switch (message.command) {
			case 'convert-url':
				if (!M.Settings.isInjecting()) {
					break;	
				}
					
				var link = message.link,
					id = sender.tab.id,
					uri;
				
				// If it's a redirect, find out what the URL really is
				if (link.indexOf('spoti.fi') !== -1) {
                    $.ajax({
                        url: link,
                        success: function (data) {
                            var uri = M.Parser.findUriFromHTML(data);
							M.addSpotifyURI(uri);
							M.Page.setURIofTab(undefined, uri);
						}
                    });
				} else {
					uri = M.Parser.createUriFromURL(message.link);
					M.addSpotifyURI(uri);
					response(uri);
				}
				break;

			// Store the URI given
			case 'store-uri':
				M.addSpotifyURI(message.link);
				break;
			default:
				return;
			}
		},

		/*
		*	Callback for when changes have been applied to
		*	the list of links/lookups
		*/
		
		onStored : function (changes, namespace) {
			for (var key in changes) {
				var storageChange = changes[key],
					newVal = storageChange.newValue;
				
				// Find out which item was changed
				switch (key) {
				case 'links':
					if (!compareObj(newVal, lastLinks)) {
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
				default:
					return;
				}
			}
		},
		

		addSpotifyURI : function (uri) {
			// Find out if the URI is new
			var isNew = true;
			$.each(lastLinks, function (i, item) {
				if (item === uri) {
					isNew = false;
					return false;
				}
			});
			
			if (isNew) {
				// Append first in the list
				lastLinks.unshift(uri);

				// Remove last if too many
				if (lookupObjects.length > M.Settings.getMaxNumSongs()) {
					lookupObjects.pop();
				}

				// Ask spotify for the Spotify object in background
				if (uri.indexOf('playlist') !== -1) {
					M.Lookup.getSpecialObject(uri, function (obj) {
						M.addLookupObject(obj);
					});
				} else {
					M.Lookup.getDefaultObject(uri, function (obj) {
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
		addLookupObject : function (obj) {
			// Set the newest object first
			lookupObjects.unshift(obj);

			// Pop the oldest if needed
			if (lookupObjects.length > M.Settings.getMaxNumSongs()) {
				lookupObjects.pop();
			}

			// Save in storage
			M.Storage.setSyncLookup(lookupObjects);

			// Notify popup
			chrome.runtime.sendMessage({command: "render-popup"});
		},

		getLookupObjects : function () {
			return lookupObjects;
		},

		init : function () {
			// Get stored data
			M.Storage.sync(function (lookup, links) {
				lookupObjects = lookup;
				lastLinks = links;
			});

			// Update listeners
			M.Settings.setListenerSettings(M.Storage.getInject(),
											M.Storage.getAddress());
			
			// Update image viewing option
			M.Settings.setImage(M.Storage.getImage());
			
			// Activate the context menu
			M.Menu.init();
		}
	};
}(jQuery));


var window = window || {};
window.onload = function () {
	'use strict';
	// Init the main object
	M.init();


	// Message listener in chrome, always enabled
	chrome.runtime.onMessage.addListener(M.onMessage);

	// Save listener
	chrome.storage.onChanged.addListener(M.onStored);
	
};