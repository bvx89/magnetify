// Make M.* equal to empty objects if not defined
var M = M || {};

/**
*	Stores and gets object in localStorage or chrome storage.
*/	
M.Storage = (function() {
	// Indexes
	var INDEX_LINKS 	= 'links';
	var INDEX_INJECT	= 'injecting';
	var INDEX_ADDRESS 	= 'address';
	var INDEX_LOOKUP	= 'lookup';

	// Default values for types
	var DEFAULT_BOOLEAN = function(){return true};
	var DEFAULT_ARRAY 	= function(){return new Array()};
	var DEFAULT_OBJECT 	= function(){return {}};

	/**
	*	Get's an array from localStorage using JSON parser
	*/
	function getObject(index, placeholder) {
		var obj = localStorage[index];
		
		console.log(obj);
		
		if(!obj || obj === 'undefined') {
			obj = placeholder;
		} else {
			obj = JSON.parse(obj);
		}

		return obj;
	};

	/**
	*	Get's a boolean value from local storage
	*/
	function getValue(index, placeholder) {
		var obj = localStorage[index];
		
		// Verify it's an object, and that it's either true or false
		if(!obj) {
			obj = placeholder;
		} else if(obj === 'true') {
			obj = true;
		} else if(obj === 'false') {
			obj = false;
		}

		return obj;
	};

	function setValue(index, value) {
		localStorage[index] = value;
	};

	function setObject(index, value) {
		localStorage[index] = JSON.stringify(value);
	};


	return {
		// Address
		getAddress : function() {
			return getValue(INDEX_ADDRESS, DEFAULT_BOOLEAN());
		},

		setAddress : function(value) {
			setValue(INDEX_ADDRESS, value);
		},


		// Injecting 
		getInject : function() {
			return getValue(INDEX_INJECT, DEFAULT_BOOLEAN());
		},

		setInject : function(value) {
			setValue(INDEX_INJECT, value);
		},


		// Links
		getLinks : function(callback) {
			return getObject(INDEX_LOOKUP, DEFAULT_ARRAY());
		},

		setLinks : function(value, callback) {
			setObject(INDEX_LINKS, value);
		},

		setSyncLinks : function(value, callback) {
			chrome.storage.sync.set({'links': value}, callback);
			setObject(INDEX_LINKS, value);
		},


		// Lookup
		getLookup : function() {
			return getObject(INDEX_LOOKUP, DEFAULT_OBJECT());
		},

		setLookup : function(value) {
			setObject(INDEX_LOOKUP, value);
		},

		setSyncLookup : function(value, callback) {
			chrome.storage.sync.set({'lookup': value}, callback);
			setObject(INDEX_LOOKUP, value);
		},

		// Syncs the localStorage objects
		sync : function(callback) {
			chrome.storage.sync.get('lookup', function(o1) {
				var lookup = o1.lookup || DEFAULT_ARRAY();
				setObject(INDEX_LOOKUP, lookup);

				chrome.storage.sync.get('links', function(o2) {
					var links = o2.links || DEFAULT_ARRAY();
					setObject(INDEX_LINKS, links);

					// Notify and return new values
					callback(lookup, links);
				});
			});
		}
	}

}());