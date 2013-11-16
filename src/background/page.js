var M = M || {},
	chrome = chrome || {};

M.Page = (function () {
	'use strict';
	
	function injectTabById(tabId) {
		chrome.tabs.executeScript(tabId, {file : 'src/listener.js'});
	}
	
	function revert(tabId) {
		chrome.tabs.executeScript(tabId, {code : 'window.history.back()'});
	}

	/*
	*	Get's the current tab, quite unsafe as it doesn't
	*	check if it's a valid tab
	*/
	function getCurrentTab(callback) {
		chrome.tabs.query({currentWindow: true,
							active: true,
							windowType: 'normal'
			}, function (tabObjects) {
			callback(tabObjects);
		});
	}

	/*
	*	Get's a tab object given an id
	*/
	function getTabById(tabId, callback) {
		// Get selected tab
		chrome.tabs.get(tabId, callback);
	}

	/*
	*	Tries to get a valid tab and send uri change to it
	*/
	function setURI(uri) {
		chrome.tabs.query({}, function (tabObjects) {
			for (var i = 0, l = tabObjects.length; i < l; i++) {
				// Validate the current tab
				if (tabObjects[i].url !== undefined &&
					!isIllegalPath(tabObjects[i].url) && 
					!isSpotifyPath(tabObjects[i].url)) {

					// Found a "good" tab, inject it
					forceChangeOfURI(tabObjects[i].id, uri);
					break;
				}
			}

		});
	}

	function forceChangeOfURI(tabId, uri, callback) {
		chrome.tabs.update(tabId, {url: uri});
	}

	function isSpotifyPath(url) {
		// Check if the URL is to the Spotify Web Player
		var sPaths = M.Settings.getSpotifyPaths;
		for (var s in sPaths) {
			if (url.indexOf(sPaths[s]) !== -1) {
				return true;
			}
		}
		return false;
	}

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
			if (changeInfo.status === 'loading' &&
				M.Settings.isAddressChecking()) {
				
				// get tab object for this id
				getTabById(tabId, function(tab) {
					
					// If it's a Spotify tab, get uri
					if (!isIllegalPath(tab.url) && isSpotifyPath(tab.url)) {
						
						// Remove the tab only when injecting
						if (M.Settings.isInjecting()) {
							chrome.tabs.remove(tabId, function() {
								// Get spotify URI from URL
								var uri = M.Parser.createUriFromURL(tab.url);
								
								// Let Page object find a tab ID to enter URI
								setURI(uri);
	
								// Notify M object
								M.addSpotifyURI(uri);
							});
						} else {
							// Get spotify URI from URL
							var uri = M.Parser.createUriFromURL(tab.url);
							
							// Revert back the current page
							revert(tab.id);
							
							// Let Page object find a tab ID to enter URI
							setURI(uri);

							// Notify M object
							M.addSpotifyURI(uri);
						}
					}

				});
				
			// Inject site with JS if it's valid and done loading
			} else if (changeInfo.status === 'complete' &&
						M.Settings.isInjecting()) {
				
				// Get URL of the tab first
				getTabById(tabId, function(tab) {

					// If the tab is undefined, return
					if (tab.url === undefined) {
						return;
					}

					// Verify that it's not illegal
					if (!isIllegalPath(tab.url)) {
						injectTabById(tab.id);
					}
				});
			} 
		},

		setURIofTab : function(tabId, uri) {
			if (tabId === undefined) {
				setURI(uri);
			} else {
				forceChangeOfURI(tabId, uri);
			}
		}
	};
}());