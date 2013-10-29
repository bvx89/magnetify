// Make M.* equal to empty objects if not defined
var M = M || {};
M.Storage = M.Storage || {};


M.Options = (function() {
	// Page elements
	var form, span, inAddress, inInject;

	// Settings
	var address, inject;

	function setInfoText(text) {
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
	};

	function submitHandler(evt) {
		evt.preventDefault();

		// Get content
		var valAddress = inAddress.checked;
		var valInject = inInject.checked;
		
		// Verify that the content has changed
		var hasChanged = false;
		if (valAddress !== address) {
			M.Storage.setAddress(valAddress);
			address = valAddress;
			hasChanged = true;
		}
		
		if (valInject !== inject) {
			M.Storage.setInject(valInject);
			inject = valInject;
			hasChanged = true;
		}
		
		if (hasChanged) {
			chrome.runtime.sendMessage({command: 'prefs-changed'});
			_gaq.push(['_trackEvent', 'Settings saved', 'clicked']);
			
			setInfoText('Saved');
			
		} else {
			setInfoText('Nothing has changed');
		}
	};

	return {
		init : function() {
			loadScript('storage', function() {

				// Get reference to the form
				form = document.form;
				
				// Grab elements
				inAddress	= form.elements['address'];
				inInject	= form.elements['inject'];
				span = document.getElementById('res');
			
				// Get configuration
				address = M.Storage.getAddress();
				inject 	= M.Storage.getInject();

				// Set current configuration
				inAddress.checked 	= address;
				inInject.checked 	= inject;
			
				// Set up listener for form changes
				form.addEventListener('change', function(){
					var submitButton = document.getElementById('submit');
					submitButton.disabled = false;
				});
			
				// Set up listener for a form submit
				form.addEventListener('submit', submitHandler);
			});
		}
	}
}());
window.onload = function() {
	M.Options.init();
}

function loadScript(scriptName, callback) {
    var scriptEl = document.createElement('script');
    scriptEl.src = chrome.extension.getURL('lib/' + scriptName + '.js');
    scriptEl.addEventListener('load', callback, false);
    document.head.appendChild(scriptEl);
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
