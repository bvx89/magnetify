var M = M || {},
	chrome = chrome || {},
	document = document || {},
	window = window || {};

M.Options = (function() {
	// DOM elements
	var $form, 
		$span, 
		$address, 
		$inject,
		$image,

	// Settings
		address, 
		inject,
		image,
	
	// Background reference
		storage,
		settings;

	function setInfoText(text) {
		$span.innerText = text;
			
		// Removing the animation class
		$span.classList.remove('run-animation');

		// Triggering reflow /* The actual magic */
		$span.offsetWidth = $span.offsetWidth;

		// Re-adding the animation class
		$span.classList.add('run-animation');
		
		// Remove text when animation is done		
		$span.addEventListener('webkitAnimationEnd', function(){
			$span.innerText = '';
		});
	}

	function submitHandler(evt) {
		evt.preventDefault();

		// Get content
		var valAddress = $address.checked;
		var valInject = $inject.checked;
		var valImage = $image.checked;
		
		// Verify that the content has changed
		var hasChanged = false;
		if (valAddress !== address) {
			storage.setAddress(valAddress);
			address = valAddress;
			hasChanged = true;
		}
		
		if (valInject !== inject) {
			storage.setInject(valInject);
			inject = valInject;
			hasChanged = true;
		}
		
		if (valImage !== image) {
			storage.setImage(valInject);
			image = valImage;
			hasChanged = true;
		}
		
		
		// If one of the fields have changed, store it in settings and storage
		if (hasChanged) {
			settings.setListenerSettings(inject, address);				
			settings.setImage(image);
			
			storage.setInject(inject);
			storage.setAddress(address);
			storage.setImage(image);
			
			_gaq.push(['_trackEvent', 'Settings saved', 'clicked']);			
			setInfoText('Saved');
			
		} else {
			setInfoText('Nothing has changed');
		}
	}

	return {
		init : function() {
			storage = bgWindow.M.Storage;
			settings = bgWindow.M.Settings;
			
			// Get reference to the form
			$form = document.form;
			
			// Grab elements
			$span		= document.getElementById('res');
			$inject		= $form.elements.inject;			
			$address	= $form.elements.address;
			$image		= $form.elements.image;
		
			// Get configuration
			inject	= settings.isInjecting();;
			address = settings.isAddressChecking();
			image	= settings.isShowingAlbum();
			
			// Set current configuration
			$address.checked	= address;
			$inject.checked		= inject;
			$image.checked		= image;
		
			// Set up listener for form changes
			$form.addEventListener('change', function(){
				var $submit = document.getElementById('submit');
				$submit.disabled = false;
			});
		
			// Set up listener for a form submit
			$form.addEventListener('submit', submitHandler);
			
		}
	};
}());

// Get the background window object to access the storage
var bgWindow = chrome.extension.getBackgroundPage();

window.onload = function() {
	M.Options.init();
};

// GOOGLE ANALYTICS
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-43115914-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
