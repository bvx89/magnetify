// Incorporate right-click action
M.Menu = (function() {
	var menuId;
	
	function search(info, tab) {
		var query = info.selectionText;
		

		/* 
		*	1) Performs lookup on Spotify
		*	2) Sends lookup data to content script
		*/
		M.Lookup.searchOnType('track', query, function(data) {
			chrome.tabs.sendMessage(tab.id, {command: "open-search", 
											data: data.tracks});
		});
			
	};


	
	return {

		init : function() {
			var options = {
				'title': 'Search for "%s"',
				contexts: ["selection"],
				onclick : search
			};

			// Create the menu item
			menuId = chrome.contextMenus.create(options);

		}

	}
}());