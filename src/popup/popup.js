// Make M.* equal to empty objects if not defined
var M = M || {};
M.Storage = M.Storage || {};

M.Popup = (function() {
	var template;
	var container;
	function render(data, index) {
		// Clone the template
		var t = $(template).clone();

		// Set the thumbnail pic
		t.find('img')[0].src = data.thumb;

		// Register click events
		t.on('click', function() {
			var url = $(this).data('url');
			// window.close();
			console.log(url);
			chrome.runtime.sendMessage({command: "open-uri", link: url});
		});

		// Set ID of link
		t.attr('id', (index+1));

		// Find out which type of data
		switch (data.info.type) {
			case 'track':
				renderTrack(data.track, t);
				break;
			case 'album':
				renderAlbum(data.album, t);
				break;
			case 'artist':
				renderArtist(data.artist, t);
				break;
			case 'playlist':
				renderPlaylist(data.playlist, t);
				break;
		}

		// Append link
		$(container).append(t);
	}

	function renderPlaylist(data, t) {
		t.data('url', data.href);
		t.find('.track')[0].innerHTML = data.id;
		t.find('.artist')[0].innerHTML = 'Playlist ID:';
	}

	function renderArtist(data, t) {
		t.data('url', data.href);
		t.find('.track')[0].innerHTML = data.name;
		t.find('.artist')[0].innerHTML = 'Artist:';
	}
	
	function renderAlbum(data, t) {
		t.data('url', data.href);
		t.find('.artist')[0].innerHTML = data.artist;
		t.find('.track')[0].innerHTML = data.name;
	}

	function renderTrack(data, t) {
		t.data('url', data.href);
		t.find('.artist')[0].innerHTML = data.artists[0].name;
		t.find('.track')[0].innerHTML = data.name;
	}

	function renderAll() {
		var objects = M.Storage.getLookup();
		for(var i in objects) {
			render(objects[i], i);
		}

		addAnimation();
	}

	function addAnimation() {
		$('.link div').hover(function(){
		    $(this).addClass('hover');
		}, function() {
			$(this).removeClass('hover');
		});

	}

	return {
		init : function() {
			loadScript('storage', function() {
				// Find the template to use for links and
				// the container to append each link to
				template = $( '#tmpl' );
				container = $( '#container' );		

				renderAll();
			});
		},

		
		render : function() {
			renderAll();
		}
	}

}());

$(document).ready(function() {
	/*
	 * The worst hack ever to fix the scrollbar issue  
	 * when opening the Browser UI popup
	 */	
	 /*
	document.body.style.width = "301px"
	setTimeout(function() {
		document.body.style.width = "300px"
		}, 50);
*/

	M.Popup.init();
});


// Render the popup in background
chrome.runtime.onMessage.addListener(function(message, sender, response) {
	if (message.command === 'render-popup') {
		M.Popup.render();
	}
});


function loadScript(scriptName, callback) {
    var scriptEl = document.createElement('script');
    scriptEl.src = chrome.extension.getURL('lib/' + scriptName + '.js');
    scriptEl.addEventListener('load', callback, false);
    document.head.appendChild(scriptEl);
}