var M = M || {};
M.Settings = M.Settings || {};

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
		chrome.tabs.query({}, function(tabObjects) {
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