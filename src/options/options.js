var prefs = {
	injectingEnabled : true,
	addressEnabled : true
}

var form;
var iLink;
var iUrl;
var span;

window.onload = function() {
	// Get options from local storage
	prefs.injectingEnabled = localStorage['injecting'];
	prefs.addressEnabled = localStorage['address'];

	// Set default values if nothing is stored
	if (!prefs.injectingEnabled)
		prefs.injectingEnabled = true;
	
	if (!prefs.addressEnabled)
		prefs.addressEnabled = true;
	
	// Convert from strings to boolean
	prefs.injectingEnabled = (prefs.injectingEnabled === "false" ? false : true);
	prefs.addressEnabled = (prefs.addressEnabled === "false" ? false : true)
	
	// Get reference to the form
	form = document.form;
	
	// Grab elements
	iLink = form.elements['link'];
	iUrl = form.elements['url'];
	span = document.getElementById('res');
	
	// Set current configuration
	iLink.checked = prefs.injectingEnabled;
	iUrl.checked = prefs.addressEnabled;
	
	// Set up listener for form changes
	form.addEventListener('change', function(){
		var submitButton = document.getElementById('submit');
		submitButton.disabled = false;
	});
	
	// Set up listener for a form submit
	form.addEventListener('submit', function(evt){
		evt.preventDefault();

		// Get content
		var link = iLink.checked;
		var url = iUrl.checked;
		
		// Verify that the content has changed
		var hasChanged = false;
		if (link !== prefs.injectingEnabled) {
			localStorage['injecting'] = link;
			prefs.injectingEnabled = link;
			hasChanged = true;
		}
		
		if (url !== prefs.addressEnabled) {
			localStorage['address'] = url;
			prefs.addressEnabled = url;
			hasChanged = true;
		}
		
		if (hasChanged) {
			chrome.runtime.sendMessage({command: 'prefs-changed', 
				preferences : prefs});
			_gaq.push(['_trackEvent', 'Settings saved', 'clicked']);
			
			setInfoText('Saved');
			
		} else {
			setInfoText('Nothing has changed');
		}
	});
}

var setInfoText = function(text) {
	span.innerText = text;
		
	// Removing the animation class
	span.classList.remove('run-animation');

	// Triggering reflow /* The actual magic */
	span.offsetWidth = span.offsetWidth;

	// Re-adding the animation class
	span.classList.add('run-animation');
	
	// Remove text when animation is done
	
	span.addEventListener('webkitAnimationEnd', function(){
		span.innerText = '';
	});
}


// GOOGLE ANALYTICS
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-43115914-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

