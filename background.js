var excluded = ["chrome-devtools://", "chrome://newtab/"];
var prefs = {
	injectingEnabled : true,
	addressEnabled : true
}

// Add type and ID to URI
var id_length = 22;

// Init function
function init() {
	// Get options from local storage
	prefs.injectingEnabled = localStorage['injecting'];
	prefs.addressEnabled = localStorage['address'];

	// Set default values if nothing is stored
	if (!prefs.injectingEnabled)
		prefs.injectingEnabled = true;
	
	if (!prefs.addressEnabled)
		prefs.addressEnabled = true;

	setListener();
}

// Set page update listener if needed.
function setListener() {
	if (prefs.injectingEnabled || prefs.addressEnabled) {
		chrome.tabs.onUpdated.addListener(pageUpdated);
	} else {
		chrome.tabs.onUpdated.removeListener(pageUpdated);
	}
}

init();

// Message receiver. Always enabled.
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log('Message recieved:' + request.command);
		// If the request comes from opening the URL
		if (request.command === 'convert-url') {
			var uri = createUriFromURL(request.link);
			sendResponse({link : uri});
		} else if (request.command === 'prefs-changed') {
			console.log(prefs);
			prefs = request.preferences;
			setListener();
			sendResponse('done');
		}
	}
);

function pageUpdated(tabId, changeInfo) {	
	
	// If the site loading is open.spotify.com, do a routine to close tab
	if (prefs.addressEnabled && changeInfo.status === 'loading') {
		chrome.tabs.get(tabId, function(tab) {			
			// Inject site with JS-file if safe
			if (tab.url.indexOf("https://open.spotify.com") !== -1 ||
				tab.url.indexOf("https://play.spotify.com") !== -1) {
			
				handleLinkOpened();
			}
		});
		
	// Inject site with JS if it's valid and done loading
	} else if (prefs.injectingEnabled && changeInfo.status === 'complete') {
		chrome.tabs.get(tabId, function(tab) {			
			// Inject site with JS-file if safe
			if (tab.url.indexOf("chrome-devtools://") === -1 &&
				tab.url.indexOf("chrome://newtab/") === -1) {

				// inject script into web site
				console.log('injecting');
				chrome.tabs.executeScript(tabId, {file : "spot-url.js"});
			}
		});
	} 
}

// Procedure to capture spotify URL, close tab and open spotify URI.
function handleLinkOpened() {
	// Get selected tab
	chrome.tabs.query(	{
						
						"currentWindow": true,
						"active": true,
						"windowType": "normal"
						}, function(spotTab) {
						
		console.log(spotTab[0]);
		// Find URL and convert it to a URI
		var page_url = spotTab[0].url;			
		var uri = createUriFromURL(page_url);
	
		// Remove current page
		chrome.tabs.remove(spotTab[0].id, function() {
			// Get selected tab
			chrome.tabs.query(	{
								"currentWindow": true,
								"active": true,
								"windowType": "normal"
								}, function(currTab) {
				
				// Update URL to Spotify URI
				console.log(page_url + "\n" + uri);
				
				chrome.tabs.update(currTab.id, {url: uri});
				return true;
			});
		});
	});
}

// Filters out info and creates valid URI from a Spotify URL.
function createUriFromURL(URL) {
	var uri = 'spotify:';
	var last_index = (URL.indexOf('?') === -1 ? URL.length-1 : URL.indexOf('?')-1);
	var type;
	
	// Find type
	if (URL.indexOf('track') !== -1) {
		type = 'track';
	} else if (URL.indexOf('artist') !== -1){
		type = 'artist';
	} else if (URL.indexOf('album') !== -1){
		type = 'album';
	} else if (URL.indexOf('user') !== -1){
		// Extract username
		var user_index = URL.indexOf('user/') + 5;
		var user;
		
		// If normal playlist, we need ID. If not, just return.
		if (URL.indexOf('playlist') !== -1) {
			type = 'playlist';
			
			user = URL.substr(user_index, URL.indexOf('/playlist') - user_index);
			uri += 'user:' + user + ':';
		} else {
			// Add 'starred' for starred playlist and extract usernames for both
			if (URL.indexOf('starred') !== -1) {
				user = URL.substr(user_index, last_index - URL.indexOf('/starred'));
				uri += 'user:' + user + ':';
				
				uri += 'starred';
			} else {
				user = URL.substr(user_index, last_index);
				uri += 'user:' + user + ':';
			}
			
			return uri;
		}
	}
	
	uri += type + ':' + URL.substr(URL.indexOf(type) + type.length+1, id_length);
	
	return uri;
}