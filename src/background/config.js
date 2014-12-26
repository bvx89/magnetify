var Magnetify = Magnetify || {},
	chrome = chrome || {};

(function (M) {
	'use strict';

	M.Config = {
		// Sites that will not be injected
		illegalPaths : ["chrome-devtools://",
						"chrome-extension://",
						"chrome://newtab/",
						"chrome://extensions/"],

		// Valid paths
		spotifyPaths : ["//open.spotify.com",
						"//play.spotify.com"],
	

		// Boolean settings
		injectingEnabled 	: true,
		addressEnabled 	 	: true,
		showAlbum 			: true,
		preloadAlbum 		: false,
		menu				: false,

		// Loaded from localStorage
		lookupObjects : {},	// Lookup objects
		lastLinks : [],		// Links array


		// Numeric settings
		maxNumSongs 		: 10
	};
})(Magnetify);