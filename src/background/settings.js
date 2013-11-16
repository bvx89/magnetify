var M = M || {},
	chrome = chrome || {};

M.Settings = (function () {
	'use strict';
	
	// Sites that will not be injected
	var illegalPaths = ["chrome-devtools://",
						"chrome-extension://",
						"chrome://newtab/",
						"chrome://extensions/"],
		spotifyPaths = ["//open.spotify.com",
						"//play.spotify.com"],
		
		injectingEnabled = true,
		addressEnabled = true,
		showAlbum = true,
		preloadAlbum = false,

		maxNumSongs = 10;

	return {

		/**
		*	Sets the settings for the listener.
		*	Each time this is run, the tabs.onUpdated listener is removed,
		*	but reattached if either injecting or address is true.
		*	
		*	This is to avoid multiple calls on the same function.
		*/
		setListenerSettings : function (injecting, address) {
			injectingEnabled = injecting;
			addressEnabled = address;
			
			// Remove the previous event listener
			chrome.tabs.onUpdated.removeListener(M.pageUpdated);

			// Add it back if the preferences allow it
			if (injecting === true || address === true) {
				chrome.tabs.onUpdated.addListener(M.pageUpdated);
			}
		},
		
		/*
		*	Simple function to store the image viewing option
		*/
		setImage : function (image) {
			showAlbum = image;
		},

		// Get dynamic content through functions
		isInjecting : function () {
			return injectingEnabled;
		},

		isAddressChecking : function () {
			return addressEnabled;
		},
		
		isPreloadingAlbum : function () {
			return preloadAlbum;
		},
		
		isShowingAlbum : function () {
			return showAlbum;
		},

		getMaxNumSongs : function () {
			return maxNumSongs;
		},
		
		// Get static content through direct reference
		getIllegalPaths : illegalPaths,

		getSpotifyPaths : spotifyPaths,

	};
}());