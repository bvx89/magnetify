var Magnetify = Magnetify || {},
	jQuery = jQuery || {};

(function (M, $) {
    'use strict';
    
	var LOOKUP_URL = 'http://ws.spotify.com/lookup/1/.json',
        EMBED_URL = 'https://embed.spotify.com/oembed/',
        SEARCH_URL = 'http://ws.spotify.com/search/1/track.json';

	M.Lookup = {
		getDefaultObject : function (uri, callback) {
			// Set up main lookup
			var lookup = $.ajax({
					url: LOOKUP_URL,
					data: {uri: uri},
					dataType: 'json'
				}), 

				embed = $.ajax({
					url: EMBED_URL,
					data: {url: uri},
					dataType: 'json'
				});

			// Wait til both are done
			$.when(lookup, embed).done(function (main, extra) {
				// Set the thumbnail inside the main object
				main[0].thumb = extra[0].thumbnail_url.replace('cover', '60');

				// Add it
				callback(main[0]);
			});
		},

		getSpecialObject : function (uri, callback) {
			// Set up embed lookup
			var embed = $.ajax({
				url: EMBED_URL,
				data: {url: uri},
				dataType: 'json'
			});

			// Wait for query to be done
			$.when(embed).done(function (data) {
				var obj = {};
				obj.info = {};
				obj.playlist = {};

				// Set thumbnail
				obj.thumb = data.thumbnail_url.replace('cover', '60');

				// Find username/user id
				if (uri.indexOf("user") !== -1) {
					obj.user = uri.slice(uri.indexOf("user") + 5,
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
		
		search : function (query, callback) {
			// Set up main lookup
			var search = $.ajax({
				url: SEARCH_URL,
				data: {q: query},
				dataType: 'json'
			});
			
			// Look for the initial array of objects
			$.when(search).done(function (data) {
				var results,
					thumbs,

					// Limit the result by the config limit or length of items
					max = Math.min(data.tracks.length, M.Config.maxNumSongs);	

				// If no results, return
				if (max === 0) {
					callback('empty');
				} else if (!M.Config.showAlbum) {

					// Return plain objects
					callback(data.tracks.slice(0, max));
				} else {
					
					// Prepare an array to store all the thumbnail objects
					results = [];
					
                    thumbs = function () {

						var promises = [];
						for (var i = 0; i < max; i += 1) {
							promises.push($.ajax({
								url: EMBED_URL,
								data: {url: data.tracks[i].album.href},
								dataType: 'json',
								success : function(embedObject) {
									// Extract image
									var img = embedObject.thumbnail_url.replace('cover',
                                                                                '60');

									// Find the uri inside the html property
									var uri = embedObject.html;
									var start = uri.indexOf('uri=') + 4;
									uri = uri.substr(start, 36);
									
									// Start preloading image
									var image = new Image();
									image.src = img;

									// Push result as an object to the results array
									results.push({img: img, uri: uri});
								}
							}));
						}
						return promises;
					};
					

					// Neat hack to await all ajax requests before continuing
					// Read more here: http://stackoverflow.com/a/19859068/1002936
					$.when.apply($, thumbs()).then(function () {
						// Loop through all the original data
						for (var i = 0; i < max; i++) {

							// Check if the indexes are the same first
							var index;
							var uri = data.tracks[i].album.href;
							if (uri === results[i].uri) {
								index = i;
							} else {

								// Index wasn't the same, search all
								for (var j = 0; j < results.length; j++) {
									if (uri === results[j].uri) {
										index = j;
										break;
									}
								}
							}
							
							// Add that thumbnail to the current object
							data.tracks[i].album.img = results[index].img;
						}

						// Return modified object to the user
						callback(data.tracks.slice(0, max));
					});
				}
			});
		}
	};
}(Magnetify, jQuery));