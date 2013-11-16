// Get the background window object
var M = M || {},
	window = window || {},
	document = document || {},
	chrome = chrome || {};


M.Popup = (function ($) {
	'use strict';
	
	// DOM
	var $template,
		$container,
	
	// Objects to render
		objects,
	
	// Background
		page;
	
	function render(data, index) {
		// Clone the template
		var $t = $($template).clone();

		// Set the thumbnail pic
		$t.find('img')[0].src = data.thumb;

		// Register click events
		$t.on('click', function () {
			var url = $(this).data('url');
			_gaq.push(['_trackEvent', 'Top List link', 'clicked']);
			page.setURIofTab(undefined, url);
			// chrome.runtime.sendMessage({command: "open-uri", link: url});
		});

		// Set ID of link
		$t.attr('id', +(index+1));

		// Find out which type of data
		switch (data.info.type) {
			case 'track':
				renderTrack(data.track, $t);
				break;
			case 'album':
				renderAlbum(data.album, $t);
				break;
			case 'artist':
				renderArtist(data.artist, $t);
				break;
			case 'playlist':
				renderPlaylist(data.playlist, $t);
				break;
		}

		// Append link
		$($container).append($t);
	}

	function renderPlaylist(data, $t) {
		$t.data('url', data.href);
		$t.find('.track')[0].innerHTML = data.id;
		$t.find('.artist')[0].innerHTML = 'Playlist ID:';
	}

	function renderArtist(data, $t) {
		$t.data('url', data.href);
		$t.find('.track')[0].innerHTML = data.name;
		$t.find('.artist')[0].innerHTML = 'Artist:';
	}
	
	function renderAlbum(data, $t) {
		$t.data('url', data.href);
		$t.find('.artist')[0].innerHTML = data.artist;
		$t.find('.track')[0].innerHTML = data.name;
	}

	function renderTrack(data, $t) {
		$t.data('url', data.href);
		$t.find('.artist')[0].innerHTML = data.artists[0].name;
		$t.find('.track')[0].innerHTML = data.name;
	}

	function renderAll() {
		$.each(objects, function (i, item) {
			render(item, i);
		});

		addAnimation();
	}

	function addAnimation() {
		$('.link div').hover(function (){
			$(this).addClass('hover');
		}, function() {
			$(this).removeClass('hover');
		});

	}

	return {
		init : function (bgWindow) {
			objects = bgWindow.M.getLookupObjects();
			page = bgWindow.M.Page;
			
			// Find the template to use for links and
			// the container to append each link to
			$template = $('#tmpl');
			$container = $('#container');

			renderAll();
		},

		
		render : function () {
			renderAll();
		}
	};

}(jQuery));

window.onload = function() {
	chrome.runtime.getBackgroundPage(M.Popup.init);
};

// GOOGLE ANALYTICS
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-43115914-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();