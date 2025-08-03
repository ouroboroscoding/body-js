/**
 * Body
 *
 * Manages communication with server side services
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2023-03-03
 */

// Import const files
import * as constants from './constants';
import * as errors from './errors';
import * as regex from './regex';

// Then export them
export { constants, errors, regex };
export { default as Service } from './Service';

// Types
export type actionOptions = 'create' | 'delete' | 'read' | 'update';
export type onCallbacks = {
	error?: onError,
	errorCode?: onErrorCode,
	noSession?: () => void
	requested?: onRequested,
	requesting?: onRequesting,
	warning?: onWarning
}
export type onError = (error: string, info: onRequestedStruct) => void;
export type onErrorCode = (error: responseErrorStruct, info: onRequestedStruct) => void | false;
export type onRequested = (info: onRequestedStruct) => void;
export type onRequestedStruct = {
	action: actionOptions,
	data: any,
	res?: responseStruct,
	url: string
};
export type onRequesting = (info: onRequestingStruct) => void;
export type onRequestingStruct = {
	action: actionOptions,
	data: any,
	url: string
};
export type onWarning = (warning: any, info: onRequestedStruct) => void;
export type responseStruct = {
	data?: any,
	error?: responseErrorStruct,
	warning?: any
};
export type responseErrorStruct = {
	code: number,
	msg?: any
}
export type responseResolve = (res: responseStruct) => void;
export type responseReject = (error: responseErrorStruct) => boolean;

// Actions to methods
const METHODS = {
	create: 'POST',
	delete: 'DELETE',
	read: 'GET',
	update: 'PUT'
}

/**
 * Body
 *
 * The primary module class which handles communication with body services on
 * the server side
 *
 * @name Body
 */
class Body {

	// The domain used to make requests to
	private _domain: string = 'localhost';

	// The function to call for http and related errors that need to be reported
	private error: onError | null = null;

	// The function to call if we get body errors
	private errorCode: onErrorCode | null = null;

	// The function to call when we get a status 401, or error code
	//  REST_AUTHORIZATION
	private noSession: (() => void) | null = null;

	// The function to call after any request is sent
	private requested: onRequested | null = null;

	// The function to call before any request is sent
	private requesting: onRequesting | null = null;

	// The token associated with the current session
	private token: string | null = null;

	// The function to call if we get body warnings
	private warning: onWarning | null = null;

	/**
	 * Domain
	 *
	 * Sets/Gets the domain
	 *
	 * @name domain
	 * @access public
	 * @param @param domain The domain to set
	 * @returns the domain set
	 */
	domain(domain?: string): string | void {

		// If we are getting the token
		if(domain === undefined) {
			return this._domain;
		}

		// Else, we are setting the token
		else {
			this._domain = domain;
		}
	}

	/**
	 * Request
	 *
	 * Calls a request on the service given
	 *
	 * @name request
	 * @access public
	 * @param action The action to take in the call
	 * @param service The service to call
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	request(
		action: actionOptions,
		service: string,
		noun: string,
		data: any
	): Promise<any> {

		// Generate the URL for the request
		let url = `https://${this._domain}/${service}/${noun}`;

		// Init the response and json variables
		let res: responseStruct;
		let json: string;

		// If we got data
		if(data !== null) {

			// If we're in GET mode, append the data as a param "d" after
			//  turning it into JSON
			if(action === 'read') {
				url += '?d=' + encodeURIComponent(JSON.stringify(data));
			} else {
				json = JSON.stringify(data);
			}
		}

		// Set this
		const _ = this;

		// Handles an error based on whether an error handler is set
		function handleError(message: string): void {
			if(_.error) {
				_.error(message, { action, data, url });
			} else {
				throw new Error(message);
			}
		}

		// Create a new Promise and return it
		return new Promise((resolve: responseResolve, reject) => {

			// Init the fetch init
			const fetchInit: any = {
				method: METHODS[action],
				headers: {
					'Content-Type': 'application/json; charset=utf-8'
				}
			}

			// If we have a session token, add it as the Authorization header
			if(_.token) {
				fetchInit.headers.Authorization = _.token;
			}

			// If we have JSON
			if(json) {
				fetchInit.body = json;
			}

			// If we have a requesting callback, call it
			if(this.requesting) {
				this.requesting({ action, data, url });
			}

			// Make the call
			fetch(url, fetchInit).then(response => {

				// If 2xx
				if(response.ok) {

					// If the Content-Type is missing or invalid
					const ct = response.headers.get('Content-Type');
					if(!ct || ct !== 'application/json; charset=utf-8') {
						handleError(
							`${METHODS[action]} ${url} returned invalid Content-Type: ${ct}`
						);
					}

					// Return the JSON
					return response.json();
				}

				// If it's 401
				if(response.status === 401) {

					// If we have a no session callback
					if(_.noSession) {
						_.noSession();
						return Promise.resolve();
					} else {
						throw new Error(
							`${METHODS[action]} ${url} return 401 NOT AUTHORIZED`
						);
					}
				}
				// Else, invalid status
				else {
					handleError(
						`${METHODS[action]} ${url} returned invalid status: ${response.status}`
					);
				}

			}).then(result => {

				// If there's no result, do nothing
				if(!result) {
					return;
				}

				// Set res
				res = result;

				// If we got an error
				if('error' in result && result.error) {

					// If we don't have an onErrorCode callback, or we do and
					//  calling it returns false
					if(!_.errorCode ||
						_.errorCode(
							result.error as responseErrorStruct,
							{ action, data, res, url }
						) === false
					) {
						return reject(result.error);
					}
				}

				// If we got a warning and we have an onWarning callback
				if('warning' in result && result.warning && _.warning) {
					_.warning(
						result.warning, { action, data, res, url }
					);
				}

				// If we got data
				if('data' in result) {

					// Resolve it
					return resolve(result.data);
				}

			}).catch(reason => {
				handleError(
					`${METHODS[action]} ${url} failed because of "${reason}"`
				)

			}).finally(() => {

				// If we have a requested callback
				if(this.requested) {
					this.requested({ action, data, res, url });
				}
			})
		});
	}

	/**
	 * Create
	 *
	 * Calls a create (POST) request on the service given
	 *
	 * @name create
	 * @access public
	 * @param service The service to call
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	create(service: string, noun: string, data: any = null): Promise<any> {
		return this.request('create', service, noun, data);
	}

	/**
	 * Delete
	 *
	 * Calls a delete (DELETE) request on the service given
	 *
	 * @name delete
	 * @access public
	 * @param service The service to call
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	delete(service: string, noun: string, data: any = null): Promise<any> {
		return this.request('delete', service, noun, data);
	}

	/**
	 * On
	 *
	 * Called to set multiple events at once
	 *
	 * @name on
	 * @access public
	 * @param callbacks A name to callback object to set multiple events
	 */
	on(callbacks: onCallbacks): void {
		for(const event of Object.keys(callbacks)) {
			switch(event) {
				case 'error':
					this.error = callbacks.error as onError;
					continue;
				case 'errorCode':
					this.errorCode = callbacks.errorCode as onErrorCode;
					continue;
				case 'noSession':
					this.noSession = callbacks.noSession as () => void;
					continue;
				case 'requested':
					this.requested = callbacks.requested as onRequested;
					continue;
				case 'requesting':
					this.requesting = callbacks.requesting as onRequesting;
					continue;
				case 'warning':
					this.warning = callbacks.warning as onWarning;
					continue;
			}
		}
	}

