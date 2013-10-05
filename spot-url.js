// Add global listener to click events on a page
document.addEventListener('click', callback, false);

// Callback function for the click event
function callback(e) {
    var e = window.e || e;

    if (e.target.tagName !== 'A')
        return;
	
	// If a URL isn't aimed at open.spotify.com, return.
	var url = e.target.href;
    if (url.indexOf('open.spotify.com') === -1) {
		return;
	} else {
		// If it's a Facebook.com redirect, change url.
		if (url.indexOf('facebook.com') !== -1 ) {
			url = e.target.innerHTML;
		}
		
		// Stop the page from loading URL, and instead open URI.
		e.preventDefault();
		
		// Get URI from background page
		chrome.runtime.sendMessage({command: "convert-url", link: url}, function(response) {
			var uri = response.link;
			window.location.href = uri;
			console.log(uri);
		});
		
	}
}