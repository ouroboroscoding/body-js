/**
 * RegEx
 *
 * Holds common regular expressions
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2023-03-05
 */

// E-Mail address
export const EMAIL_ADDRESS = /^[^@\s]+@[^@\s]+\.[a-zA-Z0-9]{2,}$/

// North American Phone Number
export const PHONE_NUMBER_NA = /^\+?1?[ -]?\(?(\d{3})\)?[ -]?(\d{3})[ -]?(\d{4})$/