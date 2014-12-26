var Magnetify = chrome.extension.getBackgroundPage().Magnetify || {},
	chrome = chrome || {},
	document = document || {},
	window = window || {};

(function (M) {
	// DOM elements
	var $form, 
		$span, 
		$address, 
		$inject,
		$image,
		$menu,

	// Settings
		address, 
		inject,
		image,
		menu,
	
	// Background reference
		storage,
		config;

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
		var valAddress 	= $address.checked,
			valInject 	= $inject.checked,
			valImage 	= $image.checked,
			valMenu 	= $menu.checked,
			hasChanged 	= false;

		// Verify that the content has changed
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

		if (valMenu !== menu) {
			storage.setMenu(valMenu);
			menu = valMenu;
			hasChanged = true;
		}
		
		
		// If one of the fields have changed, store it in settings and storage
		if (hasChanged) {
			_gaq.push(['_trackEvent', 'Settings saved', 'clicked']);			
			setInfoText('Saved');
			
		} else {
			setInfoText('Nothing has changed');
		}
	}

	M.Options = {
		init : function(bgWindow) {
			storage = M.Storage;
			config = M.Config;
			
			// Get reference to the form
			$form = document.form;
			
			// Grab elements
			$span		= document.getElementById('res');
			$inject		= $form.elements.inject;			
			$address	= $form.elements.address;
			$image		= $form.elements.image;
			$menu		= $form.elements.menu;
		
			// Get configuration
			inject	= config.injectEnabled;
			address = config.addressEnabled;
			image	= config.showAlbum;
			menu	= config.menu;
			
			// Set current configuration
			$address.checked	= address;
			$inject.checked		= inject;
			$image.checked		= image;
			$menu.checked		= menu;
		
			// Set up listener for form changes
			$form.addEventListener('change', function(){
				var $submit = document.getElementById('submit');
				$submit.disabled = false;
			});
		
			// Set up listener for a form submit
			$form.addEventListener('submit', submitHandler);
			
		}
	};
})(Magnetify);

window.onload = function() {

	Magnetify.Options.init();
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
