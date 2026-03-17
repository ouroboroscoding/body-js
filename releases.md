# @ouroboros/body releases

## 1.3.0
- Stopped splitting data and error into resolve and reject as this made it harder to identify and solve real communication problems. From now on all requests that are returned successfully, regardless of the result, are returned in full to resolve. This means all current `.then()` calls on requests must handle the full responseStruct result instead of just the `.data`. Similarly, any code currently running in the reject based on completed, but error filled, requests must be moved into the first argument of `.then()`.

## 1.2.2
- Fixed issue where `finally` not being called on Promises if 401 Not Authorized is returned.

## 1.2.1
- Fixed issue where 401 Not Authorized issues weren't properly handled causing thrown errors.

## 1.2.0
- Moved generated .js and .d.ts files into lib/ instead of build/, this changes the "main" from "build/index.js" to "lib/index.js".
- Removed `xhr2` from the project and replaced `XMLHttpRequest` with `fetch`.
- Removed `xhr` from `onRequestedStruct` and `onRequestingStruct`.
- Removed `Body.verbose_on()` and `Body.verbose_off()` functions as well as all `console.log` calls.
- Added missing `Body.onWarning` function.
- Added "noSession" as a valid key to the `on` function's argument.
- Added check in `Body.request` to trigger `this.warning` if a warning is returned.
- Added `domain`, `on`, and `onWarning` functions to `Service` class, each passes their arguments to, and returns from, the `body` function of the same name.
- Changed `body.domain` to getter/setter instead of just setter.