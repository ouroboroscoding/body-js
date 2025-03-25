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
// Actions to methods
const METHODS = {
    create: 'POST',
    delete: 'DELETE',
    read: 'GET',
    update: 'PUT'
};
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
    _domain = 'localhost';
    // The function to call for http and related errors that need to be reported
    error = null;
    // The function to call if we get body errors
    errorCode = null;
    // The function to call when we get a status 401, or error code
    //	REST_AUTHORIZATION
    noSession = null;
    // The function to call after any request is sent
    requested = null;
    // The function to call before any request is sent
    requesting = null;
    // The token associated with the current session
    token = null;
    // Flag for being verbose
    verbose = false;
    // The function to call if we get body warnings
    warning = null;
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
    domain(domain) {
        // If we are getting the token
        if (domain === undefined) {
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
    request(action, service, noun, data) {
        // Generate the URL for the request
        let url = `https://${this._domain}/${service}/${noun}`;
        // Init the response and json variables
        let res;
        let json;
        // If we got data
        if (data !== null) {
            // If we're in GET mode, append the data as a param "d" after
            //	turning it into JSON
            if (action === 'read') {
                url += '?d=' + encodeURIComponent(JSON.stringify(data));
            }
            else {
                json = JSON.stringify(data);
            }
        }
        // Set this
        const _ = this;
        // Handles an error based on whether an error handler is set
        function handleError(message) {
            if (_.error) {
                _.error(message, { action, data, url });
            }
            else {
                throw new Error(message);
            }
        }
        // Create a new Promise and return it
        return new Promise((resolve, reject) => {
            // Init the fetch init
            const fetchInit = {
                method: METHODS[action],
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            };
            // If we have a session token, add it as the Authorization header
            if (_.token) {
                fetchInit.headers.Authorization = _.token;
            }
            // If we have JSON
            if (json) {
                fetchInit.body = json;
            }
            // If we have a requesting callback, call it
            if (this.requesting) {
                this.requesting({ action, data, url });
            }
            // Make the call
            fetch(url, fetchInit).then(response => {
                // If 2xx
                if (response.ok) {
                    // If the Content-Type is missing or invalid
                    const ct = response.headers.get('Content-Type');
                    if (!ct || ct !== 'application/json; charset=utf-8') {
                        handleError(`${METHODS[action]} ${url} returned invalid Content-Type: ${ct}`);
                    }
                    // Return the JSON
                    return response.json();
                }
                // If it's 401
                if (response.status === 401) {
                    // If we have a no session callback
                    if (_.noSession) {
                        return _.noSession();
                    }
                    else {
                        throw new Error(`${METHODS[action]} ${url} return 401 NOT AUTHORIZED`);
                    }
                }
                // Else, invalid status
                else {
                    handleError(`${METHODS[action]} ${url} returned invalid status: ${response.status}`);
                }
            }).then(result => {
                // Set res
                res = result;
                // If we got an error
                if ('error' in result && result.error) {
                    // If we don't have an onErrorCode callback, or it we do and
                    //	calling it returns false
                    if (!_.errorCode ||
                        _.errorCode(result.error, { action, data, res, url }) === false) {
                        return reject(result.error);
                    }
                }
                // If we got data
                if ('data' in result) {
                    // Resolve it
                    return resolve(result.data);
                }
            }).catch(reason => {
                handleError(`${METHODS[action]} ${url} failed because of "${reason}"`);
            }).finally(() => {
                // If we have a requested callback
                if (this.requested) {
                    this.requested({ action, data, res, url });
                }
            });
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
    create(service, noun, data = null) {
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
    delete(service, noun, data = null) {
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
    on(callbacks) {
        for (const event of Object.keys(callbacks)) {
            switch (event) {
                case 'error':
                    this.error = callbacks.error;
                    continue;
                case 'errorCode':
                    this.errorCode = callbacks.errorCode;
                    continue;
                case 'requested':
                    this.requested = callbacks.requested;
                    continue;
                case 'requesting':
                    this.requesting = callbacks.requesting;
                    continue;
                case 'warning':
                    this.warning = callbacks.warning;
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
    onError(callback) {
        // Make sure the callback is function
        if (typeof callback !== 'function') {
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
     * @name onNoSession
     * @access public
     * @param callback The function to call if there's an error
     */
    onErrorCode(callback) {
        // Make sure the callback is function
        if (typeof callback !== 'function') {
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
    onNoSession(callback) {
        // Make sure the callback is function
        if (typeof callback !== 'function') {
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
    onRequested(callback) {
        // Make sure the callback is function
        if (typeof callback !== 'function') {
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
    onRequesting(callback) {
        // Make sure the callback is function
        if (typeof callback !== 'function') {
            throw new Error('onRequesting() called with an invalid callback');
        }
        // Set the callback
        this.requesting = callback;
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
    read(service, noun, data = null) {
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
    session(token) {
        // If we are getting the token
        if (token === undefined) {
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
    update(service, noun, data = null) {
        return this.request('update', service, noun, data);
    }
    /**
     * Verbose Off
     *
     * Called to turn verbose mode off
     *
     * @name verbose_off
     * @access
     */
    verbose_off() {
        this.verbose = false;
    }
    /**
     * Verbose On
     *
     * Called to turn verbose mode on
     *
     * @name verbose_on
     * @access
     */
    verbose_on() {
        this.verbose = true;
    }
}
// Create an instance of Body
const body = new Body();
// Export it as the default
export default body;
