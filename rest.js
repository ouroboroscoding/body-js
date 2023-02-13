/**
 * Rest
 *
 * Handles connecting to and retrieving data from rest services
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2018-11-24
 */

// External modules
import $ from './jquery.ajax';

// Generic modules
import { cookies } from '@ouroboros/browser';

// Global data
let _conf = {
	after: null,
	before: null,
	cookie: '',
	domain: '',
	error: null,
	errors: {},
	session: null,
	success: null,
	use_session: true
}

/**
 * Clear
 *
 * Clears the session from the conf and cookie
 *
 * @name clear
 * access private
 * @return void
 */
function clear() {

	// Clear the session
	_conf.session = null;

	// Delete the cookie
	cookies.remove('_session', _conf.cookie, '/');
}

/**
 * Request
 *
 * Handles actual requests
 *
 * @name request
 * @access private
 * @param string method			The method used to send the request
 * @param string url			The full URL to the service/noun
 * @param object data			The data to send to the service
 * @param object opts			Optional flags that can be set
 * @return xhr
 */
function request(method, url, data, opts) {

	if(!window.navigator.onLine) {
		console.error('Not connected to internet');

		// Create the response object
		let oResponse = {
			_handled: false,
			error: {code: -1}
		}

		// Call the success callback if there is one
		if(_conf.success) {
			_conf.success(oResponse);
		}

		// Return an object with a done function
		return {done: callback => callback(oResponse)};
	}

	// If session opts is not set
	if(!('session' in opts)) {
		opts['session'] = _conf.use_session;
	}

	// If we have a before callback
	if(_conf.before) {
		_conf.before(method, url, data, opts);
	}

	// Generate the ajax config
	let oConfig = {

		// Check requests before sending
		beforeSend: (xhr, settings) => {

			// Add the URL to the request so that on error what failed
			xhr._url = url;

			// If we have a session, add the authorization token
			if(opts['session'] && _conf.session) {
				xhr.setRequestHeader('Authorization', _conf.session);
			}
		},

		// Looking for JSON responses
		contentType: "application/json; charset=utf-8",

		// Called when the requested is completed, whether success or error
		complete: res => {

			// If we have an after callback
			if(_conf.after) {
				_conf.after(method, url, data, opts);
			}
		},

		// On error
		error: (xhr, status, error) => {

			// If we got an Authorization error
			if(xhr.status === 401) {

				// Clear the current token
				clear();
			}

			// Put the error in the console
			console.error(method + ' ' + xhr._url + ' returned: ' + error);

			// Return the xhr to the error callback if there is one
			if(_conf.error) {
				_conf.error(xhr);
			}
		},

		// Set the method
		method: method,

		// Called when the request is successful
		success: res => {

			// Set the default value of the handled flag
			res._handled = false;

			// Call the success callback if there is one
			if(_conf.success) {
				_conf.success(res);
			}
		},

		// Set the requested URL
		url: url
	}

	// If it's a get request
	if(method === 'get') {

		// And data was passed, add it as a param
		if(typeof data !== 'undefined') {
			oConfig['data'] = "d=" + encodeURIComponent(JSON.stringify(data));
		}
	}

	// Else it's any other method, stringify the data
	else {
		oConfig.data = JSON.stringify(data);
	}

	// Make the request and return the xhr
	return $.ajax(oConfig);
}

/**
 * Store
 *
 * Stores the session token in the conf and cookie
 *
 * @name store
 * @access private
 * @param string token
 * @return void
 */
function store(token) {

	// Store the session
	_conf.session = token;

	// Set the session in a cookie
	cookies.set('_session', token, 86400, _conf.cookie, '/');
}

/**
 * Init
 *
 * Initialises the modules
 *
 * @name init
 * @access public
 * @param string domain		The domain rest services can be reached through
 * @param string cookie		The domain to store the cookie on
 * @param Object opts		Optional settings
 *								after: optional callback to run after all requests
 *								before:	optional callback to run before all requests
 *								cookie: optional domain for storing the session cookie in
 *								error: optional callback for when http errors occur
 *								errors: optional object of error codes to messages
 *								success: optional callback for after successful requests
 *								use_session: optional flag to allow for never using sessions
 * @return void
 */
