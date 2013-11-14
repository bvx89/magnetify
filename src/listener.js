// Add global listener to click events on a page
document.addEventListener('click', callback, false);

// Callback function for the click event
function callback(e) {
    var e = window.e || e;

	// If not a link, return true
    if (e.target.tagName !== 'A')
        return true;

	// If URL is pointed to spotify, send URL to background.js
	var url = e.target.href;
	if (url.indexOf('open.spotify.com') !== -1 || url.indexOf('spoti.fi') !== -1) {
		
		// Stop the page from loading URL, and instead open URI.
		e.preventDefault();
		
		// If it's a Facebook.com redirect, change url.
		if (url.indexOf('facebook.com') !== -1 ) {
			url = e.target.innerHTML;
		}
		
		// Get URI from background page
		chrome.runtime.sendMessage({command: 'convert-url', link: url}, 
			function(uri) {
				console.log('opening uri: ' + uri);
				window.location.href = uri;
			}
		);
		
	} else {
		// If no Spotify link, return true
		return true;
	}
}

chrome.runtime.onMessage.addListener(
	function(message, sender, response) {
		if (message.command === 'inject-uri') {
			response('opening uri');
			window.location.href = message.link;
		} else if (message.command === 'open-search') {

			console.log(message.data);
			Dialog.show(message.data);
		}
	}
);

Dialog = (function() {
	var maxItems = 10;

	var overlay = {
		type: 'div',
		style: 'position: fixed !important;' +
				'width: 100% !important;' +
				'height: 100% !important;' +
				'background: rgba(0,0,0,0.4) !important;' +
				'z-index: 500 !important;'
	};

	var box = {	
		type: 'div',
		style: 'width: 350px;' +
				'height: 500px;' +
				'position: fixed;' +
				'top: 50%;' +
				'left: 50%;' +
				'margin-left: -175px;' +
				'margin-top:	-250px;' +
				'border: 1px solid black;' +
				'background: rgb(43,43,43);' +
				'background: -webkit-linear-gradient(top, rgb(30,30,30)' +
				'0%,rgb(15,15,15) 31%,rgb(15,15,15) 100%);' +
				'box-shadow: 0px 0px 60px 10px #fff;' +
				'overflow-x: hidden;' +
				'overflow-y: auto;' +
				'color: #eee'
	};

	var header = {	
		type : 'header',
		style: 'text-align: center;' +
				'border-bottom: 1px rgb(50, 50, 50) solid;' +
				'top: 0px;' +
				'left: 0px;' +
				'right: 0px;' +
				'background: rgba(40, 40, 40, 0.8);' +
				'height: 40px;' +
				'width: inherit;' +
				'padding-top: 5px;'
	};

	var h1 = {
		type: 'h1',
		style: 'font-size: 30px;' +
				'margin: 0px;' +
				'text-align: center;' +
				'color: #eee'
	};

	var tmpl = {
		type : 'div',
		style: 'position: relative;' +
				'width: inherit;' +
				'border-bottom: 1px solid rgb(20, 20, 20);' +
				'height: 45px;' +
				'background: rgba(255,255,255, 0.1);' +
				'color: rgb(250, 250, 250);' +
				'-webkit-user-select: none;' +
				'user-select: none;'
	};

	var a =  {
		type : 'a',
		style : 'text-decoration: none'
	};

	var link = {
		type : 'div',
		style: 'width: inherit;' +
				'height: 45px;'
	};

	var artist =  {
		type : 'h4',
		style: 'margin: 0px 0px 0px 10px;' +
				'padding-top: 2px;' +
				'overflow: hidden;' +
				'font-size: 15px;' +
				'height: 18px;' +
				'color: #eee'
	};

	var track =  {
		type : 'h3',
		style: 'margin: 0px 0px 0px 10px;' +
				'padding-top: 2px;' +
				'overflow: hidden;' +
				'font-size: 17px;' +
				'height: 22px;' +
				'color: #eee'
	};

	function genEl(el) {
		var newEl = document.createElement(el.type);
		newEl.setAttribute('style', el.style);
		return newEl;
	}

	function generateDOM(data) {
		
		// Get overlay to have as base template
		var $overlay = genEl(overlay);
		$overlay.id = 'overlay';

		// Show informative string if empty
		if (data.length === 0) {
			var $track = genEl(track);
			$track.innerHTML = 'No results';
			$overlay.appendChild(track);

		} else {
			// Get the box to append all links to
			var $box = genEl(box);

			// Start by appending the header
			var $header = genEl(header);
			var $h1 = genEl(h1);
			$h1.innerHTML = 'Search Result';
			$header.appendChild($h1);
			$box.appendChild($header);

			// Get template for each link
			var $tmpl = genEl(tmpl);

			// Loop through objects and render content
			var max = Math.min(maxItems, data.length);
			for(var i = 0; i < max; i++) {
				var $current = $tmpl.cloneNode();

				$current.id = (i+1);
				
				// Get/set main link
				var $a = genEl(a);
				$a.href = data[i].href;

				// Get artists
				var artists = data[i].artists[0].name;
				for (var j = 1; j<data[i].artists.length; j++) {
					artists += ', ' + data[i].artists[j].name;
				}

				// Set artists
				var $artists = genEl(artist);
				$artists.innerHTML = artists;

				// Get/Set track
				var trackName = data[i].name;
				var $track = genEl(track);
				$track.innerHTML = trackName;

				// Create link and append artist/track
				var $link = genEl(link);
				$link.className = '_link';
				$link.appendChild($artists);
				$link.appendChild($track);

				// Append link to 'a'
				$a.appendChild($link);

				// Append content to current
				$current.appendChild($a);

				// Store the current object
				$box.appendChild($current);
			}

			$overlay.appendChild($box);
			return $overlay;
		}
	};

	return {
				
		show : function(data) {
			var overlay = generateDOM(data);
			document.body.insertBefore(overlay, document.body.firstChild);


			overlay.addEventListener('click', function() {
				document.body.removeChild(overlay);
			}, false);

			
		}
	}
}());

console.log('injected');