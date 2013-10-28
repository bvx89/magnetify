// Make M.* equal to empty objects if not defined
var M = M || {};
M.Storage = M.Storage || {};

/**
*	Stores and gets object in localStorage.
*/	
M.Storage = (function() {
	// Indexes
	var INDEX_LINKS 	= 'links';
	var INDEX_INJECTING	= 'injecting';
	var INDEX_ADDRESS 	= 'address';
	var INDEX_LOOKUP	= 'lookup';

	// Default values for types
	var DEFAULT_BOOLEAN = true;

	// Create a function for these to instantiate new variables
	var DEFAULT_ARRAY 	= function(){return new Array()};
	var DEFAULT_OBJECT 	= function(){return {}};

	// Default value for simple variables
	var DEFAULT_MAX_LINKS	= 10;

	/**
	*	Get's an array from localStorage using JSON parser
	*/
	function getObject(index, placeholder) {
		var obj = localStorage[index];
		
		if(!obj) {
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
		// Links
		getLinks : function() {
			return getObject(INDEX_LINKS, DEFAULT_ARRAY());
		},

		setLinks : function(value) {
			setObject(INDEX_LINKS, value);
		},


		// Address
		getAddress : function() {
			return getValue(INDEX_ADDRESS, DEFAULT_BOOLEAN);
		},

		setAddress : function(value) {
			setValue(INDEX_ADDRESS, value);
		},


		// Injecting 
		getInject : function() {
			return getValue(INDEX_INJECTING, DEFAULT_BOOLEAN);
		},

		setInject : function(value) {
			setValue(INDEX_INJECT, value);
		},

		// Lookup
		getLookup : function() {
			return getObject(INDEX_LOOKUP, DEFAULT_ARRAY());
		},

		setLookup : function(value) {
			setObject(INDEX_LOOKUP, value);
		}
	}

}());