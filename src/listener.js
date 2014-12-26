// Callback function for the click event
var ClickListener = (function () {
	'use strict';
	
	var spotLinks = [
			'open.spotify.com',
			'spoti.fi'
		],
		
		faceLinks = [
			'facebook.com'
		];
	
	function isSpotifyLink(link) {
		return link.indexOf(spotLinks[0]) !== -1 ||
				link.indexOf(spotLinks[1]) !== -1;
		
	}
	
	return {
		handleClick : function (e) {
			e = window.e || e;
		
			// If not a link, return true
			if (e.target.tagName !== 'A') {
				return true;
			}
				
			// If URL is pointed to spotify, send URL to background.js
			var url = e.target.href;
			if (isSpotifyLink(url)) {
				
				// Stop the page from loading URL, and instead open URI.
				e.preventDefault();
				
				// If it's a Facebook.com redirect, change url.
				if (url.indexOf('facebook.com') !== -1) {
					url = e.target.innerHTML;
				}
				
				// Get URI from background page
				chrome.runtime.sendMessage({command: 'convert-url',
											link: url},
					function (uri) {
						window.location.href = uri;
					});
				
			} else {
				// If no Spotify link, return true
				return true;
			}
		}
	};
}());

var Dialog = (function () {
	'use strict';

	var overlay = {
			type: 'div',
			style: 'position: fixed;' +
				'width: 100%;' +
				'height: 100%;' +
				'background: rgba(0,0,0,0.4);' +
				'z-index: 500;'
		},
		
		h1 = {
			type: 'h1',
			style: 'font-family: Arial;' +
				'font-size: 50px;' +
				'margin: 0px;' +
				'text-align: center;' +
				'color: #eee;' +
				'line-height: 100px'
		},
		
		loadBox = {
			type: 'div',
			style: 'position: absolute;' +
				'width: 300px;' +
				'height: 100px;' +
				'top: 50%;' +
				'left: 50%;' +
				'margin-left: -150px;' +
				'margin-top: -50px;'
		},
		box = {
			type: 'div',
			style: 'width: 350px;' +
				'min-height: 500px;' +
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
		},

		header = {
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
		},

		h2 = {
			type: 'h2',
			style: 'font-family: Arial;' +
				'font-size: 30px;' +
				'margin: 0px;' +
				'text-align: center;' +
				'color: #eee'
		},

		tmpl = {
			type : 'div',
			style: 'position: relative;' +
				'width: inherit;' +
				'border-bottom: 1px solid rgb(20, 20, 20);' +
				'height: 45px;' +
				'color: rgb(250, 250, 250);' +
				'-webkit-user-select: none;' +
				'user-select: none;'
		},

		a =  {
			type : 'a',
			style : 'text-decoration: none'
		},

		link = {
			type : 'div',
			style: 'width: inherit;' +
				'height: 45px;'
		},

		artist =  {
			type : 'h4',
			style: 'font-family: Arial;' +
				'margin: 0px 0px 0px 10px;' +
				'padding-top: 2px;' +
				'overflow: hidden;' +
				'font-size: 15px;' +
				'height: 18px;' +
				'color: #eee'
		},

		track =  {
			type : 'h3',
			style: 'font-family: Arial;' +
				'margin: 0px 0px 0px 10px;' +
				'padding-top: 2px;' +
				'overflow: hidden;' +
				'font-size: 17px;' +
				'height: 22px;' +
				'color: #eee'
		},
		
		img = {
			type : 'img',
			style: 'width: 40px;' +
				'height: 40px;' +
				'float: left;' +
				'margin-right: 5px;' +
				'margin-top: 3px;'
		},

		
		// CSS styling
		linkHover = {
			name : 'div:hover',
			style: 'background: rgba(255,255,255, 0.2)'
		},
		evenBg = 'rgba(255,255,255, 0.1)',
		oddBg = 'rgba(250,250,250, 0.1)',

				
		// global DOM elements
		$style,
		$loadBox,
		$overlay,
		
		// Keep track of whether to generate new background box or not
		isOverlayCreated = false;
	
	/*
	*	Helper function to generate DOM-elements with a defined style.
	*/
	function genEl(el) {
		var newEl = document.createElement(el.type);
		newEl.setAttribute('style', el.style);
		return newEl;
	}
	
	/*
	*	Notifies Magnetify to store the URI
	*/
	function songClicked() {
		chrome.runtime.sendMessage({command: 'store-uri', link: this.href});
	}

	/*
	*	Given a data object, creates a list of all links
	*/
	function createListDOM(data) {
		// DOM-elements
		var $box,
			$header,
			$h2,
			$tmpl,
			$current,
			$artists,
			$track,
			$link,
			$a,
			$img,
			
		// Local variables
			max,
			i,
			j,
			l,
			artists,
			trackName;

		// Show informative string if empty
		console.log(data);
		if (data.length === 0) {
			$track = genEl(track);
			$track.innerHTML = 'No results';
			$overlay.appendChild(track);

		} else {
			// Get the box to append all links to
			$box = genEl(box);

			// Start by appending the header
			$header = genEl(header);
			$h2 = genEl(h2);
			$h2.innerHTML = 'Search Result';
			$header.appendChild($h2);
			$box.appendChild($header);

			// Get template for each link
			$tmpl = genEl(tmpl);

			// Loop through objects and render content
			for (i = 0, max = data.length; i < max; i += 1) {
				$current = $tmpl.cloneNode();
				$current.style.backgroundColor = (i % 2 === 0 ? evenBg : oddBg);
				$current.className = 'linkHover';
				$current.id = (i + 1);
				
				// Get/set main link
				$a = genEl(a);
				$a.href = data[i].href;
				
				// Get artists
				artists = data[i].artists[0].name;
				for (j = 1, l = data[i].artists.length; j < l; j += 1) {
					artists += ', ' + data[i].artists[j].name;
				}

				// Set artists
				$artists = genEl(artist);
				$artists.innerHTML = artists;

				// Get/Set track
				trackName = data[i].name;
				$track = genEl(track);
				$track.innerHTML = trackName;

				// Create link
				$link = genEl(link);
				$link.className = '_link';
				
				// Append items to the link
				if (data[i].album.img !== undefined) {
					$img = genEl(img);
					$img.src = data[i].album.img;
					$link.appendChild($img);
				}
				$link.appendChild($artists);
				$link.appendChild($track);

				// Append link to 'a'
				$a.appendChild($link);
				$a.onclick = songClicked;

				// Append content to current
				$current.appendChild($a);

				// Store the current object
				$box.appendChild($current);
			}

			$overlay.appendChild($box);
		}
	}
	
	function addLoad() {
		var $h1 = genEl(h1);
		$h1.innerHTML = 'Loading...';
		
		$loadBox = genEl(loadBox);
		$loadBox.appendChild($h1);
	
		$overlay.appendChild($loadBox);
	}
	
	function removeOverlay(e) {
		// TODO store clicked link
		document.body.removeChild($overlay);
		document.body.removeChild($style);
	}

	return {
				
		renderData : function (data) {
			// Generate a new DOM element from the data
			createListDOM(data);

			// Remove the loader
			$overlay.removeChild($loadBox);

			// Listener to close the overlay when clicked
			$overlay.addEventListener('click', removeOverlay, false);
		},
		
		showLoading : function () {
			// Initiate overlay
			$overlay = genEl(overlay);
			$overlay.id = 'overlay';
			
			addLoad();
			
			// Insert the overlay with elements
			document.body.insertBefore($overlay, document.body.firstChild);
			
			// Add custom class for styling the hovering
			$style = document.createElement('style');
			$style.type = 'text/css';
			$style.innerHTML = linkHover.name + '{' + linkHover.style + '}';
			$style.innerHTML += 'body{ margin: 0; padding: 0; }';
			document.body.appendChild($style);
			
		},
		
		dismiss : function () {
			removeOverlay();
		}
	};
}());

// Add global listener to click events on a page
document.addEventListener('click', ClickListener.handleClick, false);

chrome.runtime.onMessage.addListener(
	function (message, sender, response) {
		'use strict';
		
		switch (message.command) {
		case 'open-search':
			Dialog.renderData(message.data);
			break;
		case 'loading':
			Dialog.showLoading();
			response();
			break;
		case 'empty':
			Dialog.dismiss();
			break;
		default:
			return;
		}
	}
);
