/**
 * Service
 *
 * Used to extend by modules that want to give direct access to a single service
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2023-03-05
 */

// Local modules
import body from './';

// Types
import {
	onError, onErrorCode, onRequested, onRequesting, responseStruct
} from './';

/**
 * Service
 *
 * Provides calls to create, read, update, and delete on one specific service
 *
 * @name Service
 */
export default class Service {

	// The service associated with this instance
	service: string;

	/**
	 * Constructor
	 *
	 * Creates a new instance
	 *
	 * @name Service
	 * @access public
	 * @param service The name of the service to make all requests to
	 * @returns a new instance
	 */
	constructor(service: string) {
		this.service = service;
	}

	/**
	 * Create
	 *
	 * Calls a create (POST) request on the service associated with this
	 * instance
	 *
	 * @name create
	 * @access public
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	create(noun: string, data: any = null): Promise<any> {
		return body.request('create', this.service, noun, data);
	}

	/**
	 * Delete
	 *
	 * Calls a delete (DELETE) request on the service associated with this
	 * instance
	 *
	 * @name delete
	 * @access public
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	delete(noun: string, data: any = null): Promise<any> {
		return body.request('delete', this.service, noun, data);
	}

	/**
	 * On Error
	 *
	 * Sets callback for whenever body has an error
	 *
	 * @name onError
	 * @access public
	 */
	onError(callback: onError): void {
		body.onError(callback);
	}

	/**
	 * On Error Code
	 *
	 * Sets callback for whenever an error code isn't handled internally
	 *
	 * @name onErrorCode
	 * @access public
	 */
	onErrorCode(callback: onErrorCode): void {
		body.onErrorCode(callback);
	}

	/**
	 * On Requested
	 *
	 * Sets the callback called after any request is sent out
	 *
	 * @name onRequesting
	 * @access public
	 * @param callback The function to call after making requests
	 */
	onRequested(callback: onRequested): void {
		return body.onRequested(callback);
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
		return body.onRequesting(callback);
	}

	/**
	 * Read
	 *
	 * Calls a read (GET) request on the service associated with this instance
	 *
	 * @name read
	 * @access public
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	read(noun: string, data: any = null): Promise<any> {
		return body.request('read', this.service, noun, data);
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
	session(token?: string): string | null | void {
		return body.session(token);
	}

	/**
	 * Update
	 *
	 * Calls a update (PUT) request on the service associated with this instance
	 *
	 * @name update
	 * @access public
	 * @param noun The noun to call on the service
	 * @param data The data associated with the request
	 */
	update(noun: string, data: any = null): Promise<any> {
		return body.request('update', this.service, noun, data);
	}
}