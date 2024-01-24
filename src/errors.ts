/**
 * Errors
 *
 * Holds constants for error codes
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2023-03-05
 */

// Rest-OC REST related
export const REST_REQUEST_DATA = 100
export const REST_CONTENT_TYPE = 101
export const REST_AUTHORIZATION = 102
export const REST_LIST_TO_LONG = 103
export const REST_LIST_INVALID_URI = 104

// Rest-OC Service related
export const SERVICE_ACTION = 200
export const SERVICE_STATUS = 201
export const SERVICE_CONTENT_TYPE = 202
export const SERVICE_UNREACHABLE = 203
export const SERVICE_NOT_REGISTERED = 204
export const SERVICE_NO_SUCH_NOUN = 205
export const SERVICE_INTERNAL_KEY = 206
export const SERVICE_CRASHED = 207
export const SERVICE_NO_DATA = 208
export const SERVICE_NO_SESSION = 209

// Body related
export const RIGHTS = 1000
export const DATA_FIELDS = 1001
export const ALREADY_DONE = 1002

// DB related
export const DB_NO_RECORD = 1100
export const DB_DUPLICATE = 1101
export const DB_CREATE_FAILED = 1102
export const DB_DELETE_FAILED = 1103
export const DB_UPDATE_FAILED = 1104
export const DB_KEY_BEING_USED = 1105
export const DB_ARCHIVED = 1106
export const DB_REFERENCES = 1107