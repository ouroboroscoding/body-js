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
const ACTIONS_TO_METHODS = {
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
    _domain = '';
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
     * Set the domain
     *
     * @name domain
     * @access public
     * @param domain The name of the domain to connect to
     */
    domain(domain) {
        this._domain = domain;
    }
    /**
     * Request
     *
     * Calls a request on the service given
     *
     * @name request
     * @access public
     * @param service The service to call
     * @param noun The noun to call on the service
     * @param data The data associated with the request
     */
    request(action, service, noun, data) {
        // Generate the URL for the request
        let url = `https://${this._domain}/${service}/${noun}`;
        // Init the response object
        let res;
        // Set this
        const $this = this;
        // Create a new Promise and return it
        return new Promise((resolve, reject) => {
            // Create a new XMLHttpRequest
            const xhr = new XMLHttpRequest();
            // Handles an error based on whether an error handler is set
            function handleError(message) {
                if ($this.error) {
                    $this.error(message, { action, data, res, url, xhr });
                }
                else {
                    throw new Error(message);
                }
            }
            // Track abort
            xhr.addEventListener('abort', event => {
                if (this.verbose) {
                    console.log(`xhr.abort:\n\t${ACTIONS_TO_METHODS[action]} ${url}\n\t`, event);
                }
                handleError(`${ACTIONS_TO_METHODS[action]} ${url} was aborted`);
            });
            // Track errors
            xhr.addEventListener('error', event => {
                if (this.verbose) {
                    console.log(`xhr.error:\n\t${ACTIONS_TO_METHODS[action]} ${url}\n\t`, event);
                }
                handleError(`${ACTIONS_TO_METHODS[action]} ${url} failed to connect`);
            });
            // Handle successful request
            xhr.addEventListener('load', (event) => {
                if (this.verbose) {
                    console.log(`xhr.load:\n\t${ACTIONS_TO_METHODS[action]} ${url}\n\t`, event);
                }
                // If we got anything other than 200
                if (xhr.status !== 200) {
                    // If it's 401
                    if (xhr.status === 401) {
                        // If we have a no session callback
                        if (this.noSession) {
                            return this.noSession();
                        }
                        else {
                            throw new Error(`${ACTIONS_TO_METHODS[action]} ${url} return 401 NOT AUTHORIZED`);
                        }
                    }
                    // Else, invalid status
                    else {
                        handleError(`${ACTIONS_TO_METHODS[action]} ${url} returned invalid status: ${xhr.status}`);
                    }
                }
                // If the Content-Type is missing or invalid
                const contentType = xhr.getResponseHeader('Content-Type');
                if (!contentType || contentType !== 'application/json; charset=utf-8') {
                    handleError(`${ACTIONS_TO_METHODS[action]} ${url} returned invalid Content-Type: ${contentType}`);
                }
                // Convert the text from JSON
                res = JSON.parse(xhr.responseText);
                // If the JSON failed to parse
                if (!res) {
                    handleError(`${ACTIONS_TO_METHODS[action]} ${url} returned invalid JSON: ${xhr.responseText}`);
                }
                // If we got an error
                if ('error' in res && res.error) {
                    // Add the handle error function to it
                    res.error.handle = handleError;
                    // If we don't have an onErrorCode callback, or it we do and
                    //	calling it returns false
                    if (!this.errorCode || this.errorCode(res.error, { action, data, res, url, xhr }) === false) {
                        return reject(res.error);
                    }
                }
                // If we got data
                if ('data' in res) {
                    // Resolve it
                    return resolve(res.data);
                }
            });
            // Handle the request being finished
            xhr.addEventListener('loadend', (event) => {
                if (this.verbose) {
                    console.log(`xhr.loadend:\n\t${ACTIONS_TO_METHODS[action]} ${url}\n\t`, event);
                }
                // If we have a requested callback
                if (this.requested) {
                    this.requested({ action, data, res, url, xhr });
                }
            });
            // Init the request body
            let xml = '';
            // If we got data
            if (data !== null) {
                // If we're in GET mode
                if (action === 'read') {
                    // Append the data as a param
                    url += '?d=' + encodeURIComponent(JSON.stringify(data));
                }
                // Else, DELETE, POST, PUT, just encode the data
                else {
                    xml = JSON.stringify(data);
                }
            }
            // Open the request
            xhr.open(ACTIONS_TO_METHODS[action], url);
            // If we have a session token, add it as the Authorization header
            if (this.token) {
                xhr.setRequestHeader('Authorization', this.token);
            }
            // Set the Content-Type header
            xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
            // If we have a requesting callback, call it
            if (this.requesting) {
                this.requesting({ action, data, url, xhr });
            }
            // Send the request
            xhr.send(xml);
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
     * On No Session
     *
     * Sets callback for whenever a request gets a REST_AUTHORIZATION error
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