	/**
	 * On Error
	 *
	 * Sets the callback called after any request is sent out
	 *
	 * @name onError
	 * @access public
	 * @param callback The function to call after making requests
	 */
	onError(callback: onError): void {

		// Make sure the callback is function
		if(typeof callback !== 'function') {
			throw new Error('onError() called with an invalid callback');
		}

		// Set the callback
		this.error = callback;
	}

	/**
	 * On Error Code
	 *
	 * Sets callback for whenever a request gets an error back
	 *
	 * @name onErrorCode
	 * @access public
	 * @param callback The function to call if there's an error
	 */
	onErrorCode(callback: onErrorCode): void {

		// Make sure the callback is function
		if(typeof callback !== 'function') {
			throw new Error('onErrorCode() called with an invalid callback');
		}

		// Set the callback
		this.errorCode = callback;
	}

	/**
	 * On No Session
	 *
	 * Sets the callback called if any request fails the session
	 *
	 * @name onNoSession
	 * @access public
	 * @param callback The function to call if there are session errors
	 */
	onNoSession(callback: () => void): void {

		// Make sure the callback is function
		if(typeof callback !== 'function') {
			throw new Error('onNoSession() called with an invalid callback');
		}

		// Set the callback
		this.noSession = callback;
	}

	/**
	 * On Requested
	 *
	 * Sets the callback called after any request is sent out
	 *
	 * @name onRequested
	 * @access public
	 * @param callback The function to call after making requests
	 */
	onRequested(callback: onRequested): void {

		// Make sure the callback is function
		if(typeof callback !== 'function') {
			throw new Error('onRequested() called with an invalid callback');
		}

		// Set the callback
		this.requested = callback;
	}

	/**
	 * On Requesting
	 *
	 * Sets the callback called before any request is send out
	 *
	 * @name onRequesting
	 * @access public
	 * @param callback The function to call before making requests
	 */
	onRequesting(callback: onRequesting): void {

		// Make sure the callback is function
		if(typeof callback !== 'function') {
			throw new Error('onRequesting() called with an invalid callback');
		}

		// Set the callback
		this.requesting = callback;
	}

	/**
	 * On Warning
	 *
	 * Sets callback for whenever a request gets a warning back
	 *
	 * @name onWarning
	 * @access public
	 * @param callback The function to call if there's a warning
	 */
	onWarning(callback: onWarning): void {

		// Make sure the callback is function
		if(typeof callback !== 'function') {
			throw new Error('onWarning() called with an invalid callback');
		}

		// Set the callback
		this.warning = callback;
	}

	/**
	 * Read
	 *
	 * Calls a read (GET) request on the service given
	 *
	 * @name read
	 * @access public
	 * @param service The service to call
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	read(service: string, noun: string, data: any = null): Promise<any> {
		return this.request('read', service, noun, data);
	}

	/**
	 * Session
	 *
	 * Set/Gets the current session token
	 *
	 * @name session
	 * @access public
	 * @param token The session to set
	 * @returns the session set
	 */
	session(token?: string | null): string | null | void {

		// If we are getting the token
		if(token === undefined) {
			return this.token;
		}

		// Else, we are setting the token
		else {
			this.token = token;
		}
	}

	/**
	 * Update
	 *
	 * Calls a update (PUT) request on the service given
	 *
	 * @name update
	 * @access public
	 * @param service The service to call
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	update(service: string, noun: string, data: any = null): Promise<any> {
		return this.request('update', service, noun, data);
	}
}

// Create an instance of Body
const body = new Body();

// Export it as the default
export default body;