var M = M || {},
	chrome = chrome || {};

// Incorporate right-click action
M.Menu = (function ($) {
    'use strict';
	var menuId,
        maxNumResults = 10;

	function notify(id, callback) {
		chrome.tabs.sendMessage(
			id,
			{command: 'loading'},
			callback
		);
	}

	function sendData(id, data, callback) {
		chrome.tabs.sendMessage(
			id,
			{command: "open-search", data: data},
			callback
		);
	}
		
	/*
	*	The search procedure:
	*	- Notify user of search starting
	*	- Performs a search to Spotify API and wait for callback
	*	- If isWantingAlbum was true, load all images
	*	- Send data objects to the tab specified 
	*/
	function search(info, tab) {
		// get selected word
		var query = info.selectionText;

		// Notify
		notify(tab.id, function () {
			// Search
			M.Lookup.search(query, function (data) {
				// Optionally load all albums
				if (M.Settings.isPreloadingAlbum()) {
					
					// Create array of all $.loadImage promises
					var thumbs = function () {
						var promises = [];
						for (var i = data.length; i--;) {
							promises.push($.loadImage(data[i].album.img));
						}
						return promises;
					};

					// Perform all image loads before sending
					$.when.apply($, thumbs()).then(function () {
						sendData(tab.id, data);
					});

				} else {
					sendData(tab.id, data);
				}
			});
		});
	}
    
	return {

		init : function() {
			// Preferences for the menu item
			var options = {
				'title': 'Search for "%s"',
				contexts: ["selection"],
				onclick : search
			};

			// Create it
			menuId = chrome.contextMenus.create(options);
		}

	};
}());