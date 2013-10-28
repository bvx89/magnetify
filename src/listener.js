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
		chrome.runtime.sendMessage({command: "convert-url", link: url}, 
			function(uri) {
				console.log("opening uri: " + uri);
				window.location.href = uri
			}
		);
		
	} else {
		// If no Spotify link, return true
		return true;
	}
}