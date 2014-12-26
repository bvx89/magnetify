var Magnetify = {};
	jQuery = jQuery || {};

// Main Object for the Magnetify namespace
(function (M, $) {
    'use strict';

    // Local variables with shortcuts to other objects
	M.pageUpdated = function (tabId, changeInfo) {
		M.Page.pageUpdated(tabId, changeInfo);
	}

	M.onMessage = function (message, sender, response) {
		// URL sent from content script
		switch (message.command) {
		case 'convert-url':
			if (!M.Config.injectingEnabled) {
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
	}

	M.addSpotifyURI = function (uri) {
		// Find out if the URI is new
		var isNew = true;

		for (var i = M.Config.lastLinks.length - 1; i >= 0; i--) {
			if (M.Config.lastLinks[i] === uri) {
				return (isNew = false);
			}
		}
		
		if (isNew) {
			// Append first in the list
			M.Config.lastLinks.unshift(uri);

			// Perform async lookup (special method if playlist)
			var method;
			if (uri.indexOf('playlist') !== -1) {
				method = M.Lookup.getSpecialObject
			} else {
				method = M.Lookup.getDefaultObject;
			}
			method(uri, M.addLookupObject(obj));

			// Store link data online
			M.Storage.setLinks(lastLinks);
		}
	}

	/**
	 * Adds a new lookup object to the local variable, and overrides the
	 * old array of lookup values in the storage. If the current size of
	 * the array of lookup objects is above Settings.maxNumSongs, old
	 * items will get popped out of the list.
	 * 
	 * @param {object} lookup The new lookup item to add
	 */
	M.addLookupObject = function (lookup) {
		// Set the newest object first
		M.Config.lookupObjects.unshift(lookup);

		// Pop the oldest if needed
		if (M.Config.lookupObjects.length > M.Storage.maxNumSongs) {
			M.Config.lookupObjects.pop();
		}

		// Save in storage
		M.Storage.setLookup(MC.lookupObjects);

		// Notify popup
		chrome.runtime.sendMessage({command: "render-popup"});
	}

	/**
	*	Sets the settings for the listener.
	*	Each time this runs, the tabs.onUpdated listener is removed,
	*	but reattached if either injecting or address is true.
	*	
	*	This is to avoid multiple calls on the same function.
	*/
	M.setListenerSettings = function (injecting, address) {
		// Remove the previous event listener
		chrome.tabs.onUpdated.removeListener(M.pageUpdated);

		// Add it back if the preferences allow it
		if (injecting === true || address === true) {
			chrome.tabs.onUpdated.addListener(M.pageUpdated);
		}
	}


	M.onStorageChange = function (changes, namespace) {
		var alterListener = false;
		for (var key in changes) {
			var storageChange = changes[key],
				newVal = storageChange.newValue;

			handleStoreChange(key, newVal);

			if (key === M.Storage.INDEX_INJECT || key === M.Storage.INDEX_ADDRESS) {
				alterListener = true;
			}
		}

		if (alterListener) {
			M.setListenerSettings(M.Config.injectingEnabled, 
								M.Config.addressEnabled);
		}
	}

	/**
	 * 
	 * 
	 * @param  {[type]}
	 * @param  {[type]}
	 * @return {[type]}
	 */
	var handleStoreChange = function(index, val) {
		switch (index) {
			case M.Storage.INDEX_LINKS:
				M.Config.lastLinks = val;
				break;
			case M.Storage.INDEX_INJECT:
				M.Config.inject = val;
				break;
			case M.Storage.INDEX_ADDRESS:
				M.Config.addressEnabled = val;
				break;
			case M.Storage.INDEX_LOOKUP:
				M.Config.lookupObjects = val;
				break;
			case M.Storage.INDEX_IMAGE:
				M.Config.image = val;
				break;
			case M.Storage.INDEX_MENU:
				console.log("menu has changed to " + val);

				if (val === true && !M.Config.menu) {
					M.Menu.init();

				} else if (val === false && M.Config.menu) {
					M.Menu.removeMenu();
				}

				M.Config.menu = val;
				break;
		};
	}


	M.init = function () {
		M.Storage.sync(function (values) {
			// All objects
			for (var i in values) {
				// Current value
				var object = values[i];

				// Splitting into INDEX and VAL to get INDEX
				for (var index in object) {
					var val = object[index];

					handleStoreChange(index, val);
					
				}
			}
		});

		// Configure listener settings
		M.setListenerSettings(	M.Config.injectingEnabled, 
								M.Config.addressEnabled);

	}
})(Magnetify, jQuery);


var window = window || {};
window.onload = function () {
	'use strict';
	// Init the main object
	Magnetify.init();


	// Message listener in chrome, always enabled
	chrome.runtime.onMessage.addListener(Magnetify.onMessage);

	// Save listener
	chrome.storage.onChanged.addListener(Magnetify.onStorageChange);
	
};