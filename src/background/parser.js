M.Parser = (function() {
	// When parsing spoti.fi URLs, how far down the page should
	// the index be before starting to search for keyword
	var lengthFromEndOfPage = 800;

	// Add type and ID to URI
	var id_length = 22;

	// The word to look for inside the HTML page
	var keywordInHTML = 'landingURL';

	// Filters out info and creates valid URI from a Spotify URL.
	function createUriFromURL(URL) {
		var uri = 'spotify:';
		var last_index = (URL.indexOf('?') === -1 ? URL.length-1 : URL.indexOf('?')-1);
		var type;
		
		// Find type
		if (URL.indexOf('track') !== -1) {
			type = 'track';
		} else if (URL.indexOf('artist') !== -1){
			type = 'artist';
		} else if (URL.indexOf('album') !== -1){
			type = 'album';
		} else if (URL.indexOf('user') !== -1){
			// Extract username
			var user_index = URL.indexOf('user/') + 5;
			var user;
			
			// If normal playlist, we need ID. If not, just return.
			if (URL.indexOf('playlist') !== -1) {
				type = 'playlist';
				
				user = URL.substr(user_index, URL.indexOf('/playlist') - user_index);
				uri += 'user:' + user + ':';
			} else {
				// Add 'starred' for starred playlist and extract usernames for both
				if (URL.indexOf('starred') !== -1) {
					user = URL.substr(user_index, last_index - URL.indexOf('/starred'));
					uri += 'user:' + user + ':';
					
					uri += 'starred';
				} else {
					user = URL.substr(user_index, last_index);
					uri += 'user:' + user + ':';
				}
				
				return uri;
			}
		}
		
		uri += type + ':' + URL.substr(URL.indexOf(type) + type.length+1, id_length);
		
		return uri;
	};

	// Finds Spotify URL inside a Spotify page
	function findUriFromHTML(page) {
		// Find the correct URL from the JavaScript
		var start = page.indexOf(keywordInHTML, page.length - lengthFromEndOfPage);
		var end = page.indexOf('"', start + 15);
		var unparsed = '"' + page.substring(start + 13, end) + '"';
		
		var parsed = JSON.parse(unparsed)
		return createUriFromURL(parsed);

	};

	return {
		createUriFromURL : function (URL) {
			return createUriFromURL(URL);
		}
	}
}());