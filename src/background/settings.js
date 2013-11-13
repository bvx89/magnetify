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