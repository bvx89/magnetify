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

	
		$(container).append(t);

		// Find out which type of data
		switch (data.info.type) {
			case 'track':
				renderTrack(data.track, t, index);
				break;
		}
	}
	
	function renderTrack(data, t, index) {
		t.data('url', data.href);
		t.attr('id', index);
		
		t.find('.artist')[0].innerHTML = data.artists[0].name;
		t.find('.track')[0].innerHTML = data.name;

		t.on('click', function() {
			console.log(this);
			var g = this;
			var url = $(this).data('url');
			console.log('url: ' + url);
			window.close();
			chrome.runtime.sendMessage({command: "open-uri", link: url});
			console.log('sent message');
		});
		t.hover(function() {
			$(this).addClass('hover');
		}, function() {
			$(this).removeClass('hover');
		});
	}

	function renderAll() {
		var objects = M.Storage.getLookup();
		for(var i in objects) {
			render(objects[i], i);
		}
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
	document.body.style.width = "301px"
	setTimeout(function() {
		document.body.style.width = "300px"
		}, 50);

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