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
// 30 second timeout
const REQUEST_TIMEOUT = 30000;
/**
 * Uses Cookie Sessions
 *
 * Effectively checks if we're in a browser or not
 *
 * @name usesCookieSession
 * @returns boolean
 */
export function usesCookieSession() {
    return typeof document !== 'undefined'
        && typeof document.cookie === 'string';
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
    _domain = 'localhost';
    // The function to call for http and related errors that need to be reported
    error = null;
    // The function to call if we get body errors
    errorCode = null;
    // The function to call when we get a status 401, or error code
    //  REST_AUTHORIZATION
    noSession = null;
    // The function to call after any request is sent
    requested = null;
    // The function to call before any request is sent
    requesting = null;
    // The token associated with the current session
    token = null;
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
        // If no error handler was assigned
        if (!this.error) {
            throw new Error('Must assign an error handler via body.on(\'error\', handler)' +
                ' or body.onError(handler)');
        }
        // Generate the URL for the request
        let url = `https://${this._domain}/${service}/${noun}`;
        // Init the response and json variables
        let res;
        let json;
        // If we got data
        if (data !== null) {
            // If we're in GET mode, append the data as a param "d" after
            //  turning it into JSON
            if (action === 'read') {
                url += '?d=' + encodeURIComponent(JSON.stringify(data));
            }
            else {
                json = JSON.stringify(data);
            }
        }
        // Set this
        const _ = this;
        // Create a new Promise and return it
        return new Promise((resolve, reject) => {
            // Handle errors the same way every time
            function handleError(reason) {
                // Generate the error message
                const err = `${METHODS[action]} ${url} ${reason}`;
                // Call the error handler
                _.error(err, { action, data, url });
                // Return reject path
                return reject({ code: 0, msg: err });
            }
            // Create an abort controller for timeouts
            const controller = new AbortController();
            // Init the fetch init
            const fetchInit = {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                method: METHODS[action],
                signal: controller.signal
            };
            // If we're in a browser or some other client that uses cookies
            if (usesCookieSession()) {
                fetchInit.credentials = 'include';
            }
            // Start a timer so we timeout if the request doesn't return
            const timer = setTimeout(() => {
                controller.abort();
            }, REQUEST_TIMEOUT);
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
                        return handleError(`returned invalid Content-Type: "${ct}"`);
                    }
                    // Return the JSON
                    return response.json().then(result => {
                        // If there's no result, return an error + reject
                        if (!result) {
                            return handleError('returned: empty JSON');
                        }
                        // Set res
                        res = result;
                        // Init the structure to pass to resolve
                        const oResult = {};
                        // If we got an error
                        if ('error' in result && result.error) {
                            // If we don't have an onErrorCode callback, or we
                            //	do and calling it returns false
                            if (!_.errorCode ||
                                _.errorCode(result.error, { action, data, res, url }) === false) {
                                // If it wasn't handled, add it to the result
                                oResult.error = structuredClone(result.error);
                            }
                        }
                        // If we got a warning
                        if ('warning' in result && result.warning) {
                            // If we don't have an onWarning callback, or we do
                            //	and calling it returns false
                            if (!_.warning ||
                                _.warning(result.warning, { action, data, res, url }) === false) {
                                // If it wasn't handled, add it to the result
                                oResult.warning = structuredClone(result.warning);
                            }
                        }
                        // If we got data
                        if ('data' in result) {
                            // Add it
                            oResult.data = structuredClone(result.data);
                        }
                        // Resolve
                        return resolve(oResult);
                    });
                }
                // If it's 401
                else if (response.status === 401) {
                    // If we have a no session callback
                    if (_.noSession) {
                        _.noSession();
                    }
                    // Reject the request
                    return handleError('returned: 401 NOT AUTHORIZED');
                }
                // Else, invalid status
                return handleError(`returned: invalid status ${response.status}`);
            }).catch(reason => {
                return handleError(`failed with: "${String(reason)}"`);
            }).finally(() => {
                // Clear the timeout timer
                clearTimeout(timer);
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
                case 'noSession':
                    this.noSession = callbacks.noSession;
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
     * @name onErrorCode
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
     * On Warning
     *
     * Sets callback for whenever a request gets a warning back
     *
     * @name onWarning
     * @access public
     * @param callback The function to call if there's a warning
     */
    onWarning(callback) {
        // Make sure the callback is function
        if (typeof callback !== 'function') {
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
}
// Create an instance of Body
const body = new Body();
// Export it as the default
export default body;
