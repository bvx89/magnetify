// Incorporate right-click action
M.Menu = (function() {
	// Id's for different menu items
	var parentId;
	var trackId;
	var albumId;
	var artistId;
	
	function search(info, tab) {
		var query = info.selectionText;
		var type = '';
		console.log(tab);
		switch (info.menuItemId) {
		case trackId:
			type = 'track';
			break;
		case albumId:
			type = 'album';
			break;
		case artistId:
			type = 'artist';
			break;
		default:
			return; // Error
		}
		
		console.log('looking up type ' + type + ', with query ' + query);
		var lookup = M.Lookup.searchOnType(type, query, function(data) {
			chrome.tabs.sendMessage(tab.id, {command: "open-search", data: data}, 
				function(response) {
					console.log(response);
				}
			);
		});	
	};
	
	function createSubItem(type) {
		// Create track
		var options = {
			parentId: parentId,
			title 	: 'As ' + type,
			contexts: ["selection"],
			onclick : search
		};
		return chrome.contextMenus.create(options);
	};

	return {

		init : function() {
			var options = {
				'title': 'Search for "%s"',
				contexts: ["selection"]
			};
			
			// Create the parent menu item
			parentId = chrome.contextMenus.create(options, function() {
				
				// Create all sub items
				trackId 	= createSubItem('track');
				artistId 	= createSubItem('artist');
				albumId 	= createSubItem('album');
			});

		}

	}
}());