function init(domain, opts={}) {

	// Store the domains
	_conf.domain = 'https://' + domain + '/';
	_conf.cookie = 'cookie' in opts ? opts['cookie'] : domain;

	// Check for use_session flag
	if(!('use_session' in opts)) {
		opts['use_session'] = true;
	}

	// If we are using sessions
	if(opts['use_session']) {

		// If we don't already have it
		if(!_conf.session) {

			// Is it in a cookie?
			let cookie = cookies.get('_session');
			if(cookie) {
				this.session(cookie);
			}
		}
	}

	// Store errors
	if('errors' in opts) {
		_conf.errors = opts.errors;
	}

	// Store callbacks
	if('error' in opts) {
		if(typeof opts['error'] === 'function') {
			_conf.error = opts['error'];
		} else {
			console.error('Rest.init \'error\' param must be a function');
		}
	}
	if('before' in opts) {
		if(typeof opts['before'] === 'function') {
			_conf.before = opts['before'];
		} else {
			console.error('Rest.init \'before\' param must be a function');
		}
	}
	if('after' in opts) {
		if(typeof opts['after'] === 'function') {
			_conf.after = opts['after'];
		} else {
			console.error('Rest.init \'after\' param must be a function');
		}
	}
	if('success' in opts) {
		if(typeof opts['success'] === 'function') {
			_conf.success = opts['success'];
		} else {
			console.error('Rest.init \'success\' param must be a function');
		}
	}
}

/**
 * Create
 *
 * Calls the create action on a specific service noune
 *
 * @name create
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @param object opts			Optional flags that can be set
 * @return xhr
 */
function create(service, noun, data, opts={}) {
	return request('post', _conf.domain + service + '/' + noun, data, opts);
}

/**
 * Delete
 *
 * Calls the delete action on a specific service noune
 *
 * @name delete_
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @param object opts			Optional flags that can be set
 * @return xhr
 */
function delete_(service, noun, data, opts={}) {
	return request('delete', _conf.domain + service + '/' + noun, data, opts);
}

/**
 * Generic Error Message
 *
 * Returns an error message based on the errors passed to Rest at init
 *
 * @name
 * @access public
 * @param Object error The 'code' and 'msg'
 * @return String
 */
function errorMessage(error) {

	// Convert the code to a string
	let sCode = error.code.toString();

	// If the code is in the errors
	if(sCode in _conf.errors) {
		return _conf.errors[sCode];
	} else {
		return 'msg' in error ? error.msg + ' (' + sCode + ')' : sCode;
	}
}

/**
 * Read
 *
 * Calls the read action on a specific service noune
 *
 * @name read
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @param object opts			Optional flags that can be set
 * @return xhr
 */
function read(service, noun, data={}, opts={}) {
	return request('get', _conf.domain + service + '/' + noun, data, opts);
}

/**
 * Session
 *
 * Set or get the session token
 *
 * @name session
 * @access public
 * @param string token			The token to store
 * @return void|str
 */
function session(token) {

	// If we are setting the session
	if(typeof token !== 'undefined') {

		// If null was passed, delete the session
		if(token == null) {
			clear();
		}

		// Else, set the session
		else {
			store(token);
		}
	}

	// Else we are returning the session
	else {
		return _conf.session;
	}
}

/**
 * Update
 *
 * Calls the update action on a specific service noune
 *
 * @name update
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @param object opts			Optional flags that can be set
 * @return xhr
 */
function update(service, noun, data, opts={}) {
	return request('put', _conf.domain + service + '/' + noun, data, opts);
}

// Default export
const rest = {
	init: init,
	create: create,
	delete: delete_,
	errorMessage: errorMessage,
	read: read,
	session: session,
	update: update
};
export default rest;