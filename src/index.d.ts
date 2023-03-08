/**
 * Body
 *
 * Manages communication with server side services
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2023-03-03
 */
import * as constants from './constants';
import * as errors from './errors';
import * as regex from './regex';
export { constants, errors, regex };
export { default as Service } from './Service';
export type actionOptions = 'create' | 'delete' | 'read' | 'update';
export type callbackOptions = 'error' | 'errorCode' | 'requested' | 'requesting' | 'warning';
export type onCallbacks = {
    error?: onError;
    errorCode?: onErrorCode;
    requested?: onRequested;
    requesting?: onRequesting;
    warning?: onWarning;
};
export type onError = (error: string, info: onRequestedStruct) => void;
export type onErrorCode = (error: responseErrorStruct, info: onRequestedStruct) => void | false;
export type onRequested = (info: onRequestedStruct) => void;
export type onRequestedStruct = {
    action: actionOptions;
    data: any;
    res?: responseStruct;
    url: string;
    xhr: XMLHttpRequest;
};
export type onRequesting = (info: onRequestingStruct) => void;
export type onRequestingStruct = {
    action: actionOptions;
    data: any;
    url: string;
    xhr: XMLHttpRequest;
};
export type onWarning = (warning: any, info: onRequestedStruct) => void;
export type responseStruct = {
    data?: any;
    error?: responseErrorStruct;
    warning?: any;
};
export type responseErrorStruct = {
    code: number;
    msg?: any;
    handle?: (message: string) => void;
};
export type responseResolve = (res: responseStruct) => void;
export type responseReject = (error: responseErrorStruct) => boolean;
/**
 * Body
 *
 * The primary module class which handles communication with body services on
 * the server side
 *
 * @name Body
 */
declare class Body {
    private domain;
    private error;
    private errorCode;
    private noSession;
    private requested;
    private requesting;
    private token;
    private verbose;
    private warning;
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
    request(action: actionOptions, service: string, noun: string, data: any): Promise<any>;
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
    create(service: string, noun: string, data?: any): Promise<any>;
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
    delete(service: string, noun: string, data?: any): Promise<any>;
    /**
     * On
     *
     * Called to set multiple events at once
     *
     * @name on
     * @access public
     * @param callbacks A name to callback object to set multiple events
     */
    on(callbacks: onCallbacks): void;
    /**
     * On Error
     *
     * Sets the callback called after any request is sent out
     *
     * @name onError
     * @access public
     * @param callback The function to call after making requests
     */
    onError(callback: onError): void;
    /**
     * On No Session
     *
     * Sets callback for whenever a request gets a REST_AUTHORIZATION error
     *
     * @name onNoSession
     * @access public
     * @param callback The function to call if there's an error
     */
    onErrorCode(callback: onErrorCode): void;
    /**
     * On No Session
     *
     * Sets the callback called if any request fails the session
     *
     * @name onNoSession
     * @access public
     * @param callback The function to call if there are session errors
     */
    onNoSession(callback: () => void): void;
    /**
     * On Requested
     *
     * Sets the callback called after any request is sent out
     *
     * @name onRequested
     * @access public
     * @param callback The function to call after making requests
     */
    onRequested(callback: onRequested): void;
    /**
     * On Requesting
     *
     * Sets the callback called before any request is send out
     *
     * @name onRequesting
     * @access public
     * @param callback The function to call before making requests
     */
    onRequesting(callback: onRequesting): void;
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
    read(service: string, noun: string, data?: any): Promise<any>;
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
    session(token?: string | null): string | null | void;
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
    update(service: string, noun: string, data?: any): Promise<any>;
    /**
     * Verbose Off
     *
     * Called to turn verbose mode off
     *
     * @name verbose_off
     * @access
     */
    verbose_off(): void;
    /**
     * Verbose On
     *
     * Called to turn verbose mode on
     *
     * @name verbose_on
     * @access
     */
    verbose_on(): void;
}
declare const body: Body;
export default body;
