var Magnetify = Magnetify || {},
	jQuery = jQuery || {},
	chrome = chrome || {};

// Incorporate right-click action
(function (M, $) {
    'use strict';
	
	// MenuID - to remove menu later
	var menuId;

    /**
     * Helper function to send data to the given window
     * 
     * @param  {integer} id Id of the tab
     * @param  {object} data Data to be sent to the tab
     * @param  {Function} callback Callback on complesion
     */
	function sendData(id, data, callback) {
		chrome.tabs.sendMessage(
			id,
			{command: "open-search", data: data},
			callback
		);
	}
		
	/**	
	 * The search procedure:
	 * - Notify user of search starting
	 * - Performs a search to Spotify API and wait for callback
	 * - Preload album images if 'isPreloadingAlbum' is true
	 * - Send data objects to the specified tab 
	 *
	 * @param  {object} info Object that contains all lookup data
	 * @param  {object} tab Object with information about the current tab
	 */
	function search(info, tab) {
		// get selected word
		var query = info.selectionText;

		// Notify
		chrome.tabs.sendMessage(tab.id, {command: 'loading'}, function () {
			// Search
			M.Lookup.search(query, function (data) {
				if (data === 'empty') {
					chrome.tabs.sendMessage(tab.id, data);
				}
				
				// Optionally load all albums
				if (M.Config.preloadAlbum) {
					
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
    
	M.Menu = {

		init : function(cb) {
			// Preferences for the menu item
			var options = {
				'title': 'Search for "%s"',
				contexts: ["selection"],
				onclick : search
			};

			// Create menu item
			menuId = chrome.contextMenus.create(options, cb);
		},

		removeMenu : function(cb) {
			if (typeof menuId !== 'undefined')
					chrome.contextMenus.remove(menuId);
		}

	};
}(Magnetify, jQuery));