/**
 * @author Lasse Brudeskar Vikås
 */
var Magnetify = Magnetify || {};

/**
 * Stores and gets object in localStorage or chrome storage.
 */
(function (M) {
	'use strict';

    // Indexes
	var LINKS		= 'links',		// Clicking links
		INJECT 	= 'injecting',	// Inject listener on pages
		ADDRESS	= 'address',	// Check for address of URL in tab
		LOOKUP 	= 'lookup',		// Array of lookup object
		IMAGE		= 'image',		// Load images in listener
		MENU		= 'menu',		// Show context-menu

	// Shorthand
		storage = chrome.storage.sync;

	/**
	 *	Get an object from storage.
	 *
	 * @param 	{string} index The desired index to get
	 * @param 	{object} placeholder Default value to return if index not found
	 * @param 	{function} callback Called on completion with the right values
	 */
	function getValue(index, placeholder, callback) {
		storage.get(index, function(item) {
			// Check if item was unknown
			if (!item.hasOwnProperty(index)) {
				
				// Configure default object
				item[index] = placeholder;

			// Item found
			} else {

				// Fix boolean values
				if (item[index] === 'true') {
					item[index] = true;
				} else if (item[index] === 'false') {
					item[index] = false
				}
			}


			callback(item);
		});
	}


	/**
	 * Stores an object in storage
	 * @param {string} index Index of the object to set
	 * @param {object} value Object to be set
	 * @param {Function} callback Called on completion
	 */
	function setValue(index, value, callback) {
		var obj = {};
		obj[index] = value;
		storage.set(obj, callback);
	}


	function createGetterPromise(index, placeholder) {
		var promise = new Promise(function(resolve, reject) {
			getValue(index, placeholder, resolve);
		});

		return promise;
	}


	M.Storage = {

	    // Public variables
	    INDEX_LINKS		: LINKS,		// Clicking links
		INDEX_INJECT 	: INJECT,	// Inject listener on pages
		INDEX_ADDRESS	: ADDRESS,	// Check for address of URL in tab
		INDEX_LOOKUP 	: LOOKUP,		// Array of lookup object
		INDEX_IMAGE		: IMAGE,		// Load images in listener
		INDEX_MENU		: MENU,		// Show context-menu

		/**
		 * Get link
		 * 
		 * @param  {Function} cb Callback with value
		 */
		getLinks : function (cb) {
			getValue(LINKS, [], cb);
		},

		/**
		 * Set link
		 * 
		 * @param {boolean} value
		 * @param {Function} cb Callback on completion
		 */
		setLinks : function (value, cb) {
			setValue(LINKS, value, cb);
		},



		/**
		 * Get inject
		 * 
		 * @param  {Function} cb Callback with value
		 */
		getInject : function (cb) {
			getValue(INJECT, true, cb);
		},

		/**
		 * Set inject
		 * 
		 * @param {boolean} value
		 * @param {Function} cb Callback on completion
		 */
		setInject : function (value, cb) {
			setValue(INJECT, value, cb);
		},



		/**
		 * Get address
		 * 
		 * @param  {Function} cb Callback with value
		 */
		getAddress : function (cb) {
			getValue(ADDRESS, true, cb);
		},

		/**
		 * Set address
		 * 
		 * @param {boolean} value
		 * @param {Function} cb Callback on completion
		 */
		setAddress : function (value, cb) {
			setValue(ADDRESS, value, cb);
		},



		/**
		 * Get lookup
		 * 
		 * @param  {Function} cb Callback with value
		 */
		getLookup : function (cb) {
			getValue(LOOKUP, {}, cb);
		},

		/**
		 * Set lookup
		 * 
		 * @param {boolean} value
		 * @param {Function} cb Callback on completion
		 */
		setLookup : function (value, cb) {
			setValue(LOOKUP, value, cb);
		},



		/**
		 * Get image
		 * 
		 * @param  {Function} cb Callback with value
		 */
		getImage : function (cb) {
			getValue(IMAGE, true, cb);
		},

		/**
		 * Set image
		 * 
		 * @param {boolean} value
		 * @param {Function} cb Callback on completion
		 */
		setImage : function (value, cb) {
			setValue(IMAGE, value, cb);
		},



		/**
		 * Get image
		 * 
		 * @param  {Function} cb Callback with value
		 */
		getMenu : function (cb) {
			getValue(MENU, true, cb);
		},

		/**
		 * Set image
		 * 
		 * @param {boolean} value
		 * @param {Function} cb Callback on completion
		 */
		setMenu : function (value, cb) {
			setValue(MENU, value, cb);
		},




		/**
		 * Gets all synced values
		 * 
		 * @param  {Function} callback Callback with all values
		 */
		sync : function (callback) {		
			var promises = [
					createGetterPromise(LINKS, true),
					createGetterPromise(INJECT, true),
					createGetterPromise(ADDRESS, true),
					createGetterPromise(LOOKUP, {}),
					createGetterPromise(IMAGE, true),
					createGetterPromise(MENU, true)
			];

			Promise.all(promises).then(function(values) {
				callback(values);
			});
		}
	};
})(Magnetify);