M.Lookup = (function($) {
	var LOOKUP_URL = 'http://ws.spotify.com/lookup/1/.json?uri=';
	var EMBED_URL = 'https://embed.spotify.com/oembed/';
	var SEARCH_URL = 'http://ws.spotify.com/search/1/{0}.json';

	return {
		getDefaultObject : function(uri, callback) {
			// Set up main lookup
			var lookup = $.ajax({
				url: LOOKUP_URL,
				data: {uri: uri},
				dataType: 'json'
			});

			// Set up embed lookup
			var embed = $.ajax({
				url: EMBED_URL,
				data: {url: uri},
				dataType: 'json'
			});

			// Wait til both are done
			$.when(lookup, embed).done(function(main, extra) {
				// Set the thumbnail inside the main object
				main[0].thumb = extra[0].thumbnail_url.replace('cover', '60');

				// Add it
				callback(main[0]);
			});
		},

		getSpecialObject : function(uri, callback) {
			// Set up embed lookup
			var embed = $.ajax({
				url: EMBED_URL,
				data: {url: uri},
				dataType: 'json'
			});

			// Wait for query to be done
			$.when(embed).done(function(data) {
				var obj = {};
				obj.info = {};
				obj.playlist = {};

				// Set thumbnail
				obj.thumb = data.thumbnail_url.replace('cover', '60');

				// Find username/user id
				if (uri.indexOf("user") !== -1) {
					obj.user = uri.slice(	uri.indexOf("user") + 5, 
							uri.indexOf(":", uri.indexOf("user") + 5));

				}

				// find playlist id
				if (uri.indexOf("playlist") !== -1) {
					obj.playlist.id = uri.slice(uri.indexOf("playlist") + 9);
					obj.info.type = 'playlist';
				}

				// Add uri
				obj.playlist.href = uri;

				callback(obj);
			});
		},
		
		searchOnType : function(type, query, callback) {
			var URL = String.format(SEARCH_URL, type);
			
			// Set up main lookup
			var search = $.ajax({
				url: URL,
				data: {q: query},
				dataType: 'json'
			});
			
			$.when(search).done(function(data) {
				callback(data);
			});
		}
	}
}(jQuery));


if (!String.format) {
  String.format = function (format) {

    var args = Array.prototype.slice.call(arguments, 1);

    var sprintf = function (match, number) {
      return number in args ? args[number] : match;
    };

    var sprintfRegex = /\{(\d+)\}/g;

    return format.replace(sprintfRegex, sprintf);
  };
}