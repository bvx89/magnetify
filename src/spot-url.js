// Add global listener to click events on a page
if (addedSpotifyListener == undefined) {
	document.addEventListener('click', callback, false);
}

// Callback function for the click event
function callback(e) {
    var e = window.e || e;

	// If not a link, return
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
		chrome.runtime.sendMessage({command: "convert-url", link: url});
		
	} else {
		return true;
	}
}

var addedSpotifyListener = true;