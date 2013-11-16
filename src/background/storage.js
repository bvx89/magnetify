var M = M || {},
	chrome = chrome || {},
	localStorage = localStorage || {};

/**
*	Stores and gets object in localStorage or chrome storage.
*/
M.Storage = (function () {
	'use strict';
	
	// Indexes
	var INDEX_LINKS		= 'links',
		INDEX_INJECT	= 'injecting',
		INDEX_ADDRESS	= 'address',
		INDEX_LOOKUP	= 'lookup',
		INDEX_IMAGE		= 'image';

	// Default values for types
	function DEFAULT_BOOLEAN() { return true; }
	function DEFAULT_ARRAY() { return []; }
	function DEFAULT_OBJECT() { return {}; }

	/**
	*	Get's an array from localStorage using JSON parser
	*/
	function getObject(index, placeholder) {
		var obj = localStorage[index];
		
		if (!obj || obj === 'undefined') {
			obj = placeholder;
		} else {
			obj = JSON.parse(obj);
		}

		return obj;
	}

	/**
	*	Get's a boolean value from local storage
	*/
	function getValue(index, placeholder) {
		var obj = localStorage[index];
		
		// Verify it's an object, and that it's either true or false
		if (!obj) {
			obj = placeholder;
		} else if (obj === 'true') {
			obj = true;
		} else if (obj === 'false') {
			obj = false;
		}

		return obj;
	}

	function setValue(index, value) {
		localStorage[index] = value;
	}

	function setObject(index, value) {
		localStorage[index] = JSON.stringify(value);
	}


	return {
		// Address
		getAddress : function () {
			return getValue(INDEX_ADDRESS, DEFAULT_BOOLEAN());
		},

		setAddress : function (value) {
			setValue(INDEX_ADDRESS, value);
		},


		// Injecting 
		getInject : function () {
			return getValue(INDEX_INJECT, DEFAULT_BOOLEAN());
		},

		setInject : function (value) {
			setValue(INDEX_INJECT, value);
		},
		
		
		// Image
		getImage : function () {
			return getValue(INDEX_IMAGE, DEFAULT_BOOLEAN());
		},

		setImage : function (value) {
			setValue(INDEX_IMAGE, value);
		},


		// Links
		getLinks : function (callback) {
			return getObject(INDEX_LOOKUP, DEFAULT_ARRAY());
		},

		setLinks : function (value, callback) {
			setObject(INDEX_LINKS, value);
		},

		setSyncLinks : function (value, callback) {
			chrome.storage.sync.set({'links': value}, callback);
			setObject(INDEX_LINKS, value);
		},


		// Lookup
		getLookup : function () {
			return getObject(INDEX_LOOKUP, DEFAULT_OBJECT());
		},

		setLookup : function (value) {
			setObject(INDEX_LOOKUP, value);
		},

		setSyncLookup : function (value, callback) {
			chrome.storage.sync.set({'lookup': value}, callback);
			setObject(INDEX_LOOKUP, value);
		},

		// Syncing the localStorage objects
		sync : function (callback) {
			chrome.storage.sync.get('lookup', function (o1) {
				var lookup = o1.lookup || DEFAULT_ARRAY();
				setObject(INDEX_LOOKUP, lookup);

				chrome.storage.sync.get('links', function (o2) {
					var links = o2.links || DEFAULT_ARRAY();
					setObject(INDEX_LINKS, links);

					// Notify and return new values
					callback(lookup, links);
				});
			});
		}
	};
}());